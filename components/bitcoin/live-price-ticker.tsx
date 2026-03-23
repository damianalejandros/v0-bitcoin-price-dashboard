"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Zap } from "lucide-react"

interface LivePriceTickerProps {
  price: number | undefined
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

export function LivePriceTicker({ price }: LivePriceTickerProps) {
  const [displayPrice, setDisplayPrice] = useState<number>(price ?? 0)
  const lastRealPrice = useRef<number>(price ?? 0)
  const microIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Simulate micro-fluctuations between real price updates
  const simulateMicroMovement = useCallback(() => {
    if (lastRealPrice.current === 0) return

    const variance = lastRealPrice.current * 0.00005 // 0.005% variance
    const randomChange = (Math.random() - 0.5) * 2 * variance
    const newPrice = lastRealPrice.current + randomChange

    setDisplayPrice(newPrice)
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
    lastRealPrice.current = price
    setDisplayPrice(price)
  }, [price])

  const formatPrice = (p: number): string[] => {
    return p.toFixed(2).split("")
  }

  const priceDigits = formatPrice(displayPrice)

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
      <div className="font-mono text-5xl md:text-6xl font-bold tracking-tighter text-foreground">
        <span className="text-muted-foreground/70 text-4xl md:text-5xl">$</span>
        {priceDigits.map((digit, index) => (
          <AnimatedDigit
            key={index}
            digit={digit}
            isDecimal={digit === "."}
          />
        ))}
      </div>
    </div>
  )
}
