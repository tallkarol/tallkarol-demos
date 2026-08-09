import Link from "next/link"
import Image from "next/image"
import { AlertTriangle, ArrowRight, PackageCheck, Truck } from "lucide-react"
import { PageHeader } from "@/components/app/PageHeader"
import { Stagger } from "@/components/motion/Stagger"
import { StageBar } from "@/components/portal/StageBar"
import { AdminOrderTable } from "@/components/portal/AdminOrderTable"
import { requireDemoUser } from "@/lib/auth"
import { store, ordersForCustomer, type Order } from "@/lib/store"
import { currency, longDate } from "@/lib/utils"

export const metadata = { title: "My orders — Harbor & Pine" }

function OrderCard({ order }: { order: Order }) {
  return (
    <li data-anim="rise">
      <Link
        href={`/portal/orders/${order.id}`}
        className="panel group block p-5 transition hover:shadow-md"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* Fixed box, object-contain: the studio shots have different
              aspect ratios, and a customer scanning three orders should see
              three same-sized pieces, not three differently-cropped ones. */}
          <div
            className="relative hidden h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-white sm:block"
            style={{ border: "1px solid var(--line)" }}
          >
            <Image
              src={order.item.image}
              alt=""
              fill
              sizes="96px"
              className="object-contain p-1.5"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-app-ink/50">{order.number}</p>
            <h2 className="mt-0.5 font-display text-lg font-semibold tracking-tight text-app-ink">
              {order.item.name}
            </h2>
            <p className="mt-0.5 text-sm text-app-ink/60">
              {order.item.options.map((option) => option.value).join(" · ")}
              {order.item.quantity > 1 && ` · Qty ${order.item.quantity}`}
            </p>
          </div>

          <span
            className="shrink-0 rounded-full px-3 py-1 font-ui text-xs font-semibold"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            {order.status}
          </span>
        </div>

        <div className="mt-5">
          <StageBar order={order} />
        </div>

        {order.exception && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-st-warn/10 px-3 py-2 text-xs text-st-warn">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-semibold">{order.exception.label}.</span>{" "}
              {order.exception.note}
            </span>
          </p>
        )}

        <div
          className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-4 text-xs text-app-ink/60"
          style={{ borderColor: "var(--line)" }}
        >
          <span className="inline-flex items-center gap-1.5">
            {order.isComplete ? (
              <PackageCheck className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Truck className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {order.isComplete
              ? `Delivered ${longDate(order.delivery.windowStart)}`
              : `Arriving ${longDate(order.delivery.windowStart)} – ${longDate(
                  order.delivery.windowEnd
                )}`}
          </span>
          <span className="nums">{currency(order.totals.total)}</span>
          <span className="ml-auto inline-flex items-center gap-1 font-ui font-semibold text-[var(--brand)]">
            Track order
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </Link>
    </li>
  )
}

export default async function PortalHomePage() {
  const user = await requireDemoUser("portal")
  const isAdmin = user.demoRole.role === "admin"

  if (isAdmin) {
    return (
      <>
        <PageHeader
          title="All orders"
          description={`${store.orders.length} orders across ${store.customers.length} customers. Staff view — every record, and the activity trail behind it.`}
        />
        <AdminOrderTable orders={store.orders} />
      </>
    )
  }

  const orders = ordersForCustomer(user.customerId ?? "")
  const active = orders.filter((order) => !order.isComplete)
  const past = orders.filter((order) => order.isComplete)

  return (
    <>
      <PageHeader
        title={`Hello, ${user.name.split(" ")[0]}`}
        description="Every piece you've ordered, and exactly where it is right now."
      />

      {active.length > 0 && (
        <Stagger as="ul" className="grid gap-4" gap={90}>
          {active.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </Stagger>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mb-4 mt-9 font-display text-sm font-semibold uppercase tracking-wider text-app-ink/50">
            Delivered
          </h2>
          <Stagger as="ul" className="grid gap-4" delay={140} gap={90}>
            {past.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </Stagger>
        </>
      )}
    </>
  )
}
