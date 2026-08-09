import { PageHeader, SourceChip } from "@/components/app/PageHeader"
import { OrderTable } from "@/components/analytics/Tables"
import { requireDemoUser } from "@/lib/auth"
import { store } from "@/lib/store"

export const metadata = { title: "Orders — Harbor & Freight Insights" }

export default async function OrdersPage() {
  await requireDemoUser("analytics")

  return (
    <>
      <PageHeader
        title="Orders"
        description="Every order, with the campaign that produced it attached. These are the same records the customer sees in the order portal."
        aside={<SourceChip>WooCommerce</SourceChip>}
      />
      <OrderTable orders={store.orders} />
    </>
  )
}
