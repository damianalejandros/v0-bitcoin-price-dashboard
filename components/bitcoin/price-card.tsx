"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Bitcoin } from "lucide-react"

interface PriceCardProps {
  price: number | undefined
  changePercent: number | undefined
  high: number | undefined
  low: number | undefined
  isLoading: boolean
}

export function PriceCard({ price, changePercent, high, low, isLoading }: PriceCardProps) {
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
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <Bitcoin className="h-5 w-5 text-amber-500" />
          Bitcoin (BTC-USD)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold tracking-tight">
            ${price?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
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
            <span className="text-xs uppercase tracking-wide">High</span>
            <p className="font-medium text-foreground">
              ${high?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide">Low</span>
            <p className="font-medium text-foreground">
              ${low?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
