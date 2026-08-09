"use client"

import Image from "next/image"

import { DataTable, type Column } from "@/components/app/DataTable"
import { SERIES } from "@/lib/chart-theme"
import type { Campaign, Customer, Order, Product } from "@/lib/store"
import { currency, percent, shortDate } from "@/lib/utils"

const pct = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`

const channelDot = (channel: string) => (
  <span
    aria-hidden
    className="mr-2 inline-block h-2 w-2 rounded-[2px] align-middle"
    style={{ background: SERIES[channel] ?? SERIES.other }}
  />
)

/**
 * `seesCost` is the roles model reaching the tables: the analyst gets the same
 * rows, minus the columns that expose what the business paid. Columns are
 * removed rather than blanked — a masked column still tells you the number
 * exists and invites the ask.
 */
export function CampaignTable({
  campaigns,
  seesCost,
}: {
  campaigns: Campaign[]
  seesCost: boolean
}) {
  const columns: Column<Campaign>[] = [
    {
      key: "name",
      header: "Campaign",
      sortValue: (c) => c.name,
      render: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-app-ink">
            {channelDot(c.channel)}
            {c.name}
          </p>
          <p className="truncate font-mono text-[11px] text-app-ink/50">
            {c.source} / {c.medium} / {c.campaign}
          </p>
        </div>
      ),
    },
    {
      key: "landing",
      header: "Landing page",
      sortValue: (c) => c.landingPage,
      render: (c) => (
        <span className="font-mono text-[11px] text-app-ink/70">{c.landingPage}</span>
      ),
    },
    {
      key: "sessions",
      header: "Sessions",
      align: "right",
      sortValue: (c) => c.ga4.sessions,
      render: (c) => <span className="nums">{c.ga4.sessions.toLocaleString()}</span>,
    },
    {
      key: "engagement",
      header: "Engagement",
      align: "right",
      sortValue: (c) => c.ga4.engagementRate,
      render: (c) => <span className="nums">{pct(c.ga4.engagementRate)}</span>,
    },
    {
      key: "conversions",
      header: "Conv.",
      align: "right",
      sortValue: (c) => c.ga4.conversions,
      render: (c) => <span className="nums">{c.ga4.conversions}</span>,
    },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      sortValue: (c) => c.ga4.totalRevenue,
      render: (c) => <span className="nums">{currency(c.ga4.totalRevenue)}</span>,
    },
    {
      key: "coupon",
      header: "Coupon",
      sortValue: (c) => c.coupon ?? "",
      render: (c) =>
        c.coupon ? (
          <span className="whitespace-nowrap">
            <span className="font-mono text-[11px] text-app-ink">{c.coupon}</span>
            <span className="ml-1.5 text-[11px] text-app-ink/50">
              ×{c.couponRedemptions}
            </span>
          </span>
        ) : (
          <span className="text-app-ink/35">—</span>
        ),
    },
    ...(seesCost
      ? ([
          {
            key: "cost",
            header: "Cost",
            align: "right",
            sortValue: (c: Campaign) => c.ads?.cost ?? 0,
            render: (c: Campaign) =>
              c.ads ? (
                <span className="nums">{currency(c.ads.cost)}</span>
              ) : (
                <span className="text-app-ink/35">—</span>
              ),
          },
          {
            key: "roas",
            header: "ROAS",
            align: "right",
            sortValue: (c: Campaign) => c.roas ?? 0,
            render: (c: Campaign) =>
              c.roas ? (
                <span className="nums font-medium">{c.roas.toFixed(2)}×</span>
              ) : (
                <span className="text-app-ink/35">—</span>
              ),
          },
        ] as Column<Campaign>[])
      : []),
  ]

  return (
    <DataTable
      columns={columns}
      rows={campaigns}
      getKey={(c) => c.id}
      searchPlaceholder="Filter by campaign, source, coupon, or landing page…"
      initialSort={{ key: "revenue", direction: "desc" }}
    />
  )
}

export function OrderTable({ orders }: { orders: Order[] }) {
  const columns: Column<Order>[] = [
    {
      key: "number",
      header: "Order",
      sortValue: (o) => o.number,
      render: (o) => <span className="font-mono text-xs">{o.number}</span>,
    },
    {
      key: "date",
      header: "Placed",
      sortValue: (o) => o.placedOn,
      render: (o) => <span className="nums">{shortDate(o.placedOn)}</span>,
    },
    {
      key: "customer",
      header: "Customer",
      sortValue: (o) => o.customerName,
      render: (o) => o.customerName,
    },
    {
      key: "item",
      header: "Item",
      sortValue: (o) => o.item.name,
      render: (o) => (
        <span className="block max-w-[15rem] truncate">
          {o.item.name}
          {o.item.quantity > 1 && ` ×${o.item.quantity}`}
        </span>
      ),
    },
    {
      key: "channel",
      header: "Source",
      sortValue: (o) => o.utm.source,
      render: (o) => (
        <span className="font-mono text-[11px] text-app-ink/70">
          {channelDot(o.channel)}
          {o.utm.source}/{o.utm.medium}
        </span>
      ),
    },
    {
      key: "status",
      header: "Stage",
      sortValue: (o) => o.stageIndex,
      render: (o) => (
        <span
          className="whitespace-nowrap rounded-full px-2 py-0.5 text-xs"
          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
        >
          {o.status}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      sortValue: (o) => o.totals.total,
      render: (o) => <span className="nums">{currency(o.totals.total)}</span>,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={orders}
      getKey={(o) => o.id}
      searchPlaceholder="Filter by order, customer, item, or source…"
      initialSort={{ key: "date", direction: "desc" }}
    />
  )
}

export function ProductTable({
  products,
  seesMargin,
}: {
  products: Product[]
  seesMargin: boolean
}) {
  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Product",
      sortValue: (p) => p.name,
      render: (p) => (
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="relative hidden h-9 w-11 shrink-0 overflow-hidden rounded bg-white sm:block"
            style={{ border: "1px solid var(--line)" }}
          >
            <Image src={p.image} alt="" fill sizes="44px" className="object-contain p-0.5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-app-ink">{p.name}</span>
            <span className="block font-mono text-[11px] text-app-ink/50">{p.sku}</span>
          </span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortValue: (p) => p.category,
      render: (p) => p.category,
    },
    {
      key: "availability",
      header: "Availability",
      sortValue: (p) => p.availability,
      render: (p) => (
        <span className="whitespace-nowrap text-xs text-app-ink/70">
          {p.availability === "made-to-order"
            ? `Made to order · ${p.leadTimeWeeks}w`
            : `In stock · ${p.inventory}`}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      sortValue: (p) => p.price,
      render: (p) => <span className="nums">{currency(p.price)}</span>,
    },
    {
      key: "units",
      header: "Units",
      align: "right",
      sortValue: (p) => p.units,
      render: (p) => <span className="nums">{p.units}</span>,
    },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      sortValue: (p) => p.revenue,
      render: (p) => <span className="nums">{currency(p.revenue)}</span>,
    },
    ...(seesMargin
      ? ([
          {
            key: "margin",
            header: "Margin",
            align: "right",
            sortValue: (p: Product) => p.marginRate,
            render: (p: Product) => (
              <span className="nums">{pct(p.marginRate, 0)}</span>
            ),
          },
        ] as Column<Product>[])
      : []),
    {
      key: "returns",
      header: "Returns",
      align: "right",
      sortValue: (p) => p.returnRate,
      render: (p) => <span className="nums text-app-ink/70">{pct(p.returnRate)}</span>,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={products}
      getKey={(p) => p.sku}
      searchPlaceholder="Filter by product, SKU, or category…"
      initialSort={{ key: "revenue", direction: "desc" }}
    />
  )
}

export function CustomerTable({ customers }: { customers: Customer[] }) {
  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      sortValue: (c) => c.name,
      render: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-app-ink">{c.name}</p>
          <p className="truncate text-[11px] text-app-ink/50">{c.email}</p>
        </div>
      ),
    },
    {
      key: "channel",
      header: "Acquired via",
      sortValue: (c) => c.acquisitionChannel,
      render: (c) => (
        <span className="whitespace-nowrap text-xs">
          {channelDot(c.acquisitionChannel)}
          {c.acquisitionChannel}
        </span>
      ),
    },
    {
      key: "cohort",
      header: "Cohort",
      sortValue: (c) => c.cohort,
      render: (c) => <span className="nums text-xs">{c.cohort}</span>,
    },
    {
      key: "orders",
      header: "Orders",
      align: "right",
      sortValue: (c) => c.orders,
      render: (c) => <span className="nums">{c.orders}</span>,
    },
    {
      key: "aov",
      header: "AOV",
      align: "right",
      sortValue: (c) => c.averageOrderValue,
      render: (c) => <span className="nums">{currency(c.averageOrderValue)}</span>,
    },
    {
      key: "ltv",
      header: "Lifetime value",
      align: "right",
      sortValue: (c) => c.lifetimeValue,
      render: (c) => (
        <span className="nums font-medium">{currency(c.lifetimeValue)}</span>
      ),
    },
    {
      key: "last",
      header: "Last order",
      align: "right",
      sortValue: (c) => c.lastOrderDate,
      render: (c) => <span className="nums">{shortDate(c.lastOrderDate)}</span>,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={customers}
      getKey={(c) => c.id}
      searchPlaceholder="Filter by name, email, or channel…"
      initialSort={{ key: "ltv", direction: "desc" }}
    />
  )
}
