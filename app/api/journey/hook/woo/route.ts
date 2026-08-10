import { createHmac, timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { recordEvent } from "@/lib/journey/runs"

export const runtime = "nodejs"

/**
 * POST /api/journey/hook/woo — the webhook receiver from woodemo.
 *
 * This is the diagram's "verify signature" chip running for real: Woo signs
 * every delivery with HMAC-SHA256 (base64) of the raw body under the shared
 * secret, and anything that doesn't verify is a 401. Woo's activation ping
 * (form-encoded `webhook_id=…`, no signature) gets a 200 so the webhook can
 * be turned on before it has anything to say.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get("x-wc-webhook-signature")

  if (!signature) {
    if (/^webhook_id=\d+/.test(raw)) return NextResponse.json({ ok: true, ping: true })
    return NextResponse.json({ error: "unsigned" }, { status: 400 })
  }

  const secret = process.env.WOO_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 503 })

  const expected = createHmac("sha256", secret).update(raw, "utf8").digest("base64")
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 })
  }

  let payload: {
    id?: number
    status?: string
    meta_data?: { key: string; value: string }[]
  }
  try {
    payload = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 })
  }

  const runId = payload.meta_data?.find((m) => m.key === "_tk_journey")?.value
  if (runId) {
    await recordEvent(runId, "woo.webhook.received", "store", {
      wooOrderId: payload.id,
      status: payload.status,
      note: "signature verified — the system hears its own status change come back",
    })
  }

  return NextResponse.json({ ok: true })
}
