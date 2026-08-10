import { sql } from "@/lib/journey/db"

/**
 * The live-journey rollup the analytics suite reports on.
 *
 * This is the join the whole three-demo story promised: visitors running the
 * journey generate real orders, real sends, and real clicks, and those land
 * in the merchant's own dashboard beside the seeded baseline. The seeded rows
 * never move; these numbers do, every time somebody runs one.
 *
 * Every query is wrapped — the analytics demo must render even if the journey
 * database is unreachable, because the seeded world is the published demo and
 * it can't be taken down by a dependency.
 */

export type JourneyFunnel = {
  runs: number
  verified: number
  delivered: number
  loopsClosed: number
  events: number
  ordersValue: number
  lastRunAt: string | null
}

export type JourneyCampaignRow = {
  campaign: string
  source: string
  medium: string
  sends: number
  clicks: number
  clickRate: number
  /** Order value the campaign actually produced — real Woo order totals. */
  revenue: number
}

const EMPTY: JourneyFunnel = {
  runs: 0,
  verified: 0,
  delivered: 0,
  loopsClosed: 0,
  events: 0,
  ordersValue: 0,
  lastRunAt: null,
}

export async function journeyFunnel(): Promise<JourneyFunnel> {
  try {
    const [row] = (await sql()`
      SELECT
        count(*)::int AS runs,
        count(*) FILTER (WHERE status <> 'awaiting_click')::int AS verified,
        count(*) FILTER (WHERE stage_index >= 7)::int AS delivered,
        coalesce(sum((order_json->'totals'->>'total')::numeric), 0)::float AS orders_value,
        max(created_at) AS last_run_at
      FROM journey_runs`) as {
      runs: number
      verified: number
      delivered: number
      orders_value: number
      last_run_at: string | null
    }[]

    const [extra] = (await sql()`
      SELECT
        count(*) FILTER (WHERE type = 'loop.closed')::int AS loops_closed,
        count(*)::int AS events
      FROM journey_events`) as { loops_closed: number; events: number }[]

    return {
      runs: Number(row?.runs ?? 0),
      verified: Number(row?.verified ?? 0),
      delivered: Number(row?.delivered ?? 0),
      loopsClosed: Number(extra?.loops_closed ?? 0),
      events: Number(extra?.events ?? 0),
      ordersValue: Number(row?.orders_value ?? 0),
      lastRunAt: row?.last_run_at ? new Date(row.last_run_at).toISOString() : null,
    }
  } catch {
    return EMPTY
  }
}

/**
 * The two journey campaigns as campaign rows — same shape the seeded table
 * uses, so they slot straight into the campaigns view instead of needing
 * their own screen.
 */
export async function journeyCampaigns(): Promise<JourneyCampaignRow[]> {
  try {
    const rows = (await sql()`
      SELECT
        coalesce(utm->>'utm_campaign', 'journey_welcome') AS campaign,
        count(*) FILTER (WHERE type IN ('email.link.clicked', 'coupon.redeemed'))::int AS clicks
      FROM journey_events
      WHERE type IN ('email.link.clicked', 'coupon.redeemed')
      GROUP BY 1`) as { campaign: string; clicks: number }[]

    const [sends] = (await sql()`
      SELECT
        count(*) FILTER (WHERE detail->>'template' = 'welcome')::int AS welcome,
        count(*) FILTER (WHERE detail->>'template' = 'delivered+coupon')::int AS coupon
      FROM journey_events
      WHERE type = 'email.sent'`) as { welcome: number; coupon: number }[]

    /* The welcome click is what confirms the order, so that campaign carries
       the order value. The coupon click produces intent, not a second order —
       it stays at zero rather than inventing revenue. */
    const [value] = (await sql()`
      SELECT coalesce(sum((order_json->'totals'->>'total')::numeric), 0)::float AS v
      FROM journey_runs WHERE status <> 'awaiting_click'`) as { v: number }[]

    const revenueFor: Record<string, number> = {
      journey_welcome: Number(value?.v ?? 0),
      journey_coupon: 0,
    }

    const sendCount: Record<string, number> = {
      journey_welcome: Number(sends?.welcome ?? 0),
      journey_coupon: Number(sends?.coupon ?? 0),
    }

    return ["journey_welcome", "journey_coupon"]
      .map((campaign) => {
        const clicks = Number(rows.find((r) => r.campaign === campaign)?.clicks ?? 0)
        const sent = sendCount[campaign] ?? 0
        return {
          campaign,
          source: "harbor-pine",
          medium: "email",
          sends: sent,
          clicks,
          clickRate: sent > 0 ? clicks / sent : 0,
          revenue: revenueFor[campaign] ?? 0,
        }
      })
      .filter((row) => row.sends > 0 || row.clicks > 0)
  } catch {
    return []
  }
}
