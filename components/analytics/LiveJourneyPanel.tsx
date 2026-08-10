import Link from "next/link"
import { ArrowUpRight, Radio } from "lucide-react"
import type { JourneyFunnel } from "@/lib/journey/analytics"
import { currency, longDate } from "@/lib/utils"

/**
 * The live half of the dashboard: the seeded 90 days are a fixed baseline,
 * and this panel is what visitors running the journey have actually done to
 * the store since. Both worlds, one screen — which is the point of building
 * the journey against the same catalogue.
 *
 * Server component; the funnel is a rollup query on every render, so the
 * numbers move while you watch instead of waiting for a nightly sync.
 */
export function LiveJourneyPanel({ funnel }: { funnel: JourneyFunnel }) {
  const steps = [
    { label: "Journeys started", value: funnel.runs },
    { label: "Email verified", value: funnel.verified },
    { label: "Delivered", value: funnel.delivered },
    { label: "Loop closed", value: funnel.loopsClosed },
  ]
  const top = Math.max(1, funnel.runs)

  return (
    <section className="panel p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-app-ink">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="pulse-ring absolute inset-0 rounded-full text-st-good" />
              <span className="relative h-2 w-2 rounded-full bg-st-good" />
            </span>
            Live journeys
          </h2>
          <p className="mt-1 text-xs text-app-ink/55">
            Real visitors running the automation — not part of the seeded 90 days
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-ui text-[11px] font-medium"
          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
        >
          <Radio className="h-3 w-3" aria-hidden="true" />
          In-house tracker
        </span>
      </div>

      {funnel.runs === 0 ? (
        <p className="text-sm text-app-ink/55">
          No journeys yet.{" "}
          <Link href="/journey" className="font-medium text-[var(--brand)] hover:underline">
            Run one
          </Link>{" "}
          and these numbers move within seconds.
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {steps.map((step) => (
              <li key={step.label}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-app-ink">{step.label}</span>
                  <span className="nums font-display text-sm font-semibold text-app-ink">
                    {step.value}
                  </span>
                </div>
                <div
                  className="mt-1.5 h-2 w-full overflow-hidden rounded-full"
                  style={{ background: "var(--line)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(2, (step.value / top) * 100)}%`,
                      background: "var(--brand)",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <dl
            className="mt-5 grid grid-cols-2 gap-4 border-t pt-4"
            style={{ borderColor: "var(--line)" }}
          >
            <div>
              <dt className="text-xs text-app-ink/55">Order value created</dt>
              <dd className="nums mt-0.5 font-display text-lg font-semibold text-app-ink">
                {currency(funnel.ordersValue)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-app-ink/55">Events captured</dt>
              <dd className="nums mt-0.5 font-display text-lg font-semibold text-app-ink">
                {funnel.events}
              </dd>
            </div>
          </dl>

          {funnel.lastRunAt && (
            <p className="mt-3 text-xs text-app-ink/50">
              Last run {longDate(funnel.lastRunAt.slice(0, 10))} · runs auto-delete after 7 days
            </p>
          )}
        </>
      )}

      <Link
        href="/journey"
        className="mt-4 inline-flex items-center gap-1.5 font-ui text-sm font-semibold text-[var(--brand)] hover:underline"
      >
        Run the journey
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </section>
  )
}
