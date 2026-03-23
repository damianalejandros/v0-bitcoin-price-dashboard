"use client"

import { useRef } from "react"
import useSWR from "swr"
import { PriceCard } from "./price-card"
import { PriceChart } from "./price-chart"
import { AlertSettings } from "./alert-settings"
import { Button } from "@/components/ui/button"
import { RefreshCw, Bitcoin } from "lucide-react"

interface BitcoinData {
  price: number
  change: number
  changePercent: number
  previousClose: number
  high: number
  low: number
  volume?: number
  priceHistory: { time: string; price: number }[]
  lastUpdated: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function BitcoinDashboard() {
  const previousPriceRef = useRef<number | undefined>(undefined)
  
  const { data, error, isLoading, mutate } = useSWR<BitcoinData>(
    "/api/bitcoin",
    fetcher,
    {
      refreshInterval: 2000, // Update every 2 seconds for more real-time feel
      revalidateOnFocus: true,
      dedupingInterval: 1000,
    }
  )

  // Track previous price for animations
  if (data?.price && data.price !== previousPriceRef.current) {
    previousPriceRef.current = data.price
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="p-4 rounded-full bg-red-500/10">
          <Bitcoin className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-muted-foreground">Failed to load Bitcoin price data</p>
        <Button onClick={() => mutate()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10">
            <Bitcoin className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bitcoin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Live price from Yahoo Finance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {data?.lastUpdated && (
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                Last sync
              </p>
              <p className="text-xs font-mono text-muted-foreground">
                {new Date(data.lastUpdated).toLocaleTimeString()}
              </p>
            </div>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => mutate()}
            className="h-9 w-9"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <PriceCard
            price={data?.price}
            previousPrice={previousPriceRef.current}
            changePercent={data?.changePercent}
            high={data?.high}
            low={data?.low}
            volume={data?.volume}
            isLoading={isLoading && !data}
          />
          <AlertSettings currentPrice={data?.price} />
        </div>
        <PriceChart
          priceHistory={data?.priceHistory}
          changePercent={data?.changePercent}
          isLoading={isLoading && !data}
        />
      </div>
    </div>
  )
}
