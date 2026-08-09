import { PageHeader, SourceChip } from "@/components/app/PageHeader"
import { CampaignTable } from "@/components/analytics/Tables"
import { requireDemoUser, can } from "@/lib/auth"
import { store } from "@/lib/store"

export const metadata = { title: "Campaigns — Harbor & Freight Insights" }

export default async function CampaignsPage() {
  const user = await requireDemoUser("analytics")

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="UTMs, coupons, landing pages, and email sends in one table — with the GA4 and Google Ads numbers for each beside the revenue they actually produced."
        aside={
          <div className="flex flex-wrap gap-1.5">
            <SourceChip>Google Analytics 4</SourceChip>
            <SourceChip>Google Ads</SourceChip>
            <SourceChip>Klaviyo</SourceChip>
          </div>
        }
      />
      <CampaignTable
        campaigns={store.campaigns}
        seesCost={can(user, "analytics", "view:adspend")}
      />
    </>
  )
}
