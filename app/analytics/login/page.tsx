import { redirect } from "next/navigation"
import { DemoBar } from "@/components/chrome/DemoBar"
import { LoginScreen } from "@/components/auth/LoginScreen"
import { getSessionUser } from "@/lib/auth"

export const metadata = { title: "Sign in — Harbor & Freight Insights" }

export default async function AnalyticsLoginPage() {
  const user = await getSessionUser()
  if (user?.access.analytics) redirect("/analytics")

  return (
    <>
      <DemoBar demo="analytics" />
      <LoginScreen
        demo="analytics"
        points={[
          "Store revenue, orders, and customer cohorts in one place",
          "Campaign performance across UTMs, coupons, landing pages, and email",
          "GA4 sessions and Google Ads spend alongside the numbers they moved",
          "Saved reports and CSV export for the cuts you run every week",
        ]}
        accounts={[
          {
            email: "admin-demo@tallkarol.com",
            label: "Owner",
            hint: "full access: margin, ad spend, exports, settings",
          },
          {
            email: "analyst-demo@tallkarol.com",
            label: "Analyst",
            hint: "same reports, cost and margin columns hidden",
          },
        ]}
      />
    </>
  )
}
