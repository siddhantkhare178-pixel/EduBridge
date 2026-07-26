import { NextResponse } from "next/server"

export const runtime = "edge"

type AiRequest = {
  prompt?: string
  temperature?: number
  max_tokens?: number
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AiRequest
    const prompt = (body.prompt || "").toString().trim()
    if (!prompt) {
      return NextResponse.json({ error: "Missing 'prompt'" }, { status: 400 })
    }

    // Placeholder implementation; replace with real provider integration.
    return NextResponse.json({
      content: `AI mock response for: ${prompt.slice(0, 128)}`,
      raw: { temperature: body.temperature ?? 0.7, max_tokens: body.max_tokens ?? 256 },
    })
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }
}


