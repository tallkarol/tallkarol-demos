import raw from "@/data/store.json"

/**
 * Typed view of the single shared dataset.
 *
 * `resolveJsonModule` infers literal object shapes that can't be indexed by a
 * variable key, so the JSON is cast once here and every page imports from this
 * module. Both demos read the same file: the analytics suite is the merchant's
 * side of it, the portal is the customer's.
 */

export type ChannelKey = "organic" | "paid" | "email" | "direct" | "other"

export type StageKey =
  | "placed"
  | "confirmed"
  | "production"
  | "quality"
  | "booked"
  | "transit"
  | "out"
  | "delivered"

export type TimelineStep = {
  key: StageKey
  label: string
  blurb: string
  at: string | null
  expectedOn: string | null
  state: "complete" | "current" | "upcoming"
}

export type Order = {
  id: string
  number: string
  customerId: string
  customerName: string
  placedOn: string
  status: string
  stageKey: StageKey
  stageIndex: number
  isComplete: boolean
  item: {
    sku: string
    name: string
    category: string
    quantity: number
    unitPrice: number
    fabric: string | null
    wood: string | null
    madeToOrder: boolean
  }
  totals: { subtotal: number; discount: number; shipping: number; tax: number; total: number }
  delivery: {
    whiteGlove: boolean
    carrier: string | null
    trackingNumber: string | null
    windowStart: string
    windowEnd: string
    address: { line1: string; city: string; state: string; zip: string }
  }
  exception: { label: string; note: string; addedDays: number } | null
  timeline: TimelineStep[]
  channel: ChannelKey
  utm: { source: string; medium: string; campaign: string }
  coupon: string | null
  documents: { id: string; title: string; format: string; size: string }[]
}

export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  address: { line1: string; city: string; state: string; zip: string }
  acquisitionChannel: ChannelKey
  joinedOn: string
  orders: number
  lifetimeValue: number
  averageOrderValue: number
  firstOrderDate: string
  lastOrderDate: string
  cohort: string
}

export type Product = {
  sku: string
  name: string
  category: string
  price: number
  availability: "made-to-order" | "in-stock"
  leadTimeWeeks: number
  units: number
  revenue: number
  grossMargin: number
  marginRate: number
  returnRate: number
  inventory: number
}

export type DailyRow = {
  date: string
  sessions: number
  orders: number
  revenue: number
  cogs: number
  grossMargin: number
  adSpend: number
  newCustomers: number
  returningCustomers: number
  channels: Record<ChannelKey, { sessions: number; revenue: number }>
}

export type Campaign = {
  id: string
  name: string
  source: string
  medium: string
  campaign: string
  channel: ChannelKey
  coupon: string | null
  landingPage: string
  couponRedemptions: number
  roas: number | null
  ga4: {
    sessions: number
    engagedSessions: number
    engagementRate: number
    conversions: number
    totalRevenue: number
  }
  ads: {
    impressions: number
    clicks: number
    cost: number
    averageCpc: number
    ctr: number
    conversions: number
    costPerConversion: number
    searchImpressionShare: number
  } | null
  email: { sends: number; openRate: number; clickRate: number; unsubscribeRate: number } | null
}

export type StoreData = {
  meta: {
    company: string
    trade: string
    platform: string
    currency: string
    periodStart: string
    periodEnd: string
    connectedSources: { key: string; label: string; detail: string }[]
  }
  stages: { key: StageKey; label: string; blurb: string }[]
  channels: { key: ChannelKey; label: string; share: number }[]
  daily: DailyRow[]
  campaigns: Campaign[]
  products: Product[]
  customers: Customer[]
  orders: Order[]
  auditLog: { id: string; at: string; actor: string; action: string; subject: string; ip: string }[]
}

export const store = raw as unknown as StoreData

/** Percentage change of the last 30 days against the 30 before them. */
export function delta(values: number[]) {
  const recent = values.slice(-30).reduce((a, b) => a + b, 0)
  const prior = values.slice(-60, -30).reduce((a, b) => a + b, 0)
  if (!prior) return 0
  return ((recent - prior) / prior) * 100
}

export const total = <T>(rows: T[], pick: (row: T) => number) =>
  rows.reduce((sum, row) => sum + pick(row), 0)

export const ordersForCustomer = (customerId: string) =>
  store.orders.filter((order) => order.customerId === customerId)

export const findOrder = (id: string) => store.orders.find((order) => order.id === id) ?? null
