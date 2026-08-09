import { redirect } from "next/navigation"
import { DemoBar } from "@/components/chrome/DemoBar"
import { LoginScreen } from "@/components/auth/LoginScreen"
import { getSessionUser } from "@/lib/auth"

export const metadata = { title: "Sign in — Harbor & Freight" }

export default async function PortalLoginPage() {
  const user = await getSessionUser()
  if (user?.access.portal) redirect("/portal")

  return (
    <>
      <DemoBar demo="portal" />
      <LoginScreen
        demo="portal"
        points={[
          "Every stage of your order, from the workshop floor to your door",
          "Delivery windows, carrier, and tracking as soon as they exist",
          "Delays explained the day they happen, not when you ask",
          "Invoices, specifications, and care guides in one place",
        ]}
        accounts={[
          {
            email: "customer-demo@tallkarol.com",
            label: "Customer",
            hint: "sees only their own orders",
          },
          {
            email: "admin-demo@tallkarol.com",
            label: "Staff",
            hint: "all orders, plus the access activity trail",
          },
        ]}
      />
    </>
  )
}
