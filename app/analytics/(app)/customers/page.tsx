import { PageHeader, SourceChip } from "@/components/app/PageHeader"
import { CustomerTable } from "@/components/analytics/Tables"
import { requireDemoUser } from "@/lib/auth"
import { store } from "@/lib/store"

export const metadata = { title: "Customers — Harbor & Pine Insights" }

export default async function CustomersPage() {
  await requireDemoUser("analytics")

  return (
    <>
      <PageHeader
        title="Customers"
        description="Lifetime value by acquisition channel and cohort — which channels bring people back, not just which bring people."
        aside={<SourceChip>WooCommerce</SourceChip>}
      />
      <CustomerTable customers={store.customers} />
    </>
  )
}
