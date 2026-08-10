import { notFound } from "next/navigation"
import { JourneyLive } from "@/components/journey/JourneyLive"
import { getRun, advanceIfDue, getEvents } from "@/lib/journey/runs"

export const metadata = { title: "Your journey — live" }
export const dynamic = "force-dynamic"

/**
 * The live run page. Server-renders the current state (advancing the clock on
 * the way), then JourneyLive polls it forward. The run id in the URL is the
 * capability — unguessable, expiring, and scoped to one invented order.
 */
export default async function JourneyRunPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const run = await getRun(id)
  if (!run) notFound()

  const fresh = await advanceIfDue(run)
  const events = await getEvents(id)

  return (
    <main className="min-h-screen bg-tk-onyx text-tk-linen">
      <div className="mx-auto max-w-[1440px] px-6 py-12 sm:py-16">
        <JourneyLive
          initial={{
            run: {
              id: fresh.id,
              status: fresh.status,
              stageIndex: fresh.stage_index,
              orderNumber: fresh.order_number,
              email: fresh.email,
              nextAdvanceAt: fresh.next_advance_at,
              order: fresh.order_json,
              createdAt: fresh.created_at,
            },
            events: events.slice().reverse(),
          }}
        />
      </div>
    </main>
  )
}
