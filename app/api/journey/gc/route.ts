import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/journey/db"
import { deleteWooOrder } from "@/lib/journey/woo"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * GET /api/journey/gc — daily cron (vercel.json).
 *
 * The privacy promise on the journey form is "auto-deleted within 7 days";
 * this is that promise running. Deletes the Woo order first (so woodemo's
 * wp-admin stays clean too), then the run — journey_events cascades.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const stale = (await sql()`
    SELECT id, woo_order_id FROM journey_runs
    WHERE created_at < now() - interval '7 days'
    LIMIT 50`) as { id: string; woo_order_id: number | null }[]

  let wooDeleted = 0
  for (const run of stale) {
    if (run.woo_order_id) {
      const res = await deleteWooOrder(run.woo_order_id)
      if (res.ok) wooDeleted++
    }
    await sql()`DELETE FROM journey_runs WHERE id = ${run.id}`
  }

  return NextResponse.json({ deleted: stale.length, wooDeleted })
}
