import { notFound } from "next/navigation"
import { PageHeader } from "@/components/app/PageHeader"
import { ActivityTable } from "@/components/portal/ActivityTable"
import { requireDemoUser } from "@/lib/auth"
import { store } from "@/lib/store"

export const metadata = { title: "Activity — Harbor & Freight" }

export default async function ActivityPage() {
  const user = await requireDemoUser("portal")

  // Staff-only, enforced server-side. The customer nav doesn't link here, but
  // "not linked" is not a permission model — typing the URL has to fail too.
  if (user.demoRole.role !== "admin") notFound()

  return (
    <>
      <PageHeader
        title="Activity"
        description="Who looked at what, and when. Every read of a customer record is written down — the boring part that makes a portal trustworthy."
      />
      <ActivityTable events={store.auditLog} />
    </>
  )
}
