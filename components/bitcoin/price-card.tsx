"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Bitcoin, Activity } from "lucide-react"

interface PriceCardProps {
  price: number | undefined
  changePercent: number | undefined
  high: number | undefined
  low: number | undefined
  isLoading: boolean
}

export function PriceCard({ price, changePercent, high, low, isLoading }: PriceCardProps) {
  const [displayPrice, setDisplayPrice] = useState<number | undefined>(price)
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | null>(null)
  const previousPriceRef = useRef<number | undefined>(price)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (price === undefined || previousPriceRef.current === undefined) {
      setDisplayPrice(price)
      previousPriceRef.current = price
      return
    }

    if (price === previousPriceRef.current) return

    const startPrice = previousPriceRef.current
    const endPrice = price
    const diff = endPrice - startPrice
    const direction = diff > 0 ? "up" : "down"
    const duration = 1000
    const steps = 30
    const stepDuration = duration / steps
    let currentStep = 0

    setPriceDirection(direction)

    if (animationRef.current) {
      clearInterval(animationRef.current)
    }

    animationRef.current = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      const easeOutProgress = 1 - Math.pow(1 - progress, 3)
      const currentValue = startPrice + (diff * easeOutProgress)
      
      setDisplayPrice(currentValue)

      if (currentStep >= steps) {
        if (animationRef.current) {
          clearInterval(animationRef.current)
        }
        setDisplayPrice(endPrice)
        previousPriceRef.current = endPrice
        
        setTimeout(() => setPriceDirection(null), 500)
      }
    }, stepDuration)

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
      }
    }
  }, [price])

  const isPositive = (changePercent ?? 0) >= 0

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Bitcoin className="h-5 w-5" />
            Bitcoin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 relative overflow-hidden">
      <div className="absolute top-2 right-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
          <span>Live</span>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <Bitcoin className="h-5 w-5 text-amber-500" />
          Bitcoin (BTC-USD)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span 
            className={`text-4xl font-bold tracking-tight transition-colors duration-300 ${
              priceDirection === "up" 
                ? "text-emerald-500" 
                : priceDirection === "down" 
                ? "text-red-500" 
                : ""
            }`}
          >
            ${displayPrice?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {priceDirection && (
            <span className={`text-lg ${priceDirection === "up" ? "text-emerald-500" : "text-red-500"}`}>
              {priceDirection === "up" ? (
                <TrendingUp className="h-5 w-5 animate-bounce" />
              ) : (
                <TrendingDown className="h-5 w-5 animate-bounce" />
              )}
            </span>
          )}
        </div>
        
        <div className={`flex items-center gap-1.5 text-sm font-medium ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
          {isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span>
            {isPositive ? "+" : ""}
            {changePercent?.toFixed(2)}% (24h)
          </span>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground pt-2 border-t border-border/50">
          <div>
            <span className="text-xs uppercase tracking-wide">High 24h</span>
            <p className="font-medium text-foreground">
              ${high?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide">Low 24h</span>
            <p className="font-medium text-foreground">
              ${low?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
