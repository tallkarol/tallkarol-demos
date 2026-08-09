/**
 * Writes the demo dataset to data/store.json.
 *
 * Run once, commit the output: `node scripts/generate-data.mjs`
 *
 * ONE store feeds BOTH demos. Harbor & Pine is a made-up mid-century-modern
 * audiophile furniture company running WooCommerce (catalogue, materials, and
 * palette follow ~/Work/harbor-pine/harbor_pine_brand.md, so the demos and the
 * real WooCommerce build stay in step); the analytics suite reads this file as the merchant's
 * internal reporting layer, and the customer portal reads the same orders as
 * the buyer's order tracker. That's deliberate — two apps over one dataset is
 * how the real thing works, and it means a number in the dashboard and a
 * number in a customer's order are the same number.
 *
 * The PRNG is seeded, so re-running produces byte-identical files: a
 * screenshot never disagrees with the app.
 *
 * Field names in the `ga4` and `ads` blocks are the real metric names those
 * APIs return (sessions, engagedSessions, engagementRate, averageCpc,
 * costPerConversion, searchImpressionShare…). The values are invented; the
 * shape is not.
 */

import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

/* Mulberry32 — small, seeded, deterministic. */
function rng(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round = (n, d = 2) => Number(n.toFixed(d))
const pick = (r, list) => list[Math.floor(r() * list.length)]
const between = (r, min, max) => min + r() * (max - min)

const END = new Date("2026-08-09T00:00:00Z")
const DAYS = 90

const isoDay = (offsetFromEnd) => {
  const d = new Date(END)
  d.setUTCDate(d.getUTCDate() - offsetFromEnd)
  return d.toISOString().slice(0, 10)
}

const addDays = (iso, days) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const stamp = (r, iso) =>
  `${iso}T${String(Math.floor(between(r, 8, 18))).padStart(2, "0")}:${String(
    Math.floor(between(r, 0, 59))
  ).padStart(2, "0")}:00Z`

const dates = Array.from({ length: DAYS }, (_, i) => isoDay(DAYS - 1 - i))

/* ------------------------------------------------------------------ catalog */

const PRODUCTS = [
  ["The Mariner Console 60\"", "HP-MAR-601", "Audio", 4850, "made-to-order", 10],
  ["The Mariner Console 72\"", "HP-MAR-721", "Audio", 5680, "made-to-order", 10],
  ["Mariner Record Drawer Module", "HP-MAR-DRW", "Audio", 720, "in-stock", 0],
  ["The Gallery Coffee Table", "HP-GAL-301", "Tables", 1780, "made-to-order", 8],
  ["The Gallery Coffee Table, Petite", "HP-GAL-311", "Tables", 1490, "in-stock", 0],
  ["The Tailored End Table", "HP-TAI-201", "Tables", 940, "in-stock", 0],
  ["The Tailored End Table (pair)", "HP-TAI-202", "Tables", 1780, "made-to-order", 7],
  ["Modular Bookshelf System, 3-bay", "HP-MOD-403", "Shelving", 3960, "made-to-order", 9],
  ["Modular Bookshelf System, 5-bay", "HP-MOD-405", "Shelving", 6240, "made-to-order", 12],
  ["Modular Bookshelf Add-on Bay", "HP-MOD-401", "Shelving", 1320, "made-to-order", 6],
]

/**
 * Configurable options, straight off the brand sheet: walnut veneer, woven
 * cane, brass hardware. Cane only exists on the pieces that actually have a
 * cane surface — the Mariner's speaker grille, the Gallery's lower shelf, and
 * the Modular system's sliding doors.
 */
const FINISHES = ["Deep Walnut", "Natural Walnut", "Ebonised Oak"]
const HARDWARE = ["Antique Brass", "Brushed Brass", "Blackened Brass"]
const CANE = ["Natural Cane", "Smoked Cane"]

const HAS_CANE = new Set(["HP-MAR-601", "HP-MAR-721", "HP-GAL-301", "HP-GAL-311", "HP-MOD-403", "HP-MOD-405", "HP-MOD-401"])

function buildProducts() {
  const r = rng(31337)
  return PRODUCTS.map(([name, sku, category, price, availability, leadWeeks]) => {
    const units = Math.round(between(r, 18, 210))
    const revenue = round(units * price)
    const marginRate = between(r, 0.36, 0.58)
    return {
      sku,
      name,
      category,
      price,
      availability,
      leadTimeWeeks: leadWeeks,
      units,
      revenue,
      grossMargin: round(revenue * marginRate),
      marginRate: round(marginRate, 4),
      returnRate: round(between(r, 0.004, 0.038), 4),
      inventory: availability === "in-stock" ? Math.round(between(r, 4, 90)) : 0,
    }
  }).sort((a, b) => b.revenue - a.revenue)
}

/* ---------------------------------------------------------------- customers */

const FIRST_NAMES = ["Alicia", "Marcus", "Devon", "Priya", "Noah", "Elena", "Tomas", "Ruth", "Ibrahim", "Clara", "Jonas", "Mei", "Owen", "Sofia", "Hugo", "Nadia", "Felix", "Rosa", "Andre", "Kiara"]
const LAST_NAMES = ["Whitfield", "Oyelaran", "Marsh", "Raman", "Bergstrom", "Ruiz", "Novak", "Adeyemi", "Haddad", "Lindqvist", "Weber", "Chen", "Gallagher", "Moreau", "Silva", "Okafor", "Brandt", "Delgado", "Fontaine", "Nakamura"]

const CITIES = [
  ["Portland", "OR", "97214"],
  ["Austin", "TX", "78704"],
  ["Denver", "CO", "80206"],
  ["Chicago", "IL", "60622"],
  ["Raleigh", "NC", "27601"],
  ["Providence", "RI", "02903"],
  ["Boise", "ID", "83702"],
  ["Savannah", "GA", "31401"],
]

const CHANNELS = [
  { key: "organic", label: "Organic search", share: 0.32 },
  { key: "paid", label: "Paid search", share: 0.28 },
  { key: "email", label: "Email", share: 0.2 },
  { key: "direct", label: "Direct", share: 0.15 },
  { key: "other", label: "Other", share: 0.05 },
]

function buildCustomers() {
  const r = rng(9182736)
  return Array.from({ length: 26 }, (_, i) => {
    // Index 0 is the signed-in demo customer, so their record is fixed.
    const first = i === 0 ? "Marcus" : FIRST_NAMES[(i * 3) % FIRST_NAMES.length]
    const last = i === 0 ? "Oyelaran" : LAST_NAMES[(i * 7) % LAST_NAMES.length]
    const [city, state, zip] = i === 0 ? CITIES[0] : pick(r, CITIES)
    return {
      id: i === 0 ? "c_1042" : `c_${1100 + i}`,
      name: `${first} ${last}`,
      email:
        i === 0
          ? "customer-demo@tallkarol.com"
          : `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      phone: `(${Math.floor(between(r, 201, 989))}) 555-${String(Math.floor(between(r, 1000, 9999)))}`,
      address: {
        line1: `${Math.floor(between(r, 12, 4800))} ${pick(r, ["Alder", "Cedar", "Juniper", "Mariner", "Harbor", "Pine"])} ${pick(r, ["St", "Ave", "Rd", "Ln"])}`,
        city,
        state,
        zip,
      },
      acquisitionChannel: pick(r, CHANNELS.slice(0, 4)).key,
      joinedOn: isoDay(Math.round(between(r, 40, 700))),
    }
  })
}

/* ------------------------------------------------------------------- orders */

/**
 * The fulfilment ladder. This is the portal's whole reason to exist: furniture
 * is bought once and then waited on for two months, and the wait is where the
 * support tickets come from. Every stage carries a customer-facing line,
 * because "In production" alone is not an update.
 */
const STAGES = [
  ["placed", "Order placed", "We've got your order and it's in the queue."],
  ["confirmed", "Payment confirmed", "Payment cleared. Your build slot is reserved."],
  ["production", "In production", "Your piece is on the workshop floor."],
  ["quality", "Quality check", "Finish, frame, and hardware inspected before it leaves."],
  ["booked", "Freight booked", "Assigned to a carrier with a delivery window."],
  ["transit", "In transit", "On the road to your regional depot."],
  ["out", "Out for delivery", "Scheduled with the delivery team."],
  ["delivered", "Delivered", "Signed for and in your home."],
]

const EXCEPTIONS = [
  {
    afterStage: "production",
    label: "Veneer backorder",
    note: "{material} is delayed at the mill. Your build slot is held and the new estimate is below.",
    addsDays: 12,
  },
  {
    afterStage: "transit",
    label: "Weather hold",
    note: "Freight is held overnight at the regional depot. No change to your delivery window yet.",
    addsDays: 2,
  },
]

const CARRIERS = ["Ridgeline Freight", "Cardinal Home Delivery", "Northbound Logistics"]

function buildOrders(products, customers) {
  const r = rng(55512)

  const orders = []
  let sequence = 41200

  customers.forEach((customer, customerIndex) => {
    // The demo customer gets a deliberate spread: one delivered, one mid-build
    // with an exception, one just placed. That way a visitor sees a finished
    // timeline, a live one, and a fresh one without hunting.
    const orderCount = customerIndex === 0 ? 3 : Math.round(between(r, 1, 3))

    for (let o = 0; o < orderCount; o += 1) {
      const product = pick(r, products)
      const madeToOrder = product.availability === "made-to-order"

      const stageTarget =
        customerIndex === 0
          ? [7, 2, 0][o]
          : Math.min(STAGES.length - 1, Math.round(between(r, 0, 7)))

      const placedDaysAgo =
        customerIndex === 0 ? [96, 34, 3][o] : Math.round(between(r, 2, 110))
      const placedOn = isoDay(placedDaysAgo)

      const exception =
        customerIndex === 0 && o === 1
          ? EXCEPTIONS[0]
          : r() > 0.86
            ? pick(r, EXCEPTIONS)
            : null

      // Stage spacing: quick admin steps, a long production stretch, then
      // freight. Roughly how a made-to-order furniture timeline actually runs.
      const gaps = { placed: 0, confirmed: 1, production: 3, quality: madeToOrder ? 38 : 4, booked: 4, transit: 3, out: 5, delivered: 1 }

      let cursor = placedOn
      const timeline = STAGES.map(([key, label, blurb], index) => {
        cursor = addDays(cursor, gaps[key] ?? 2)
        if (exception && exception.afterStage === key && index <= stageTarget) {
          cursor = addDays(cursor, exception.addsDays)
        }
        const reached = index <= stageTarget
        return {
          key,
          label,
          blurb,
          at: reached ? stamp(r, cursor) : null,
          expectedOn: reached ? null : cursor,
          state: index < stageTarget ? "complete" : index === stageTarget ? "current" : "upcoming",
        }
      })

      // Attribution comes from a real campaign in the list, so an order's
      // utm tags always match a row on the campaigns screen.
      const attribution = pick(r, CAMPAIGNS)

      const options = [
        { label: "Finish", value: pick(r, FINISHES) },
        ...(HAS_CANE.has(product.sku) ? [{ label: "Cane", value: pick(r, CANE) }] : []),
        { label: "Hardware", value: pick(r, HARDWARE) },
      ]

      const quantity = product.price < 1000 && r() > 0.7 ? 2 : 1
      const subtotal = round(product.price * quantity)
      const whiteGlove = r() > 0.45
      const shipping = whiteGlove ? 249 : 129
      const discountRate = r() > 0.7 ? between(r, 0.05, 0.15) : 0
      const discount = round(subtotal * discountRate)
      const tax = round((subtotal - discount) * 0.072)

      orders.push({
        id: `HP-${sequence}`,
        number: `#HP-${sequence}`,
        customerId: customer.id,
        customerName: customer.name,
        placedOn,
        status: STAGES[stageTarget][1],
        stageKey: STAGES[stageTarget][0],
        stageIndex: stageTarget,
        isComplete: stageTarget === STAGES.length - 1,
        item: {
          sku: product.sku,
          name: product.name,
          category: product.category,
          quantity,
          unitPrice: product.price,
          options,
          madeToOrder,
        },
        totals: { subtotal, discount, shipping, tax, total: round(subtotal - discount + shipping + tax) },
        delivery: {
          whiteGlove,
          carrier: stageTarget >= 4 ? pick(r, CARRIERS) : null,
          trackingNumber: stageTarget >= 5 ? `RF${Math.floor(between(r, 10000000, 99999999))}` : null,
          windowStart: timeline[7].at ? timeline[7].at.slice(0, 10) : timeline[7].expectedOn,
          windowEnd: timeline[7].at
            ? timeline[7].at.slice(0, 10)
            : addDays(timeline[7].expectedOn, 3),
          address: customer.address,
        },
        exception: exception && stageTarget >= STAGES.findIndex(([k]) => k === exception.afterStage)
          ? {
              label: exception.label,
              // The note has to name the customer's actual configuration —
              // a delay notice about a fabric they didn't choose is worse
              // than no notice at all.
              note: exception.note.replace(
                "{material}",
                `${options[0].value} veneer`
              ),
              addedDays: exception.addsDays,
            }
          : null,
        timeline,
        channel: attribution.channel,
        utm: {
          source: attribution.source,
          medium: attribution.medium,
          campaign: attribution.campaign,
        },
        coupon: attribution.coupon,
        documents: [
          { id: `doc_${sequence}_inv`, title: "Invoice", format: "pdf", size: "84 KB" },
          { id: `doc_${sequence}_spec`, title: "Product specification", format: "pdf", size: "610 KB" },
          ...(stageTarget >= 7
            ? [{ id: `doc_${sequence}_care`, title: "Care & warranty guide", format: "pdf", size: "1.1 MB" }]
            : []),
        ],
      })

      sequence += 1
    }
  })

  return orders.sort((a, b) => (a.placedOn < b.placedOn ? 1 : -1))
}

/* -------------------------------------------------------------- daily / ads */

function buildDaily() {
  const r = rng(20260809)
  return dates.map((date, i) => {
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay()
    const weekend = dow === 0 || dow === 6 ? 0.82 : 1
    const trend = 1 + (i / DAYS) * 0.3
    const promo = i >= 58 && i <= 64 ? 1.5 : 1
    const noise = between(r, 0.88, 1.12)

    const sessions = Math.round(1180 * weekend * trend * promo * noise)
    // Furniture converts far lower than commodity ecommerce, and the AOV is a
    // different order of magnitude. Both numbers are set accordingly.
    const conversionRate = between(r, 0.006, 0.013) * (promo > 1 ? 1.3 : 1)
    const orders = Math.max(2, Math.round(sessions * conversionRate))
    const aov = between(r, 1900, 4200)
    const revenue = round(orders * aov)
    const cogs = round(revenue * between(r, 0.44, 0.56))
    const adSpend = round(between(r, 620, 1180) * (promo > 1 ? 1.45 : 1))
    const newCustomers = Math.round(orders * between(r, 0.62, 0.84))

    const channels = {}
    let assigned = 0
    CHANNELS.forEach((channel, index) => {
      const last = index === CHANNELS.length - 1
      const share = last ? Math.max(0, 1 - assigned) : channel.share * between(r, 0.85, 1.15)
      assigned += share
      channels[channel.key] = {
        sessions: Math.round(sessions * share),
        revenue: round(revenue * share),
      }
    })

    return {
      date,
      sessions,
      orders,
      revenue,
      cogs,
      grossMargin: round(revenue - cogs),
      adSpend,
      newCustomers,
      returningCustomers: orders - newCustomers,
      channels,
    }
  })
}

const LANDING_PAGES = [
  "/collections/mariner",
  "/collections/made-to-order",
  "/products/the-mariner-console",
  "/pages/design-consultation",
  "/collections/modular-shelving",
  "/products/the-gallery-coffee-table",
]

const CAMPAIGNS = [
  { id: "cmp_madetoorder", name: "Made-to-Order — Search", source: "google", medium: "cpc", campaign: "made_to_order_2026", channel: "paid", coupon: null, paid: true },
  { id: "cmp_livingroom_pmax", name: "Mariner Console — Performance Max", source: "google", medium: "cpc", campaign: "mariner_pmax", channel: "paid", coupon: "MARINER150", paid: true },
  { id: "cmp_brand_defense", name: "Brand Defense", source: "google", medium: "cpc", campaign: "brand_defense", channel: "paid", coupon: null, paid: true },
  { id: "cmp_consult_flow", name: "Design Consultation Flow", source: "klaviyo", medium: "email", campaign: "consult_flow", channel: "email", coupon: "CONSULT100", paid: false, email: true },
  { id: "cmp_swatch_followup", name: "Finish Sample Follow-up", source: "klaviyo", medium: "email", campaign: "sample_followup", channel: "email", coupon: "SAMPLE75", paid: false, email: true },
  { id: "cmp_cart_recovery", name: "Abandoned Cart Recovery", source: "klaviyo", medium: "email", campaign: "cart_recovery", channel: "email", coupon: "CART100", paid: false, email: true },
  { id: "cmp_dining_social", name: "Modular Shelving — Paid Social", source: "meta", medium: "paid_social", campaign: "shelving_q3", channel: "other", coupon: "SHELF125", paid: true },
  { id: "cmp_partner_shelter", name: "Partner Newsletter — Audiophile Weekly", source: "audioweekly", medium: "referral", campaign: "partner_audioweekly", channel: "other", coupon: "AUDIO100", paid: false },
]

function buildCampaigns() {
  const r = rng(770021)
  return CAMPAIGNS.map((c) => {
    const sessions = Math.round(between(r, 1400, 11000))
    const engagementRate = round(between(r, 0.48, 0.81), 4)
    const engagedSessions = Math.round(sessions * engagementRate)
    const conversions = Math.max(1, Math.round(sessions * between(r, 0.004, 0.016)))
    const totalRevenue = round(conversions * between(r, 1750, 4400))
    const couponRedemptions = c.coupon ? Math.round(conversions * between(r, 0.3, 0.75)) : 0

    const ads = c.paid
      ? {
          impressions: Math.round(sessions * between(r, 11, 24)),
          clicks: Math.round(sessions * between(r, 1.03, 1.19)),
          cost: round(sessions * between(r, 1.1, 3.4)),
          averageCpc: 0,
          ctr: 0,
          conversions,
          costPerConversion: 0,
          searchImpressionShare: round(between(r, 0.38, 0.84), 4),
        }
      : null

    if (ads) {
      ads.ctr = round(ads.clicks / ads.impressions, 4)
      ads.averageCpc = round(ads.cost / ads.clicks)
      ads.costPerConversion = round(ads.cost / Math.max(1, ads.conversions))
    }

    const email = c.email
      ? {
          sends: Math.round(sessions * between(r, 3.4, 8)),
          openRate: round(between(r, 0.34, 0.63), 4),
          clickRate: round(between(r, 0.028, 0.091), 4),
          unsubscribeRate: round(between(r, 0.0006, 0.0039), 4),
        }
      : null

    return {
      ...c,
      landingPage: pick(r, LANDING_PAGES),
      ga4: { sessions, engagedSessions, engagementRate, conversions, totalRevenue },
      ads,
      email,
      couponRedemptions,
      roas: ads ? round(totalRevenue / ads.cost) : null,
    }
  })
}

/* -------------------------------------------------------------------- build */

const products = buildProducts()
const customers = buildCustomers()
const orders = buildOrders(products, customers)

/* Customer aggregates are derived from the orders so the two never disagree. */
const customersWithTotals = customers
  .map((customer) => {
    const own = orders.filter((o) => o.customerId === customer.id)
    const lifetimeValue = round(own.reduce((sum, o) => sum + o.totals.total, 0))
    return {
      ...customer,
      orders: own.length,
      lifetimeValue,
      averageOrderValue: own.length ? round(lifetimeValue / own.length) : 0,
      firstOrderDate: own.length ? own[own.length - 1].placedOn : customer.joinedOn,
      lastOrderDate: own.length ? own[0].placedOn : customer.joinedOn,
      cohort: (own.length ? own[own.length - 1].placedOn : customer.joinedOn).slice(0, 7),
    }
  })
  .sort((a, b) => b.lifetimeValue - a.lifetimeValue)

const auditActions = [
  "Viewed order",
  "Downloaded invoice",
  "Signed in",
  "Updated delivery address",
  "Viewed tracking",
]

const auditLog = (() => {
  const r = rng(606060)
  return Array.from({ length: 28 }, (_, i) => {
    const order = pick(r, orders)
    return {
      id: `evt_${9000 + i}`,
      at: stamp(r, isoDay(Math.round(between(r, 0, 30)))),
      actor: r() > 0.72 ? "Dana Whitfield (staff)" : order.customerName,
      action: pick(r, auditActions),
      subject: order.number,
      ip: `203.0.113.${Math.floor(between(r, 2, 250))}`,
    }
  }).sort((a, b) => (a.at < b.at ? 1 : -1))
})()

const store = {
  meta: {
    company: "Harbor & Pine",
    trade: "Mid-century modern audiophile furniture",
    platform: "WooCommerce 9.4",
    currency: "USD",
    periodStart: dates[0],
    periodEnd: dates[dates.length - 1],
    connectedSources: [
      { key: "woocommerce", label: "WooCommerce", detail: "Orders, products, customers" },
      { key: "ga4", label: "Google Analytics 4", detail: "Sessions, engagement, attribution" },
      { key: "google_ads", label: "Google Ads", detail: "Spend, impressions, conversions" },
      { key: "klaviyo", label: "Klaviyo", detail: "Email sends, opens, clicks" },
    ],
  },
  stages: STAGES.map(([key, label, blurb]) => ({ key, label, blurb })),
  channels: CHANNELS.map((c) => ({ ...c })),
  daily: buildDaily(),
  campaigns: buildCampaigns(),
  products,
  customers: customersWithTotals,
  orders,
  auditLog,
}

const path = join(ROOT, "data/store.json")
mkdirSync(dirname(path), { recursive: true })
writeFileSync(path, `${JSON.stringify(store, null, 2)}\n`)
console.log(`wrote data/store.json — ${orders.length} orders, ${customersWithTotals.length} customers`)
