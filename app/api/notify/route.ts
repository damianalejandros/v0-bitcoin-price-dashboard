import { NextRequest, NextResponse } from "next/server"

// Guardamos la alerta activa en memoria
export let activeAlert: { basePrice: number; threshold: number } | null = null

export async function POST(req: NextRequest) {
  const { title, body, basePrice, threshold } = await req.json()

  // Si nos mandan una alerta para guardar
  if (basePrice && threshold) {
    activeAlert = { basePrice, threshold }
    return NextResponse.json({ ok: true })
  }

  // Si nos piden borrar la alerta
  if (title === "CLEAR") {
    activeAlert = null
    return NextResponse.json({ ok: true })
  }

  // Mandar notificación a ntfy
  const topic = process.env.NTFY_TOPIC
  await fetch(`https://ntfy.sh/${topic}`, {
    method: "POST",
    headers: {
      "Title": title,
      "Priority": "high",
      "Tags": "bitcoin,rotating_light",
      "Content-Type": "text/plain",
    },
    body: body,
  })

  return NextResponse.json({ ok: true })
}
