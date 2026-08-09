import { AppShell } from "@/components/app/AppShell"
import type { NavItem } from "@/components/app/AppNav"
import { requireDemoUser } from "@/lib/auth"

/**
 * Route group, not a path segment: /analytics/login must stay outside this
 * layout or the gate would redirect the login page to itself.
 */
const nav: NavItem[] = [
  { href: "/analytics", label: "Overview", icon: "dashboard" },
  { href: "/analytics/campaigns", label: "Campaigns", icon: "campaigns" },
  { href: "/analytics/orders", label: "Orders", icon: "orders" },
  { href: "/analytics/products", label: "Products", icon: "products" },
  { href: "/analytics/customers", label: "Customers", icon: "customers" },
]

export default async function AnalyticsAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireDemoUser("analytics")

  return (
    <AppShell demo="analytics" user={user} access={user.demoRole} nav={nav}>
      {children}
    </AppShell>
  )
}
