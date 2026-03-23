"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff, BellRing } from "lucide-react"

interface AlertSettingsProps {
  currentPrice: number | undefined
}

export function AlertSettings({ currentPrice }: AlertSettingsProps) {
  const [alertPercent, setAlertPercent] = useState<string>("5")
  const [isAlertActive, setIsAlertActive] = useState(false)
  const [basePrice, setBasePrice] = useState<number | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const hasTriggeredRef = useRef(false)

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

  const sendNotification = useCallback((title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/bitcoin-icon.png",
      })
    }
  }, [])

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

  const deactivateAlert = () => {
    setIsAlertActive(false)
    setBasePrice(null)
    hasTriggeredRef.current = false
  }

  useEffect(() => {
    if (!isAlertActive || !basePrice || !currentPrice || hasTriggeredRef.current) return

    const percentChange = ((currentPrice - basePrice) / basePrice) * 100
    const threshold = parseFloat(alertPercent)

    if (Math.abs(percentChange) >= threshold) {
      hasTriggeredRef.current = true
      const direction = percentChange > 0 ? "increased" : "decreased"
      sendNotification(
        "Bitcoin Price Alert",
        `BTC has ${direction} by ${Math.abs(percentChange).toFixed(2)}% to $${currentPrice.toLocaleString()}`
      )
      deactivateAlert()
    }
  }, [currentPrice, isAlertActive, basePrice, alertPercent, sendNotification])

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

        {isAlertActive && basePrice && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">Monitoring from base price:</p>
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

        {notificationPermission === "denied" && (
          <p className="text-xs text-red-500">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
