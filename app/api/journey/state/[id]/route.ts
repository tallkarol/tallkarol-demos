import { NextRequest, NextResponse } from "next/server"
import { getRun, advanceIfDue, getEvents } from "@/lib/journey/runs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/journey/state/:id — the live page's poll target.
 *
 * Reading IS advancing: every poll runs the lazy stage clock, so the journey
 * moves exactly while someone is watching and freezes when nobody is. The
 * run id is an unguessable capability (48 bits + the verify token gates all
 * writes), which is the right weight of secrecy for a self-deleting demo.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const run = await getRun(id)
  if (!run) return NextResponse.json({ error: "not found" }, { status: 404 })

  const fresh = await advanceIfDue(run)
  const events = await getEvents(id)

  return NextResponse.json(
    {
      run: {
        id: fresh.id,
        status: fresh.status,
        stageIndex: fresh.stage_index,
        orderNumber: fresh.order_number,
        email: fresh.email,
        nextAdvanceAt: fresh.next_advance_at,
        order: fresh.order_json,
        createdAt: fresh.created_at,
      },
      events: events.slice().reverse(),
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
