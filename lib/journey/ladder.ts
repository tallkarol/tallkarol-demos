import { store, type Order, type StageKey } from "@/lib/store"
import type { JourneyProduct } from "@/lib/journey/products"

/**
 * The journey's stage machine.
 *
 * The eight stages are the SAME ladder the seeded portal orders use
 * (store.stages) — a journey order is not a special case, it's a real order
 * moving fast. Time is compressed: one stage every STAGE_SECONDS, so the
 * eight-week furniture arc plays in about ten minutes while the visitor
 * watches.
 *
 * `order_json` in journey_runs holds exactly the portal's Order shape, built
 * and advanced here — which is why the portal renders a live journey order
 * with zero special-casing in its pages.
 */

export const STAGE_SECONDS = 75

const STAGES = store.stages // [{key,label,blurb} × 8]

const HAS_CANE = new Set(["HP-MAR-601", "HP-MAR-721", "HP-GAL-301", "HP-GAL-311", "HP-MOD-403", "HP-MOD-405", "HP-MOD-401"])

const CARRIER = "Ridgeline Freight"

const isoDay = (offsetDays = 0) => {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

export function displayName(email: string, name?: string | null) {
  if (name?.trim()) return name.trim()
  const stem = email.split("@")[0].replace(/[._-]+/g, " ").trim()
  return stem
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ") || "Journey Guest"
}

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "JG"
}

/** The Order as it looks the moment the run starts (stage 0, unverified). */
export function buildOrder(opts: {
  runId: string
  orderNumber: string
  email: string
  name?: string | null
  product: JourneyProduct
}): Order {
  const { runId, orderNumber, product } = opts
  const customerName = displayName(opts.email, opts.name)
  const now = new Date().toISOString()

  const options = [
    { label: "Finish", value: "Deep Walnut" },
    ...(HAS_CANE.has(product.sku) ? [{ label: "Cane", value: "Natural Cane" }] : []),
    { label: "Hardware", value: "Antique Brass" },
  ]

  const subtotal = product.price
  const shipping = 249
  const tax = Math.round((subtotal * 0.072 + Number.EPSILON) * 100) / 100

  return {
    id: runId,
    number: orderNumber,
    customerId: `jr:${runId}`,
    customerName,
    placedOn: isoDay(0),
    status: STAGES[0].label,
    stageKey: STAGES[0].key,
    stageIndex: 0,
    isComplete: false,
    item: {
      sku: product.sku,
      name: product.name,
      category: product.category,
      image: product.image,
      quantity: 1,
      unitPrice: product.price,
      options,
      madeToOrder: product.availability === "made-to-order",
    },
    totals: {
      subtotal,
      discount: 0,
      shipping,
      tax,
      total: Math.round((subtotal + shipping + tax) * 100) / 100,
    },
    delivery: {
      whiteGlove: true,
      carrier: null,
      trackingNumber: null,
      windowStart: isoDay(18),
      windowEnd: isoDay(21),
      address: { line1: "Your address stays yours", city: "Demo", state: "US", zip: "00000" },
    },
    exception: null,
    timeline: STAGES.map((stage, index) => ({
      key: stage.key,
      label: stage.label,
      blurb: stage.blurb,
      at: index === 0 ? now : null,
      expectedOn: index === 0 ? null : isoDay(index * 3),
      state: index === 0 ? "current" : "upcoming",
    })),
    channel: "email",
    utm: { source: "harbor-pine", medium: "email", campaign: "live_journey" },
    coupon: null,
    documents: [
      { id: `doc_${runId}_inv`, title: "Invoice", format: "pdf", size: "84 KB" },
      { id: `doc_${runId}_spec`, title: "Product specification", format: "pdf", size: "610 KB" },
    ],
  }
}

/** Advance the embedded order to `stageIndex`, stamping real timestamps. */
export function applyStage(order: Order, stageIndex: number): Order {
  const now = new Date().toISOString()
  const stage = STAGES[stageIndex]

  const timeline = order.timeline.map((step, index) => ({
    ...step,
    at: index < stageIndex ? (step.at ?? now) : index === stageIndex ? now : null,
    expectedOn: index <= stageIndex ? null : step.expectedOn,
    state:
      index < stageIndex
        ? ("complete" as const)
        : index === stageIndex
          ? ("current" as const)
          : ("upcoming" as const),
  }))

  const key = stage.key as StageKey
  const isComplete = stageIndex === STAGES.length - 1

  return {
    ...order,
    status: stage.label,
    stageKey: key,
    stageIndex,
    isComplete,
    timeline,
    delivery: {
      ...order.delivery,
      carrier: stageIndex >= 4 ? CARRIER : order.delivery.carrier,
      trackingNumber:
        stageIndex >= 5
          ? order.delivery.trackingNumber ?? `RF${String(Math.abs(hash(order.id))).slice(0, 8)}`
          : order.delivery.trackingNumber,
      windowStart: isComplete ? isoDay(0) : order.delivery.windowStart,
      windowEnd: isComplete ? isoDay(0) : order.delivery.windowEnd,
    },
    documents: isComplete
      ? [
          ...order.documents,
          { id: `doc_${order.id}_care`, title: "Care & warranty guide", format: "pdf", size: "1.1 MB" },
        ]
      : order.documents,
  }
}

/* Deterministic per-run "tracking number" without Math.random. */
function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h || 1
}

/**
 * What each lane does when a stage lands. The returned events are written to
 * journey_events verbatim — the run page renders them as the live wiring, and
 * the analytics "Live" source counts them.
 */
export function stageEvents(stageIndex: number, order: Order) {
  const stage = STAGES[stageIndex]
  const events: { type: string; lane: string; detail: Record<string, unknown> }[] = [
    {
      type: "stage.advanced",
      lane: "router",
      detail: { stage: stage.key, label: stage.label },
    },
    {
      type: "portal.timeline.updated",
      lane: "portal",
      detail: { stage: stage.key },
    },
    {
      type: "crm.timeline.appended",
      lane: "crm",
      detail: { entry: `${order.number} → ${stage.label}` },
    },
  ]

  const sms = (body: string) =>
    events.push({ type: "sms.sent.simulated", lane: "sms", detail: { body } })

  switch (stage.key) {
    case "confirmed":
      events.push({
        type: "crm.contact.upserted",
        lane: "crm",
        detail: { contact: order.customerName, key: "email" },
      })
      break
    case "booked":
      sms(
        `Harbor & Pine: your ${order.item.name} is with ${CARRIER}. Delivery window ${order.delivery.windowStart} – ${order.delivery.windowEnd}. Reply here anytime — a person answers.`
      )
      events.push({
        type: "crm.task.created",
        lane: "crm",
        detail: { task: "White-glove call — 48h before window" },
      })
      break
    case "transit":
      sms(`Harbor & Pine: ${order.item.name} is on the road to your regional depot.`)
      break
    case "out":
      sms(`Harbor & Pine: out for delivery today. The team will call 30 minutes ahead.`)
      break
    case "delivered":
      sms(`Harbor & Pine: delivered and signed for. Your care guide is in the portal.`)
      events.push({
        type: "crm.tag.applied",
        lane: "crm",
        detail: { tags: ["delivered", "review-ask-scheduled"] },
      })
      break
  }

  return events
}

export const stageCount = STAGES.length
