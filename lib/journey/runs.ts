import { randomBytes, createHash } from "node:crypto"
import { sql } from "@/lib/journey/db"
import {
  buildOrder,
  applyStage,
  stageEvents,
  displayName,
  STAGE_SECONDS,
  stageCount,
} from "@/lib/journey/ladder"
import { journeyProduct } from "@/lib/journey/products"
import { createWooOrder, setWooOrderStatus, addWooOrderNote } from "@/lib/journey/woo"
import { welcomeEmail, deliveredEmail, sendJourneyEmail } from "@/lib/journey/email"
import { store, type Order } from "@/lib/store"

/**
 * The journey state machine, DB-side.
 *
 * A run is: awaiting_click → (visitor clicks the email) → active →
 * (stages advance on a compressed clock) → complete. Advancement is LAZY —
 * `advanceIfDue` runs whenever anyone reads the run (the live page polls, the
 * portal renders) — so no per-minute cron is needed and the demo still moves
 * the moment somebody is watching. A daily cron only garbage-collects.
 *
 * Every side effect writes a `journey_events` row. The events table IS the
 * demo: the live page renders it as the wiring diagram made real.
 */

export type JourneyRun = {
  id: string
  email: string
  name: string | null
  product_sku: string
  woo_order_id: number | null
  order_number: string
  status: "awaiting_click" | "active" | "complete" | "expired"
  stage_index: number
  verify_token: string
  next_advance_at: string | null
  order_json: Order
  created_at: string
}

export type JourneyEvent = {
  id: number
  run_id: string
  type: string
  lane: string | null
  detail: Record<string, unknown> | null
  utm: Record<string, string> | null
  created_at: string
}

export class JourneyError extends Error {
  constructor(
    public code: "rate_limited" | "bad_product" | "bad_email",
    message: string
  ) {
    super(message)
  }
}

const hashIp = (ip: string) => createHash("sha256").update(ip).digest("hex").slice(0, 24)

export async function recordEvent(
  runId: string,
  type: string,
  lane: string,
  detail?: Record<string, unknown>,
  utm?: Record<string, string>
) {
  await sql()`
    INSERT INTO journey_events (run_id, type, lane, detail, utm)
    VALUES (${runId}, ${type}, ${lane}, ${detail ? JSON.stringify(detail) : null}::jsonb, ${
      utm ? JSON.stringify(utm) : null
    }::jsonb)`
}

/* ------------------------------------------------------------------ create */

export async function createRun(opts: {
  email: string
  name?: string | null
  sku: string
  ip: string
  origin: string
}): Promise<{ id: string }> {
  const email = opts.email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new JourneyError("bad_email", "That doesn't look like an email address.")
  }

  const product = journeyProduct(opts.sku)
  if (!product) throw new JourneyError("bad_product", "Pick one of the four pieces.")

  // Rate limits: the published caps this endpoint lives under. Counts, not
  // token buckets — volume is tiny and a SELECT is enough.
  const ipHash = hashIp(opts.ip)
  const [limits] = (await sql()`
    SELECT
      count(*) FILTER (WHERE email = ${email})      AS by_email,
      count(*) FILTER (WHERE ip_hash = ${ipHash})   AS by_ip,
      count(*)                                      AS total
    FROM journey_runs
    WHERE created_at > now() - interval '24 hours'`) as {
    by_email: number
    by_ip: number
    total: number
  }[]

  if (Number(limits.by_email) >= 3)
    throw new JourneyError("rate_limited", "That inbox has run 3 journeys today — try tomorrow.")
  if (Number(limits.by_ip) >= 5)
    throw new JourneyError("rate_limited", "This connection has hit today's journey limit.")
  if (Number(limits.total) >= 100)
    throw new JourneyError("rate_limited", "The demo hit its daily cap — back tomorrow.")

  const id = `jr_${randomBytes(6).toString("hex")}`
  const verifyToken = randomBytes(16).toString("hex")

  const [{ n }] = (await sql()`SELECT count(*) AS n FROM journey_runs`) as { n: number }[]
  const orderNumber = `#HP-${90200 + Number(n)}`

  const order = buildOrder({ runId: id, orderNumber, email, name: opts.name, product })

  await sql()`
    INSERT INTO journey_runs (id, email, name, product_sku, order_number, verify_token, order_json, ip_hash)
    VALUES (${id}, ${email}, ${opts.name ?? null}, ${product.sku}, ${orderNumber}, ${verifyToken}, ${JSON.stringify(order)}::jsonb, ${ipHash})`

  await recordEvent(id, "run.started", "router", { product: product.name, order: orderNumber })
  await recordEvent(id, "portal.account.created", "portal", {
    login: email,
    password: "demo",
    note: "read-only, scoped to this one order",
  })

  // Woo order — real row in woodemo's wp-admin. Failure degrades, not dies.
  const woo = await createWooOrder({
    runId: id,
    email,
    customerName: displayName(email, opts.name),
    sku: product.sku,
    productName: product.name,
    price: product.price,
  })
  if (woo.ok) {
    await sql()`UPDATE journey_runs SET woo_order_id = ${woo.data.id}, updated_at = now() WHERE id = ${id}`
    await recordEvent(id, "woo.order.created", "store", {
      wooOrderId: woo.data.id,
      status: woo.data.status,
    })
  } else {
    await recordEvent(id, "woo.error", "store", { during: "order.create", error: woo.error })
  }

  // Email #1 — doubles as verification: nothing else fires until the click.
  const verifyUrl =
    `${opts.origin}/api/t?run=${id}&t=${verifyToken}&e=email.link.clicked` +
    `&next=${encodeURIComponent(`/journey/${id}`)}` +
    `&utm_source=harbor-pine&utm_medium=email&utm_campaign=journey_welcome`
  const mail = welcomeEmail({ order, verifyUrl })
  const sent = await sendJourneyEmail({ to: email, subject: mail.subject, html: mail.html })
  if (sent.ok) {
    await recordEvent(id, "email.sent", "email", {
      template: "welcome",
      subject: mail.subject,
      resendId: sent.id,
    })
  } else {
    await recordEvent(id, "email.error", "email", { during: "welcome", error: sent.error })
  }

  return { id }
}

/* -------------------------------------------------------------------- read */

export async function getRun(id: string): Promise<JourneyRun | null> {
  const rows = (await sql()`SELECT * FROM journey_runs WHERE id = ${id}`) as JourneyRun[]
  return rows[0] ?? null
}

export async function latestRunByEmail(email: string): Promise<JourneyRun | null> {
  const rows = (await sql()`
    SELECT * FROM journey_runs
    WHERE email = ${email.trim().toLowerCase()}
    ORDER BY created_at DESC LIMIT 1`) as JourneyRun[]
  return rows[0] ?? null
}

export async function getEvents(runId: string, limit = 120): Promise<JourneyEvent[]> {
  return (await sql()`
    SELECT * FROM journey_events WHERE run_id = ${runId}
    ORDER BY id DESC LIMIT ${limit}`) as JourneyEvent[]
}

/* ---------------------------------------------------------------- activate */

/** The verification click. Idempotent — a second click just redirects. */
export async function activateRun(run: JourneyRun, utm: Record<string, string>) {
  if (run.status !== "awaiting_click") return

  const order = applyStage(run.order_json, 1) // confirmed — "payment cleared"
  await sql()`
    UPDATE journey_runs
    SET status = 'active', stage_index = 1,
        order_json = ${JSON.stringify(order)}::jsonb,
        next_advance_at = ${new Date(Date.now() + STAGE_SECONDS * 1000).toISOString()},
        updated_at = now()
    WHERE id = ${run.id} AND status = 'awaiting_click'`

  await recordEvent(run.id, "email.link.clicked", "email", { verified: true }, utm)
  await recordEvent(run.id, "analytics.attributed", "analytics", {
    campaign: utm.utm_campaign ?? "journey_welcome",
  })
  for (const event of stageEvents(1, order)) {
    await recordEvent(run.id, event.type, event.lane, event.detail)
  }

  if (run.woo_order_id) {
    const res = await setWooOrderStatus(run.woo_order_id, "processing")
    if (res.ok) {
      await recordEvent(run.id, "woo.status.updated", "store", { status: "processing" })
    }
    await addWooOrderNote(run.woo_order_id, "Journey verified by customer — payment confirmed (simulated).")
  }
}

/* ----------------------------------------------------------------- advance */

/**
 * Move the run forward through every stage that's come due. Called from every
 * read path; the UPDATE's stage guard makes concurrent polls harmless (only
 * one caller wins each step, the rest see the fresh row next poll).
 */
export async function advanceIfDue(run: JourneyRun): Promise<JourneyRun> {
  let current = run

  while (
    current.status === "active" &&
    current.stage_index < stageCount - 1 &&
    current.next_advance_at &&
    new Date(current.next_advance_at).getTime() <= Date.now()
  ) {
    const nextStage = current.stage_index + 1
    const isLast = nextStage === stageCount - 1
    const order = applyStage(current.order_json, nextStage)

    const nextAdvanceAt = isLast ? null : new Date(Date.now() + STAGE_SECONDS * 1000).toISOString()
    const updated = (await sql()`
      UPDATE journey_runs
      SET stage_index = ${nextStage},
          status = ${isLast ? "complete" : "active"},
          order_json = ${JSON.stringify(order)}::jsonb,
          next_advance_at = ${nextAdvanceAt},
          updated_at = now()
      WHERE id = ${current.id} AND stage_index = ${current.stage_index}
      RETURNING *`) as JourneyRun[]

    if (!updated[0]) {
      // Another poll advanced it first — reload and continue from there.
      const fresh = await getRun(current.id)
      if (!fresh) return current
      current = fresh
      continue
    }
    current = updated[0]

    for (const event of stageEvents(nextStage, order)) {
      await recordEvent(current.id, event.type, event.lane, event.detail)
    }

    if (current.woo_order_id) {
      const stage = store.stages[nextStage]
      await addWooOrderNote(current.woo_order_id, `Journey stage: ${stage.label} — ${stage.blurb}`)
      if (isLast) {
        const res = await setWooOrderStatus(current.woo_order_id, "completed")
        if (res.ok) await recordEvent(current.id, "woo.status.updated", "store", { status: "completed" })
      }
    }

    if (isLast) {
      const portalUrl = "https://demos.tallkarol.com/portal"
      const loopUrl =
        `https://demos.tallkarol.com/api/t?run=${current.id}&t=${current.verify_token}` +
        `&e=coupon.redeemed&next=${encodeURIComponent(`/journey/${current.id}?loop=closed`)}` +
        `&utm_source=harbor-pine&utm_medium=email&utm_campaign=journey_coupon`
      const mail = deliveredEmail({ order, portalUrl, loopUrl })
      const sent = await sendJourneyEmail({ to: current.email, subject: mail.subject, html: mail.html })
      await recordEvent(
        current.id,
        sent.ok ? "email.sent" : "email.error",
        "email",
        sent.ok
          ? { template: "delivered+coupon", subject: mail.subject, resendId: sent.id }
          : { during: "delivered", error: sent.ok === false ? sent.error : "unknown" }
      )
    }
  }

  return current
}

/** The coupon click — the loop this whole system exists for. */
export async function closeLoop(run: JourneyRun, utm: Record<string, string>) {
  const already = (await sql()`
    SELECT 1 FROM journey_events WHERE run_id = ${run.id} AND type = 'coupon.redeemed' LIMIT 1`) as unknown[]
  if (already.length > 0) return

  await recordEvent(run.id, "coupon.redeemed", "email", { coupon: "PINE10" }, utm)
  await recordEvent(run.id, "loop.closed", "router", {
    note: "coupon.redeemed → order.created — the diagram's green wire, run by a real click",
  })
  await recordEvent(run.id, "crm.tag.applied", "crm", { tags: ["repeat-intent"] })
}
