import { NextRequest, NextResponse } from "next/server"
import { getRun, activateRun, closeLoop, recordEvent } from "@/lib/journey/runs"

export const runtime = "nodejs"

/**
 * GET /api/t — the in-house tracker.
 *
 * Every journey email link routes through here: the event (and its UTM
 * parameters) land in journey_events, then the visitor is redirected on.
 * This is the "GA has too much lag" answer — attribution is a same-region
 * INSERT, visible on the live page within one poll.
 *
 * The run's verify token gates every mutation, so a guessed run id can't
 * forge events. An unauthenticated hit still redirects — links must never
 * dead-end a human — it just doesn't write anything.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams

  const runId = sp.get("run") ?? ""
  const token = sp.get("t") ?? ""
  const event = sp.get("e") ?? ""
  const nextPath = sp.get("next") ?? (runId ? `/journey/${runId}` : "/")

  const utm: Record<string, string> = {}
  for (const [key, value] of sp.entries()) {
    if (key.startsWith("utm_")) utm[key] = value.slice(0, 120)
  }

  // Open-redirect guard: same-origin paths only.
  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/"

  const run = runId ? await getRun(runId) : null
  if (run && token && token === run.verify_token) {
    if (event === "email.link.clicked") {
      await activateRun(run, utm)
    } else if (event === "coupon.redeemed") {
      await closeLoop(run, utm)
    } else if (/^[a-z][a-z0-9.]{2,40}$/.test(event)) {
      await recordEvent(run.id, event, "analytics", {}, utm)
    }
  }

  return NextResponse.redirect(new URL(safeNext, req.url), 302)
}
