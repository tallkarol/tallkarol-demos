import type { Order } from "@/lib/store"

/**
 * The run history model — the journey read as a Zap-style task list rather
 * than a pile of events.
 *
 * Two row kinds, deliberately. `step` rows are things the system DID.
 * `wait` rows are things the system is WAITING ON, and they're first-class:
 * most of a real automation's wall-clock time is spent parked on a human or a
 * timer, and hiding that is what makes canned demos feel fake. Each wait row
 * says what it's watching for and how long it's been watching.
 *
 * Pure function of (run, events) so the console and the diagram can never
 * disagree — they're two renderings of the same ledger.
 */

export type ConsoleStatus = "done" | "running" | "waiting" | "pending" | "error"

export type ConsoleDetail = { label: string; value: string }

export type ConsoleSubstep = {
  label: string
  at: string | null
  state: "complete" | "current" | "upcoming"
  fired: string
}

export type ConsoleRow = {
  id: string
  kind: "step" | "wait"
  title: string
  status: ConsoleStatus
  /** Completion timestamp, when there is one. */
  at?: string | null
  /** Wall-clock origin for a waiting row's elapsed counter. */
  since?: string | null
  detail: ConsoleDetail[]
  note?: string
  substeps?: ConsoleSubstep[]
}

type EventLike = {
  id: number
  type: string
  lane: string | null
  detail: Record<string, unknown> | null
  utm: Record<string, string> | null
  created_at: string | Date
}

type RunLike = {
  id: string
  status: "awaiting_click" | "active" | "complete" | "expired"
  stageIndex: number
  orderNumber: string
  email: string
  nextAdvanceAt: string | null
  order: Order
  createdAt: string
}

const iso = (value: string | Date | undefined | null) =>
  value ? new Date(value).toISOString() : null

/** What each fulfilment stage sets off, per lib/journey/ladder.ts. */
const STAGE_EFFECTS: Record<string, string> = {
  placed: "Portal timeline written",
  confirmed: "CRM contact upserted · portal + CRM timelines written",
  production: "Portal + CRM timelines written",
  quality: "Portal + CRM timelines written",
  booked: "SMS sent · CRM task created (white-glove call, 48h out)",
  transit: "SMS sent · timelines written",
  out: "SMS sent · timelines written",
  delivered: "SMS sent · CRM tagged delivered + review-ask",
}

export function buildConsole(run: RunLike, events: EventLike[]): ConsoleRow[] {
  const first = (type: string, match?: (e: EventLike) => boolean) =>
    events.find((e) => e.type === type && (!match || match(e)))

  const started = first("run.started")
  const wooCreated = first("woo.order.created")
  const wooFailed = first("woo.error")
  const account = first("portal.account.created")
  const welcome = first("email.sent", (e) => e.detail?.template === "welcome")
  const welcomeFailed = first("email.error", (e) => e.detail?.during === "welcome")
  const clicked = first("email.link.clicked")
  const attributed = first("analytics.attributed")
  const couponMail = first("email.sent", (e) => e.detail?.template === "delivered+coupon")
  const redeemed = first("coupon.redeemed")
  const closed = first("loop.closed")
  const webhook = first("woo.webhook.received")

  const stageTotal = run.order.timeline.length
  const delivered = run.stageIndex >= stageTotal - 1
  const awaiting = run.status === "awaiting_click"

  const rows: ConsoleRow[] = []

  /* ------------------------------------------------------------- trigger */
  rows.push({
    id: "trigger",
    kind: "step",
    title: "Trigger — order placed on the storefront",
    status: "done",
    at: iso(started?.created_at ?? run.createdAt),
    detail: [
      { label: "Product", value: run.order.item.name },
      { label: "Configuration", value: run.order.item.options.map((o) => o.value).join(" · ") },
      { label: "Order", value: run.orderNumber },
      { label: "Run id", value: run.id },
    ],
    note: "The whole pipeline hangs off this one event. Everything below is a consequence.",
  })

  /* ------------------------------------------------- woo order creation */
  rows.push({
    id: "woo-create",
    kind: "step",
    title: "Create the order in WooCommerce",
    status: wooCreated ? "done" : wooFailed ? "error" : "pending",
    at: iso(wooCreated?.created_at),
    detail: wooCreated
      ? [
          { label: "Call", value: "POST /wp-json/wc/v3/orders" },
          { label: "Store", value: "woodemo.tallkarol.com" },
          { label: "Woo order", value: `#${String(wooCreated.detail?.wooOrderId ?? "—")}` },
          { label: "Status", value: String(wooCreated.detail?.status ?? "pending") },
        ]
      : wooFailed
        ? [{ label: "Error", value: String(wooFailed.detail?.error ?? "unknown") }]
        : [{ label: "Call", value: "POST /wp-json/wc/v3/orders" }],
    note: wooFailed
      ? "Woo was unreachable. The journey deliberately keeps running without it rather than dying — degrade, don't stop."
      : "A real row in a real store's admin, authenticated over the REST API.",
  })

  /* ------------------------------------------------------ portal account */
  rows.push({
    id: "portal-account",
    kind: "step",
    title: "Open a portal account for the buyer",
    status: account ? "done" : "pending",
    at: iso(account?.created_at),
    detail: [
      { label: "Login", value: run.email },
      { label: "Password", value: "demo" },
      { label: "Scope", value: "read-only, this one order" },
    ],
    note: "Same auth the published portal demo uses — this account is just scoped to their own run.",
  })

  /* ------------------------------------------------------- welcome email */
  rows.push({
    id: "welcome",
    kind: "step",
    title: "Send the welcome email",
    status: welcome ? "done" : welcomeFailed ? "error" : "pending",
    at: iso(welcome?.created_at),
    detail: welcome
      ? [
          { label: "Provider", value: "Resend" },
          { label: "Subject", value: String(welcome.detail?.subject ?? "") },
          { label: "Message id", value: String(welcome.detail?.resendId ?? "—") },
          { label: "Link tags", value: "utm_source=harbor-pine · utm_medium=email · utm_campaign=journey_welcome" },
        ]
      : welcomeFailed
        ? [{ label: "Error", value: String(welcomeFailed.detail?.error ?? "unknown") }]
        : [{ label: "Provider", value: "Resend" }],
    note: "Its link is also the verification — which is why nothing after this can fire on its own.",
  })

  /* --------------------------------------------------- WAIT: email click */
  rows.push({
    id: "wait-click",
    kind: "wait",
    title: "Waiting on click in email",
    status: awaiting ? "waiting" : clicked ? "done" : "pending",
    at: iso(clicked?.created_at),
    since: iso(welcome?.created_at ?? run.createdAt),
    detail: [
      { label: "Watching for", value: "GET /api/t?e=email.link.clicked with a valid run token" },
      { label: "Inbox", value: run.email },
      { label: "Timeout", value: "none — the run just parks here" },
      { label: "Blocks", value: "every remaining step" },
    ],
    note: "A real automation spends most of its life parked exactly like this. No click, no further email — that's the anti-spam design.",
  })

  /* ------------------------------------------------------ click received */
  rows.push({
    id: "clicked",
    kind: "step",
    title: "Click received — verify, attribute, advance",
    status: clicked ? "done" : "pending",
    at: iso(clicked?.created_at),
    detail: clicked
      ? [
          { label: "Verified", value: "run token matched" },
          {
            label: "Attribution",
            value: attributed
              ? String(attributed.detail?.campaign ?? "journey_welcome")
              : String(clicked.utm?.utm_campaign ?? "journey_welcome"),
          },
          { label: "Captured in", value: "journey_events — in-process, no third-party tag" },
          { label: "Woo status", value: "pending → processing" },
        ]
      : [{ label: "Waiting", value: "nothing measured until the click lands" }],
    note: "This is the moment the tracker earns its keep: attribution is a same-region INSERT, not a next-day export.",
  })

  /* ------------------------------------------------------ fulfilment loop */
  const stageRows: ConsoleSubstep[] = run.order.timeline.map((step) => ({
    label: step.label,
    at: iso(step.at),
    state: step.state,
    fired: STAGE_EFFECTS[step.key] ?? "timelines written",
  }))

  rows.push({
    id: "stages",
    kind: "step",
    title: `Fulfilment loop — ${stageTotal} stages`,
    status: delivered ? "done" : run.status === "active" ? "running" : "pending",
    at: delivered ? iso(run.order.timeline[stageTotal - 1]?.at) : null,
    detail: [
      { label: "Now", value: `${run.stageIndex + 1} of ${stageTotal} — ${run.order.status}` },
      { label: "Fan-out per stage", value: "portal · CRM · SMS where relevant · Woo note" },
      { label: "Clock", value: "compressed — about a minute per stage" },
    ],
    substeps: stageRows,
    note: "Eight weeks of made-to-order furniture. The stages are real; only the clock is compressed.",
  })

  /* ------------------------------------------- WAIT: the workshop clock */
  if (!delivered) {
    rows.push({
      id: "wait-stage",
      kind: "wait",
      title: "Waiting on the workshop clock",
      status: run.status === "active" ? "waiting" : "pending",
      since: iso(run.order.timeline[run.stageIndex]?.at),
      detail: [
        {
          label: "Next stage",
          value: run.order.timeline[run.stageIndex + 1]?.label ?? "—",
        },
        { label: "Measuring", value: "elapsed time only — no external system to poll" },
        { label: "Advances", value: "on read — the page you're on drives the clock" },
      ],
      note: "In production this wait is days, driven by the workshop, not a timer.",
    })
  }

  /* ------------------------------------------------------- coupon email */
  rows.push({
    id: "coupon-mail",
    kind: "step",
    title: "Send the delivered + coupon email",
    status: couponMail ? "done" : delivered ? "running" : "pending",
    at: iso(couponMail?.created_at),
    detail: couponMail
      ? [
          { label: "Subject", value: String(couponMail.detail?.subject ?? "") },
          { label: "Message id", value: String(couponMail.detail?.resendId ?? "—") },
          { label: "Coupon", value: "PINE10" },
          { label: "Link tags", value: "utm_campaign=journey_coupon" },
        ]
      : [{ label: "Fires", value: "on the delivered stage" }],
    note: "The second designed send — and the one carrying the loop's payload.",
  })

  /* -------------------------------------------------- WAIT: coupon click */
  rows.push({
    id: "wait-coupon",
    kind: "wait",
    title: "Waiting on coupon click in email",
    status: redeemed ? "done" : delivered ? "waiting" : "pending",
    at: iso(redeemed?.created_at),
    since: iso(couponMail?.created_at),
    detail: [
      { label: "Watching for", value: "GET /api/t?e=coupon.redeemed" },
      { label: "Inbox", value: run.email },
      { label: "Measuring", value: "redemption attribution — coupon × campaign × revenue" },
    ],
    note: "This is the wait every ecommerce operator actually cares about: does the second order come?",
  })

  /* ------------------------------------------------------------- the loop */
  rows.push({
    id: "loop",
    kind: "step",
    title: "Loop closed — coupon.redeemed → order.created",
    status: closed ? "done" : "pending",
    at: iso(closed?.created_at),
    detail: closed
      ? [
          { label: "Fired", value: "coupon.redeemed" },
          { label: "CRM", value: "tagged repeat-intent" },
          { label: "Analytics", value: "redemption joined to its campaign" },
        ]
      : [{ label: "Fires", value: "when the coupon link is clicked" }],
    note: "The green wire on the diagram. A one-time buyer became a repeat one, and the system can prove which email did it.",
  })

  /* Woo's webhook comes back asynchronously — surface it when it exists. */
  if (webhook) {
    rows.push({
      id: "webhook",
      kind: "step",
      title: "Woo webhook received back",
      status: "done",
      at: iso(webhook.created_at),
      detail: [
        { label: "Signature", value: "HMAC-SHA256 verified" },
        { label: "Woo order", value: `#${String(webhook.detail?.wooOrderId ?? "—")}` },
        { label: "Status", value: String(webhook.detail?.status ?? "—") },
      ],
      note: "The system hearing its own change come back from the store it changed.",
    })
  }

  return rows
}
