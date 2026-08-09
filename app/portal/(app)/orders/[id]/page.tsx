import Link from "next/link"
import { notFound } from "next/navigation"
import { AlertTriangle, ArrowLeft, Download, MapPin, Truck } from "lucide-react"
import { OrderTimeline } from "@/components/portal/OrderTimeline"
import { Stagger } from "@/components/motion/Stagger"
import { requireDemoUser } from "@/lib/auth"
import { findOrder } from "@/lib/store"
import { currency, longDate } from "@/lib/utils"

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireDemoUser("portal")
  const order = findOrder(id)

  // The permission check that matters: a customer can only ever open their own
  // order. Not hidden in the UI — enforced on the server, and a mismatch is a
  // 404 rather than a "forbidden" that confirms the order exists.
  const isAdmin = user.demoRole.role === "admin"
  if (!order || (!isAdmin && order.customerId !== user.customerId)) notFound()

  const { item, totals, delivery } = order

  return (
    <>
      <Link
        href="/portal"
        className="mb-5 inline-flex items-center gap-1.5 font-ui text-sm text-app-ink/60 transition hover:text-app-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {isAdmin ? "All orders" : "My orders"}
      </Link>

      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-app-ink/50">{order.number}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-app-ink">
            {item.name}
          </h1>
          <p className="mt-1 text-sm text-app-ink/60">
            {item.options.map((option) => option.value).join(" · ")}
            {item.quantity > 1 && ` · Qty ${item.quantity}`}
            {item.madeToOrder && " · Made to order"}
          </p>
          {isAdmin && (
            <p className="mt-1 text-sm text-app-ink/60">
              Customer: <span className="text-app-ink">{order.customerName}</span>
            </p>
          )}
        </div>

        <span
          className="rounded-full px-3 py-1.5 font-ui text-sm font-semibold"
          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
        >
          {order.status}
        </span>
      </div>

      {order.exception && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl bg-st-warn/10 px-4 py-3 text-sm text-st-warn">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            <span className="font-semibold">{order.exception.label}.</span>{" "}
            {order.exception.note}{" "}
            <span className="opacity-80">
              Adds about {order.exception.addedDays} days.
            </span>
          </p>
        </div>
      )}

      <Stagger className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" gap={110}>
        <section data-anim="rise" className="panel p-6">
          <h2 className="mb-5 font-display text-base font-semibold text-app-ink">
            Progress
          </h2>
          <OrderTimeline steps={order.timeline} />
        </section>

        <div className="space-y-6">
          <section data-anim="rise" className="panel p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-app-ink">
              Delivery
            </h2>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-app-ink/55">
                  {order.isComplete ? "Delivered" : "Delivery window"}
                </dt>
                <dd className="mt-0.5 text-app-ink">
                  {order.isComplete
                    ? longDate(delivery.windowStart)
                    : `${longDate(delivery.windowStart)} – ${longDate(delivery.windowEnd)}`}
                </dd>
              </div>

              {delivery.carrier && (
                <div>
                  <dt className="text-xs text-app-ink/55">Carrier</dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 text-app-ink">
                    <Truck className="h-3.5 w-3.5 text-app-ink/50" aria-hidden="true" />
                    {delivery.carrier}
                  </dd>
                </div>
              )}

              {delivery.trackingNumber && (
                <div>
                  <dt className="text-xs text-app-ink/55">Tracking</dt>
                  <dd className="mt-0.5 font-mono text-xs text-app-ink">
                    {delivery.trackingNumber}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-xs text-app-ink/55">Service</dt>
                <dd className="mt-0.5 text-app-ink">
                  {delivery.whiteGlove
                    ? "White-glove — placed, assembled, packaging removed"
                    : "Threshold delivery"}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-app-ink/55">Address</dt>
                <dd className="mt-0.5 flex gap-1.5 text-app-ink">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-app-ink/50" aria-hidden="true" />
                  <span>
                    {delivery.address.line1}
                    <br />
                    {delivery.address.city}, {delivery.address.state} {delivery.address.zip}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <section data-anim="rise" className="panel p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-app-ink">
              Summary
            </h2>
            <dl className="space-y-2 text-sm">
              {[
                ["Subtotal", totals.subtotal],
                ...(totals.discount ? ([["Discount", -totals.discount]] as const) : []),
                ["Delivery", totals.shipping],
                ["Tax", totals.tax],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between gap-4">
                  <dt className="text-app-ink/60">{label}</dt>
                  <dd className="nums text-app-ink">{currency(value as number, 2)}</dd>
                </div>
              ))}
              <div
                className="flex justify-between gap-4 border-t pt-2"
                style={{ borderColor: "var(--line)" }}
              >
                <dt className="font-semibold text-app-ink">Total</dt>
                <dd className="nums font-display font-semibold text-app-ink">
                  {currency(totals.total, 2)}
                </dd>
              </div>
            </dl>
          </section>

          <section data-anim="rise" className="panel p-5">
            <h2 className="mb-3 font-display text-base font-semibold text-app-ink">
              Documents
            </h2>
            <ul className="space-y-1">
              {order.documents.map((document) => (
                <li key={document.id}>
                  {/* Demo build: the row is deliberately inert — nothing here
                      writes, sends, or downloads anything. */}
                  <span className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-app-ink/80">
                    <Download className="h-3.5 w-3.5 text-app-ink/45" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{document.title}</span>
                    <span className="shrink-0 text-xs uppercase text-app-ink/45">
                      {document.format} · {document.size}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Stagger>
    </>
  )
}
