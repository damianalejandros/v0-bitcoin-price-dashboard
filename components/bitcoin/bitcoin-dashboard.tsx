"use client"

import useSWR from "swr"
import { PriceCard } from "./price-card"
import { PriceChart } from "./price-chart"
import { AlertSettings } from "./alert-settings"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface BitcoinData {
  price: number
  change: number
  changePercent: number
  previousClose: number
  high: number
  low: number
  priceHistory: { time: string; price: number }[]
  lastUpdated: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function BitcoinDashboard() {
  const { data, error, isLoading, mutate } = useSWR<BitcoinData>(
    "/api/bitcoin",
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  )

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bitcoin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live price data from Yahoo Finance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated: {new Date(data.lastUpdated).toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => mutate()}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <PriceCard
            price={data?.price}
            changePercent={data?.changePercent}
            high={data?.high}
            low={data?.low}
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
