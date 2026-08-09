import { AppShell } from "@/components/app/AppShell"
import type { NavItem } from "@/components/app/AppNav"
import { requireDemoUser } from "@/lib/auth"

/**
 * Route group, not a path segment: /portal/login must stay outside this layout
 * or the gate would redirect the login page to itself.
 *
 * The nav itself is role-shaped — a customer has no "all orders" and no audit
 * trail, so those entries don't exist for them rather than 403-ing on click.
 */
const customerNav: NavItem[] = [
  { href: "/portal", label: "My orders", icon: "orders" },
  { href: "/portal/documents", label: "Documents", icon: "documents" },
]

const adminNav: NavItem[] = [
  { href: "/portal", label: "All orders", icon: "orders" },
  { href: "/portal/documents", label: "Documents", icon: "documents" },
  { href: "/portal/activity", label: "Activity", icon: "audit" },
]

export default async function PortalAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireDemoUser("portal")
  const nav = user.demoRole.role === "admin" ? adminNav : customerNav

  return (
    <AppShell demo="portal" user={user} access={user.demoRole} nav={nav}>
      {children}
    </AppShell>
  )
}
