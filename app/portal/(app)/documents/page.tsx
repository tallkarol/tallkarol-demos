import { Download, FileText } from "lucide-react"
import { PageHeader } from "@/components/app/PageHeader"
import { Stagger } from "@/components/motion/Stagger"
import { requireDemoUser } from "@/lib/auth"
import { store } from "@/lib/store"
import { portalOrders } from "@/lib/journey/portalBridge"
import { longDate } from "@/lib/utils"

export const metadata = { title: "Documents — Harbor & Pine" }

export default async function DocumentsPage() {
  const user = await requireDemoUser("portal")
  const isAdmin = user.demoRole.role === "admin"
  const orders = isAdmin ? store.orders : await portalOrders(user)

  const documents = orders.flatMap((order) =>
    order.documents.map((document) => ({
      ...document,
      orderNumber: order.number,
      orderItem: order.item.name,
      customerName: order.customerName,
      placedOn: order.placedOn,
    }))
  )

  return (
    <>
      <PageHeader
        title="Documents"
        description={
          isAdmin
            ? "Every document attached to an order, across all customers."
            : "Invoices, specifications, and care guides for your orders."
        }
      />

      <Stagger as="ul" className="grid gap-3" gap={45}>
        {documents.map((document) => (
          <li key={document.id} data-anim="rise">
            <div className="panel flex flex-wrap items-center gap-4 p-4">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                style={{ background: "var(--brand-soft)" }}
              >
                <FileText className="h-4 w-4" style={{ color: "var(--brand)" }} aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="font-ui text-sm font-semibold text-app-ink">
                  {document.title}
                </p>
                <p className="truncate text-xs text-app-ink/55">
                  <span className="font-mono">{document.orderNumber}</span> ·{" "}
                  {document.orderItem}
                  {isAdmin && ` · ${document.customerName}`} ·{" "}
                  {longDate(document.placedOn)}
                </p>
              </div>

              <span className="shrink-0 text-xs uppercase text-app-ink/45">
                {document.format} · {document.size}
              </span>
              <Download className="h-4 w-4 shrink-0 text-app-ink/35" aria-hidden="true" />
            </div>
          </li>
        ))}
      </Stagger>
    </>
  )
}
