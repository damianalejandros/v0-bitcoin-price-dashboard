"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff, BellRing, Download, Smartphone } from "lucide-react"

interface AlertSettingsProps {
  currentPrice: number | undefined
}

export function AlertSettings({ currentPrice }: AlertSettingsProps) {
  const [alertPercent, setAlertPercent] = useState<string>("5")
  const [isAlertActive, setIsAlertActive] = useState(false)
  const [basePrice, setBasePrice] = useState<number | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const hasTriggeredRef = useRef(false)

  // Register service worker
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((registration) => {
          setSwRegistration(registration)
        })
        .catch((error) => {
          console.error("SW registration failed:", error)
        })
    }

    // Check notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission)
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === "accepted") {
      setIsInstallable(false)
    }
    setDeferredPrompt(null)
  }

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false
    }

    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
    return permission === "granted"
  }

  const sendNotification = useCallback((title: string, body: string) => {
    // Try service worker notification first (works better on mobile/Android)
    if (swRegistration?.active) {
      swRegistration.active.postMessage({
        type: "SHOW_NOTIFICATION",
        title,
        body
      })
      return
    }

    // Fallback to regular notification
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/icon-192.png",
          tag: "btc-alert-" + Date.now(),
          requireInteraction: true,
          silent: false,
        })
      } catch (error) {
        // On mobile, Notification constructor might fail, use SW instead
        if (swRegistration) {
          swRegistration.showNotification(title, {
            body,
            icon: "/icon-192.png",
            tag: "btc-alert-" + Date.now(),
            requireInteraction: true,
            vibrate: [200, 100, 200],
          })
        }
      }
    }
  }, [swRegistration])

  const activateAlert = async () => {
    if (!currentPrice) return

    if (notificationPermission !== "granted") {
      const granted = await requestNotificationPermission()
      if (!granted) {
        alert("Please enable notifications to use price alerts")
        return
      }
    }

    setBasePrice(currentPrice)
    setIsAlertActive(true)
    hasTriggeredRef.current = false
  }

  const deactivateAlert = useCallback(() => {
    setIsAlertActive(false)
    setBasePrice(null)
    hasTriggeredRef.current = false
  }, [])

  // Monitor price changes
  useEffect(() => {
    if (!isAlertActive || !basePrice || !currentPrice || hasTriggeredRef.current) return

    const percentChange = ((currentPrice - basePrice) / basePrice) * 100
    const threshold = parseFloat(alertPercent)

    if (Math.abs(percentChange) >= threshold) {
      hasTriggeredRef.current = true
      const direction = percentChange > 0 ? "increased" : "decreased"
      const message = `BTC has ${direction} by ${Math.abs(percentChange).toFixed(2)}% to $${currentPrice.toLocaleString()}`
      
      sendNotification("Bitcoin Price Alert", message)
      deactivateAlert()
    }
  }, [currentPrice, isAlertActive, basePrice, alertPercent, sendNotification, deactivateAlert])

  const targetPriceUp = basePrice ? basePrice * (1 + parseFloat(alertPercent) / 100) : null
  const targetPriceDown = basePrice ? basePrice * (1 - parseFloat(alertPercent) / 100) : null

  const isStandalone = typeof window !== "undefined" && 
    (window.matchMedia("(display-mode: standalone)").matches || 
     (window.navigator as any).standalone === true)

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
        {/* Install App Banner */}
        {isInstallable && !isStandalone && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-500">Install App</p>
                <p className="text-xs text-muted-foreground">Get reliable notifications</p>
              </div>
              <Button size="sm" onClick={installApp} className="shrink-0 bg-amber-500 hover:bg-amber-600 text-black">
                <Download className="h-4 w-4 mr-1" />
                Install
              </Button>
            </div>
          </div>
        )}

        {isStandalone && (
          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-500 text-center flex items-center justify-center gap-1">
              <Smartphone className="h-3 w-3" />
              Running as installed app
            </p>
          </div>
        )}

        {/* Alert Percentage Input */}
        <div className="space-y-2">
          <Label htmlFor="alert-percent" className="text-sm text-muted-foreground">
            Alert when price changes by
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

        {/* Notification Status */}
        <div className="p-2 rounded bg-muted/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Notifications:</span>
            <span className={notificationPermission === "granted" ? "text-emerald-500" : "text-amber-500"}>
              {notificationPermission === "granted" ? "Enabled" : 
               notificationPermission === "denied" ? "Blocked" : "Not set"}
            </span>
          </div>
        </div>

        {/* Activate/Deactivate Buttons */}
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

        {/* Active Alert Info */}
        {isAlertActive && basePrice && currentPrice && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Monitoring from:</p>
              <p className="text-xs font-mono text-muted-foreground">
                Change: {((currentPrice - basePrice) / basePrice * 100).toFixed(3)}%
              </p>
            </div>
            <p className="font-medium font-mono">
              ${basePrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-emerald-500">Up (+{alertPercent}%)</p>
                <p className="font-medium font-mono text-foreground">
                  ${targetPriceUp?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                <p className="text-red-500">Down (-{alertPercent}%)</p>
                <p className="font-medium font-mono text-foreground">
                  ${targetPriceDown?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Test Notification Button */}
        {!isAlertActive && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if (notificationPermission !== "granted") {
                requestNotificationPermission().then((granted) => {
                  if (granted) {
                    sendNotification("Test Notification", "Notifications are working correctly!")
                  }
                })
              } else {
                sendNotification("Test Notification", "Notifications are working correctly!")
              }
            }}
            className="w-full text-xs text-muted-foreground"
          >
            Test Notification
          </Button>
        )}

        {notificationPermission === "denied" && (
          <p className="text-xs text-red-500 text-center">
            Notifications blocked. Please enable them in browser/app settings.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
