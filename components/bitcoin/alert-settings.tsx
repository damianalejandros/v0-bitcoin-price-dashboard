"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell, BellOff, BellRing, Mail, MessageCircle, Send } from "lucide-react"

interface AlertSettingsProps {
  currentPrice: number | undefined
}

type NotificationChannel = "browser" | "email" | "telegram" | "whatsapp"

interface NotificationConfig {
  browser: boolean
  email: boolean
  telegram: boolean
  whatsapp: boolean
  emailAddress: string
  telegramChatId: string
  phoneNumber: string
}

export function AlertSettings({ currentPrice }: AlertSettingsProps) {
  const [alertPercent, setAlertPercent] = useState<string>("5")
  const [isAlertActive, setIsAlertActive] = useState(false)
  const [basePrice, setBasePrice] = useState<number | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const hasTriggeredRef = useRef(false)
  const lastCheckedPriceRef = useRef<number | null>(null)
  
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    browser: true,
    email: false,
    telegram: false,
    whatsapp: false,
    emailAddress: "",
    telegramChatId: "",
    phoneNumber: "",
  })

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      return permission === "granted"
    }
    return false
  }

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.log("[v0] Browser notifications not supported")
      return
    }
    
    console.log("[v0] Attempting browser notification - Permission:", Notification.permission)
    
    if (Notification.permission === "granted") {
      try {
        const notification = new Notification(title, {
          body,
          icon: "/bitcoin-icon.png",
          tag: "bitcoin-alert-" + Date.now(),
          requireInteraction: true,
          silent: false,
        })
        console.log("[v0] Browser notification sent successfully")
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      } catch (error) {
        console.error("[v0] Error sending notification:", error)
      }
    } else {
      console.log("[v0] Browser notifications not granted")
    }
  }, [])

  const sendEmailNotification = useCallback(async (subject: string, body: string) => {
    if (!notificationConfig.emailAddress) return
    
    const mailtoLink = `mailto:${notificationConfig.emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink, "_blank")
  }, [notificationConfig.emailAddress])

  const sendTelegramNotification = useCallback(async (message: string) => {
    if (!notificationConfig.telegramChatId) return
    
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(message)}&text=${encodeURIComponent("Bitcoin Price Alert")}`
    window.open(telegramUrl, "_blank")
  }, [notificationConfig.telegramChatId])

  const sendWhatsAppNotification = useCallback((message: string) => {
    const phone = notificationConfig.phoneNumber.replace(/\D/g, "")
    const whatsappUrl = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }, [notificationConfig.phoneNumber])

  const sendAllNotifications = useCallback((title: string, body: string) => {
    if (notificationConfig.browser) {
      sendBrowserNotification(title, body)
    }
    if (notificationConfig.email) {
      sendEmailNotification(title, body)
    }
    if (notificationConfig.telegram) {
      sendTelegramNotification(`${title}\n\n${body}`)
    }
    if (notificationConfig.whatsapp) {
      sendWhatsAppNotification(`${title}\n\n${body}`)
    }
  }, [notificationConfig, sendBrowserNotification, sendEmailNotification, sendTelegramNotification, sendWhatsAppNotification])

  const activateAlert = async () => {
    if (!currentPrice) return

    if (notificationConfig.browser && notificationPermission !== "granted") {
      const granted = await requestNotificationPermission()
      if (!granted && notificationConfig.browser) {
        const otherChannels = notificationConfig.email || notificationConfig.telegram || notificationConfig.whatsapp
        if (!otherChannels) {
          alert("Please enable browser notifications or select another notification channel")
          return
        }
      }
    }

    const hasAnyChannel = notificationConfig.browser || notificationConfig.email || notificationConfig.telegram || notificationConfig.whatsapp
    if (!hasAnyChannel) {
      alert("Please select at least one notification channel")
      return
    }

    setBasePrice(currentPrice)
    setIsAlertActive(true)
    hasTriggeredRef.current = false
    lastCheckedPriceRef.current = currentPrice
  }

  const deactivateAlert = () => {
    setIsAlertActive(false)
    setBasePrice(null)
    hasTriggeredRef.current = false
    lastCheckedPriceRef.current = null
  }

  // Monitor price changes with interval-based checking
  useEffect(() => {
    if (!isAlertActive || !basePrice) return

    const checkPrice = () => {
      if (!currentPrice || hasTriggeredRef.current) return
      
      const percentChange = ((currentPrice - basePrice) / basePrice) * 100
      const threshold = parseFloat(alertPercent)

      console.log("[v0] Alert check - Current:", currentPrice, "Base:", basePrice, "Change:", percentChange.toFixed(2) + "%", "Threshold:", threshold + "%")

      if (Math.abs(percentChange) >= threshold) {
        hasTriggeredRef.current = true
        const direction = percentChange > 0 ? "increased" : "decreased"
        const message = `BTC has ${direction} by ${Math.abs(percentChange).toFixed(2)}% to $${currentPrice.toLocaleString()}`
        
        console.log("[v0] Alert triggered!", message)
        sendAllNotifications("Bitcoin Price Alert", message)
        deactivateAlert()
      }
    }

    // Check immediately
    checkPrice()

    // Set up interval to check every second
    const intervalId = setInterval(checkPrice, 1000)

    return () => clearInterval(intervalId)
  }, [currentPrice, isAlertActive, basePrice, alertPercent, sendAllNotifications])

  const updateConfig = (channel: NotificationChannel, value: boolean) => {
    setNotificationConfig(prev => ({ ...prev, [channel]: value }))
  }

  const targetPriceUp = basePrice ? basePrice * (1 + parseFloat(alertPercent) / 100) : null
  const targetPriceDown = basePrice ? basePrice * (1 - parseFloat(alertPercent) / 100) : null

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Bell className="h-5 w-5" />
            Price Alert
          </span>
          {isAlertActive && (
            <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              <BellRing className="h-3 w-3 mr-1 animate-pulse" />
              Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="alert-percent" className="text-sm text-muted-foreground">
            Alert when price changes by (%)
          </Label>
          <div className="flex gap-2">
            <Input
              id="alert-percent"
              type="number"
              value={alertPercent}
              onChange={(e) => setAlertPercent(e.target.value)}
              placeholder="5"
              min="0.1"
              max="100"
              step="0.1"
              disabled={isAlertActive}
              className="w-24"
            />
            <span className="flex items-center text-muted-foreground">%</span>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-border/50">
          <Label className="text-sm text-muted-foreground">Notification Channels</Label>
          
          <div className="flex items-center gap-2">
            <Checkbox 
              id="browser-notif" 
              checked={notificationConfig.browser}
              onCheckedChange={(checked) => updateConfig("browser", !!checked)}
              disabled={isAlertActive}
            />
            <Label htmlFor="browser-notif" className="flex items-center gap-2 text-sm cursor-pointer">
              <Bell className="h-4 w-4" />
              Browser Notification
            </Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="email-notif" 
                checked={notificationConfig.email}
                onCheckedChange={(checked) => updateConfig("email", !!checked)}
                disabled={isAlertActive}
              />
              <Label htmlFor="email-notif" className="flex items-center gap-2 text-sm cursor-pointer">
                <Mail className="h-4 w-4" />
                Email
              </Label>
            </div>
            {notificationConfig.email && (
              <Input
                type="email"
                placeholder="your@email.com"
                value={notificationConfig.emailAddress}
                onChange={(e) => setNotificationConfig(prev => ({ ...prev, emailAddress: e.target.value }))}
                disabled={isAlertActive}
                className="ml-6 w-[calc(100%-1.5rem)]"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="telegram-notif" 
                checked={notificationConfig.telegram}
                onCheckedChange={(checked) => updateConfig("telegram", !!checked)}
                disabled={isAlertActive}
              />
              <Label htmlFor="telegram-notif" className="flex items-center gap-2 text-sm cursor-pointer">
                <Send className="h-4 w-4" />
                Telegram
              </Label>
            </div>
            {notificationConfig.telegram && (
              <Input
                type="text"
                placeholder="Your Telegram username"
                value={notificationConfig.telegramChatId}
                onChange={(e) => setNotificationConfig(prev => ({ ...prev, telegramChatId: e.target.value }))}
                disabled={isAlertActive}
                className="ml-6 w-[calc(100%-1.5rem)]"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="whatsapp-notif" 
                checked={notificationConfig.whatsapp}
                onCheckedChange={(checked) => updateConfig("whatsapp", !!checked)}
                disabled={isAlertActive}
              />
              <Label htmlFor="whatsapp-notif" className="flex items-center gap-2 text-sm cursor-pointer">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Label>
            </div>
            {notificationConfig.whatsapp && (
              <Input
                type="tel"
                placeholder="+1234567890 (optional)"
                value={notificationConfig.phoneNumber}
                onChange={(e) => setNotificationConfig(prev => ({ ...prev, phoneNumber: e.target.value }))}
                disabled={isAlertActive}
                className="ml-6 w-[calc(100%-1.5rem)]"
              />
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {!isAlertActive ? (
            <Button onClick={activateAlert} disabled={!currentPrice} className="flex-1">
              <Bell className="h-4 w-4 mr-2" />
              Activate Alert
            </Button>
          ) : (
            <Button onClick={deactivateAlert} variant="outline" className="flex-1">
              <BellOff className="h-4 w-4 mr-2" />
              Deactivate
            </Button>
          )}
        </div>

        {isAlertActive && basePrice && currentPrice && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Monitoring from base price:</p>
              <p className="text-xs font-mono text-muted-foreground">
                Current change: {((currentPrice - basePrice) / basePrice * 100).toFixed(3)}%
              </p>
            </div>
            <p className="font-medium">
              ${basePrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-emerald-500">Target Up (+{alertPercent}%)</p>
                <p className="font-medium text-foreground">
                  ${targetPriceUp?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                <p className="text-red-500">Target Down (-{alertPercent}%)</p>
                <p className="font-medium text-foreground">
                  ${targetPriceDown?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}

        {!isAlertActive && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => sendBrowserNotification("Test Notification", "Browser notifications are working!")}
            className="w-full text-xs text-muted-foreground"
          >
            Test Browser Notification
          </Button>
        )}

        {notificationConfig.browser && notificationPermission === "denied" && (
          <p className="text-xs text-red-500">
            Browser notifications are blocked. Please enable them in your browser settings.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
