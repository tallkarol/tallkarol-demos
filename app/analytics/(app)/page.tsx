import { Stagger } from "@/components/motion/Stagger"
import { StatTile } from "@/components/app/StatTile"
import { AreaTrend } from "@/components/charts/AreaTrend"
import { BarRows } from "@/components/charts/BarRows"
import { PageHeader, SourceChip } from "@/components/app/PageHeader"
import { requireDemoUser, can } from "@/lib/auth"
import { SERIES } from "@/lib/chart-theme"
import { currency, compact, longDate } from "@/lib/utils"
import { store, delta, total } from "@/lib/store"

export const metadata = { title: "Overview — Harbor & Pine Insights" }

export default async function AnalyticsOverviewPage() {
  const user = await requireDemoUser("analytics")
  const seesMargin = can(user, "analytics", "view:margin")

  const daily = store.daily
  const revenue = daily.map((d) => d.revenue)
  const orders = daily.map((d) => d.orders)
  const sessions = daily.map((d) => d.sessions)

  const totalRevenue = total(daily, (d) => d.revenue)
  const totalOrders = total(daily, (d) => d.orders)
  const totalSessions = total(daily, (d) => d.sessions)
  const totalMargin = total(daily, (d) => d.grossMargin)

  const channelRows = store.channels.map((channel) => ({
    key: channel.key,
    label: channel.label,
    color: SERIES[channel.key],
    value: daily.reduce((total, day) => total + day.channels[channel.key].revenue, 0),
  }))
  const channelTotal = channelRows.reduce((total, row) => total + row.value, 0)

  const topProducts = store.products.slice(0, 6)

  return (
    <>
      <PageHeader
        title="Overview"
        description={`${longDate(store.meta.periodStart)} – ${longDate(
          store.meta.periodEnd
        )} · ${store.meta.company} · ${store.meta.platform}`}
        aside={
          <div className="flex flex-wrap gap-1.5">
            {store.meta.connectedSources.map((source) => (
              <SourceChip key={source.key}>{source.label}</SourceChip>
            ))}
          </div>
        }
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" gap={70}>
        <div data-anim="rise">
          <StatTile
            label="Revenue"
            value={totalRevenue}
            format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
            delta={delta(revenue)}
            trend={revenue.slice(-30)}
            color={SERIES.organic}
          />
        </div>
        <div data-anim="rise">
          <StatTile
            label="Orders"
            value={totalOrders}
            format={{ maximumFractionDigits: 0 }}
            delta={delta(orders)}
            trend={orders.slice(-30)}
            color={SERIES.paid}
          />
        </div>
        <div data-anim="rise">
          <StatTile
            label="Average order value"
            value={totalRevenue / totalOrders}
            format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }}
            trend={daily.slice(-30).map((d) => d.revenue / d.orders)}
            color={SERIES.email}
          />
        </div>
        <div data-anim="rise">
          {/* The analyst role is the roles model made visible: same page, same
              data, one tile withheld. */}
          <StatTile
            label="Gross margin"
            value={totalMargin}
            format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
            delta={delta(daily.map((d) => d.grossMargin))}
            trend={daily.slice(-30).map((d) => d.grossMargin)}
            color={SERIES.direct}
            locked={!seesMargin}
            lockedNote="Owner only"
          />
        </div>
      </Stagger>

      <Stagger className="mt-6 grid gap-6 xl:grid-cols-3" delay={180} gap={90}>
        <section data-anim="rise" className="panel p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-app-ink">
                Revenue
              </h2>
              <p className="text-xs text-app-ink/55">Daily, last 90 days</p>
            </div>
            <SourceChip>WooCommerce</SourceChip>
          </div>
          <AreaTrend
            points={daily.map((d) => ({ date: d.date, value: d.revenue }))}
            color={SERIES.organic}
            label="Revenue"
            format="currency"
          />
        </section>

        <section data-anim="rise" className="panel p-5">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-app-ink">
                Revenue by channel
              </h2>
              <p className="text-xs text-app-ink/55">Last 90 days</p>
            </div>
          </div>
          <BarRows
            rows={channelRows.map((row) => ({
              ...row,
              note: `${((row.value / channelTotal) * 100).toFixed(1)}% of revenue`,
            }))}
            format="currency"
          />
        </section>
      </Stagger>

      <Stagger className="mt-6 grid gap-6 xl:grid-cols-3" delay={240} gap={90}>
        <section data-anim="rise" className="panel p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-app-ink">
                Sessions
              </h2>
              <p className="text-xs text-app-ink/55">
                Daily, last 90 days · {compact(totalSessions)} total
              </p>
            </div>
            {/* Sessions get their own chart rather than a second axis on the
                revenue plot — two scales on one frame invent correlations. */}
            <SourceChip>Google Analytics 4</SourceChip>
          </div>
          <AreaTrend
            points={daily.map((d) => ({ date: d.date, value: d.sessions }))}
            color={SERIES.email}
            label="Sessions"
            format="compact"
            height={200}
          />
        </section>

        <section data-anim="rise" className="panel p-5">
          <h2 className="font-display text-base font-semibold text-app-ink">
            Top products
          </h2>
          <p className="mb-4 text-xs text-app-ink/55">By revenue, last 90 days</p>
          <BarRows
            rows={topProducts.map((product) => ({
              key: product.sku,
              label: product.name,
              value: product.revenue,
              color: SERIES.organic,
              note: `${product.units} units · ${product.category}`,
            }))}
            format="currency"
          />
        </section>
      </Stagger>
    </>
  )
}
