import { PageHeader, SourceChip } from "@/components/app/PageHeader"
import { CampaignTable } from "@/components/analytics/Tables"
import { requireDemoUser, can } from "@/lib/auth"
import { store } from "@/lib/store"
import { journeyCampaigns } from "@/lib/journey/analytics"

export const metadata = { title: "Campaigns — Harbor & Pine Insights" }

export default async function CampaignsPage() {
  const user = await requireDemoUser("analytics")

  /* The journey's own sends, shaped like campaign rows and merged in. This is
     the three-demo story closing: visitors running the automation show up in
     the merchant's campaigns view beside the seeded baseline. */
  const live = await journeyCampaigns()
  const liveRows = live.map((row) => ({
    id: `live_${row.campaign}`,
    name: row.campaign === "journey_coupon" ? "Live journey — coupon" : "Live journey — welcome",
    source: row.source,
    medium: row.medium,
    campaign: row.campaign,
    channel: "email" as const,
    coupon: row.campaign === "journey_coupon" ? "PINE10" : null,
    landingPage: "/journey",
    couponRedemptions: row.campaign === "journey_coupon" ? row.clicks : 0,
    roas: null,
    ga4: {
      sessions: row.clicks,
      engagedSessions: row.clicks,
      engagementRate: 1,
      conversions: row.clicks,
      totalRevenue: row.revenue,
    },
    ads: null,
    email: {
      sends: row.sends,
      openRate: 0,
      clickRate: row.clickRate,
      unsubscribeRate: 0,
    },
  }))

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
            <SourceChip>Live journeys</SourceChip>
          </div>
        }
      />
      <CampaignTable
        campaigns={[...liveRows, ...store.campaigns]}
        seesCost={can(user, "analytics", "view:adspend")}
      />
    </>
  )
}
