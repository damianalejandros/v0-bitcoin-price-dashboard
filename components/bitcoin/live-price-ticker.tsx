"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { TrendingUp, TrendingDown, Zap } from "lucide-react"

interface LivePriceTickerProps {
  price: number | undefined
  previousPrice?: number
}

function AnimatedDigit({ digit, isDecimal }: { digit: string; isDecimal?: boolean }) {
  const [displayDigit, setDisplayDigit] = useState(digit)
  const [isAnimating, setIsAnimating] = useState(false)
  const prevDigitRef = useRef(digit)

  useEffect(() => {
    if (digit !== prevDigitRef.current) {
      setIsAnimating(true)
      const timeout = setTimeout(() => {
        setDisplayDigit(digit)
        setIsAnimating(false)
      }, 150)
      prevDigitRef.current = digit
      return () => clearTimeout(timeout)
    }
  }, [digit])

  if (isDecimal) {
    return <span className="text-muted-foreground/70">.</span>
  }

  return (
    <span
      className={`inline-block transition-all duration-150 ${
        isAnimating 
          ? "scale-110 text-amber-400" 
          : ""
      }`}
    >
      {displayDigit}
    </span>
  )
}

export function LivePriceTicker({ price, previousPrice }: LivePriceTickerProps) {
  const [displayPrice, setDisplayPrice] = useState<number>(price ?? 0)
  const [microTrend, setMicroTrend] = useState<"up" | "down" | null>(null)
  const [flashColor, setFlashColor] = useState<"green" | "red" | null>(null)
  const lastRealPrice = useRef<number>(price ?? 0)
  const microIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Simulate micro-fluctuations between real price updates
  const simulateMicroMovement = useCallback(() => {
    if (lastRealPrice.current === 0) return

    const variance = lastRealPrice.current * 0.00005 // 0.005% variance
    const randomChange = (Math.random() - 0.5) * 2 * variance
    const newPrice = lastRealPrice.current + randomChange

    setDisplayPrice(newPrice)
    setMicroTrend(randomChange > 0 ? "up" : "down")

    // Clear micro trend after a short delay
    setTimeout(() => setMicroTrend(null), 100)
  }, [])

  // Start micro-fluctuation simulation
  useEffect(() => {
    microIntervalRef.current = setInterval(simulateMicroMovement, 200)

    return () => {
      if (microIntervalRef.current) {
        clearInterval(microIntervalRef.current)
      }
    }
  }, [simulateMicroMovement])

  // Handle real price updates
  useEffect(() => {
    if (price === undefined) return

    const prevPrice = lastRealPrice.current
    lastRealPrice.current = price

    if (prevPrice !== 0 && price !== prevPrice) {
      // Flash effect on real price change
      setFlashColor(price > prevPrice ? "green" : "red")
      setTimeout(() => setFlashColor(null), 500)
    }

    setDisplayPrice(price)
  }, [price])

  const formatPrice = (p: number): string[] => {
    return p.toFixed(2).split("")
  }

  const priceDigits = formatPrice(displayPrice)
  const trend = previousPrice !== undefined && price !== undefined
    ? price > previousPrice ? "up" : price < previousPrice ? "down" : null
    : null

  return (
    <div className="relative">
      {/* Live indicator */}
      <div className="absolute -top-1 -right-1 flex items-center gap-1">
        <Zap className="h-3 w-3 text-amber-500 animate-pulse" />
        <span className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold">
          Live
        </span>
      </div>

      {/* Price display */}
      <div
        className={`font-mono text-5xl md:text-6xl font-bold tracking-tighter transition-all duration-200 ${
          flashColor === "green"
            ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]"
            : flashColor === "red"
            ? "text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]"
            : "text-foreground"
        }`}
      >
        <span className="text-muted-foreground/70 text-4xl md:text-5xl">$</span>
        {priceDigits.map((digit, index) => (
          <AnimatedDigit
            key={index}
            digit={digit}
            isDecimal={digit === "."}
          />
        ))}

        {/* Micro trend indicator */}
        {microTrend && (
          <span
            className={`inline-block ml-1 text-xs transition-opacity duration-100 ${
              microTrend === "up" ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {microTrend === "up" ? (
              <TrendingUp className="h-4 w-4 inline" />
            ) : (
              <TrendingDown className="h-4 w-4 inline" />
            )}
          </span>
        )}
      </div>

      {/* 24h trend indicator below price */}
      {trend && (
        <div
          className={`flex items-center gap-1 mt-2 text-sm font-medium ${
            trend === "up" ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {trend === "up" ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span>vs last update</span>
        </div>
      )}
    </div>
  )
}
