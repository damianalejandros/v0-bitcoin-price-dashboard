import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { title, body } = await req.json()
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
