"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Bitcoin } from "lucide-react"
import { LivePriceTicker } from "./live-price-ticker"

interface PriceCardProps {
  price: number | undefined
  changePercent: number | undefined
  high: number | undefined
  low: number | undefined
  isLoading: boolean
}

export function PriceCard({ 
  price, 
  changePercent, 
  high, 
  low, 
  isLoading 
}: PriceCardProps) {
  const isPositive = (changePercent ?? 0) >= 0

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Bitcoin className="h-5 w-5" />
            Bitcoin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-64" />
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
    <Card className="border-border/50 relative overflow-hidden bg-card/50 backdrop-blur">
      {/* Animated background gradient */}
      <div 
        className={`absolute inset-0 opacity-5 transition-colors duration-1000 ${
          isPositive ? "bg-gradient-to-br from-emerald-500 to-transparent" : "bg-gradient-to-br from-red-500 to-transparent"
        }`}
      />
      
      <CardHeader className="pb-2 relative">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Bitcoin className="h-5 w-5 text-amber-500" />
            </div>
            <span>Bitcoin</span>
            <span className="text-xs text-muted-foreground/60">BTC-USD</span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 relative">
        {/* Live Price Ticker */}
        <div className="py-2">
          <LivePriceTicker price={price} />
        </div>
        
        {/* 24h Change */}
        <div 
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
            isPositive 
              ? "bg-emerald-500/10 text-emerald-500" 
              : "bg-red-500/10 text-red-500"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span>
            {isPositive ? "+" : ""}
            {changePercent?.toFixed(2)}%
          </span>
          <span className="text-xs opacity-70">24h</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
              24h High
            </span>
            <p className="font-mono font-semibold text-emerald-500">
              ${high?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
              24h Low
            </span>
            <p className="font-mono font-semibold text-red-500">
              ${low?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>


      </CardContent>
    </Card>
  )
}
