import { NextResponse } from "next/server"
import { activeAlert } from "../notify/route"

export async function GET() {
  if (!activeAlert) return NextResponse.json({ ok: true, msg: "No alert set" })

  // Obtener precio actual
  const res = await fetch("https://v0-bitcoin-price-dashboard-two.vercel.app/api/bitcoin")
  const data = await res.json()
  const currentPrice = data.price

  if (!currentPrice) return NextResponse.json({ ok: false, msg: "No price" })

  const { basePrice, threshold } = activeAlert
  const percentChange = ((currentPrice - basePrice) / basePrice) * 100

  if (Math.abs(percentChange) >= threshold) {
    const topic = process.env.NTFY_TOPIC
    const direction = percentChange > 0 ? "subido" : "bajado"
    await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: {
        "Title": "⚡ Alerta de Precio BTC",
        "Priority": "high",
        "Tags": "bitcoin,rotating_light",
        "Content-Type": "text/plain",
      },
      body: `BTC ha ${direction} ${Math.abs(percentChange).toFixed(2)}% a $${currentPrice.toLocaleString()}`,
    })

    // Limpiar alerta
    activeAlert = null
  }

  return NextResponse.json({ ok: true, currentPrice, percentChange })
}
