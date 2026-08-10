import { NextRequest, NextResponse } from "next/server"
import { createRun, JourneyError } from "@/lib/journey/runs"
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth"

export const runtime = "nodejs"

/**
 * POST /api/journey/start — the front door of the live journey.
 *
 * Anti-abuse posture, layered: honeypot field (bots fill it, humans can't see
 * it), minimum time-to-submit (a real person reads the page first), and the
 * DB-side rate limits in createRun (3/email, 5/IP, 100/day global). The
 * honeypot returns a success-shaped response on purpose — a bot that thinks
 * it succeeded doesn't retry with variations.
 */
export async function POST(req: NextRequest) {
  let body: {
    email?: string
    name?: string
    sku?: string
    company?: string
    t?: number
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 })
  }

  if (body.company && body.company.trim() !== "") {
    return NextResponse.json({ ok: true, id: "jr_thanks" })
  }

  if (!body.t || Date.now() - Number(body.t) < 2500) {
    return NextResponse.json(
      { error: "That was fast — give the page a second and try again." },
      { status: 400 }
    )
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"

  try {
    const { id } = await createRun({
      email: body.email ?? "",
      name: body.name,
      sku: body.sku ?? "",
      ip,
      origin: new URL(req.url).origin,
    })

    // The visitor is signed into the portal as themselves immediately — the
    // journey and the portal demo are one system, and this is where it shows.
    const res = NextResponse.json({ ok: true, id })
    res.cookies.set(SESSION_COOKIE, `jr:${id}`, sessionCookieOptions())
    return res
  } catch (error) {
    if (error instanceof JourneyError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "rate_limited" ? 429 : 400 }
      )
    }
    console.error("journey start failed", error)
    return NextResponse.json(
      { error: "Something broke on our side — try again in a minute." },
      { status: 500 }
    )
  }
}
