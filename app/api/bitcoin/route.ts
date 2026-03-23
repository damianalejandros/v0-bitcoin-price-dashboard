import { NextResponse } from "next/server"

export async function GET() {
  try {
    const response = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD?interval=5m&range=1d",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        next: { revalidate: 0 },
      }
    )

    if (!response.ok) {
      throw new Error("Failed to fetch from Yahoo Finance")
    }

    const data = await response.json()
    const result = data.chart.result[0]
    const meta = result.meta
    const quotes = result.indicators.quote[0]
    const timestamps = result.timestamp

    const currentPrice = meta.regularMarketPrice
    const previousClose = meta.chartPreviousClose || meta.previousClose
    const change = currentPrice - previousClose
    const changePercent = (change / previousClose) * 100

    const priceHistory = timestamps
      .map((timestamp: number, index: number) => ({
        time: new Date(timestamp * 1000).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        price: quotes.close[index] || quotes.open[index],
      }))
      .filter((item: { time: string; price: number | null }) => item.price !== null)

    return NextResponse.json({
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      previousClose: previousClose,
      high: meta.regularMarketDayHigh,
      low: meta.regularMarketDayLow,
      volume: meta.regularMarketVolume,
      priceHistory: priceHistory,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching Bitcoin price:", error)
    return NextResponse.json(
      { error: "Failed to fetch Bitcoin price" },
      { status: 500 }
    )
  }
}
