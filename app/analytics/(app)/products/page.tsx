import { PageHeader, SourceChip } from "@/components/app/PageHeader"
import { ProductTable } from "@/components/analytics/Tables"
import { requireDemoUser, can } from "@/lib/auth"
import { store } from "@/lib/store"

export const metadata = { title: "Products — Harbor & Pine Insights" }

export default async function ProductsPage() {
  const user = await requireDemoUser("analytics")

  return (
    <>
      <PageHeader
        title="Products"
        description="The catalogue by revenue, with lead times and return rates alongside — the two numbers that decide what gets promoted."
        aside={<SourceChip>WooCommerce</SourceChip>}
      />
      <ProductTable
        products={store.products}
        seesMargin={can(user, "analytics", "view:margin")}
      />
    </>
  )
}
