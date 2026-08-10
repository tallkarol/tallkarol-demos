"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowUpRight, Inbox, Loader2, PartyPopper } from "lucide-react"
import { LiveDiagram, type LaneKey } from "@/components/journey/LiveDiagram"
import { RunConsole } from "@/components/journey/RunConsole"
import { buildConsole } from "@/lib/journey/console"
import type { Order } from "@/lib/store"

type JourneyEvent = {
  id: number
  type: string
  lane: string | null
  detail: Record<string, unknown> | null
  utm: Record<string, string> | null
  created_at: string | Date
}

type RunPayload = {
  run: {
    id: string
    status: "awaiting_click" | "active" | "complete" | "expired"
    stageIndex: number
    orderNumber: string
    email: string
    nextAdvanceAt: string | null
    order: Order
    createdAt: string
  }
  events: JourneyEvent[]
}

const POLL_MS = 2500
const LANES: LaneKey[] = ["store", "router", "email", "sms", "crm", "portal", "analytics"]

/**
 * The live run: one clear next action, the wiring diagram doing the work, and
 * every technical layer one click away underneath.
 *
 * The page answers "what do I do now?" before it answers anything else —
 * that's the step rail and the banner. The diagram is the show. The lane
 * detail and the raw ledger are progressive disclosure, because a visitor who
 * wants to inspect the plumbing should be able to, and one who doesn't
 * shouldn't have to look at it.
 */
export function JourneyLive({ initial }: { initial: RunPayload }) {
  const [data, setData] = useState<RunPayload>(initial)
  const [selected, setSelected] = useState<LaneKey | null>(null)
  const lastCount = useRef(initial.events.length)
  const [newestLane, setNewestLane] = useState<LaneKey | null>(null)

  const { run, events } = data
  const loopClosed = useMemo(() => events.some((e) => e.type === "loop.closed"), [events])

  /* Newest-first human lines per lane, for the diagram's in-node feed. */
  const recent = useMemo(() => {
    const base = Object.fromEntries(LANES.map((l) => [l, [] as string[]])) as Record<
      LaneKey,
      string[]
    >
    for (let i = events.length - 1; i >= 0; i--) {
      const event = events[i]
      const lane = event.lane as LaneKey | null
      if (!lane || !(lane in base) || base[lane].length >= 2) continue
      base[lane].push(summarize(event) || event.type)
    }
    return base
  }, [events])

  const counts = useMemo(() => {
    const base = Object.fromEntries(LANES.map((l) => [l, 0])) as Record<LaneKey, number>
    for (const event of events) {
      if (event.lane && event.lane in base) base[event.lane as LaneKey] += 1
    }
    return base
  }, [events])

  useEffect(() => {
    if (run.status === "complete" && loopClosed) return
    const id = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/journey/state/${run.id}`, { cache: "no-store" })
        if (res.ok) setData((await res.json()) as RunPayload)
      } catch {
        /* next tick retries */
      }
    }, POLL_MS)
    return () => window.clearInterval(id)
  }, [run.id, run.status, loopClosed])

  /* Which lane just moved — drives the diagram's flash. */
  useEffect(() => {
    if (events.length <= lastCount.current) return
    lastCount.current = events.length
    const newest = events[events.length - 1]
    if (newest?.lane && LANES.includes(newest.lane as LaneKey)) {
      setNewestLane(newest.lane as LaneKey)
    }
  }, [events])

  const consoleRows = useMemo(() => buildConsole(run, events), [run, events])

  const stageTotal = run.order.timeline.length
  const delivered = run.stageIndex >= stageTotal - 1


  return (
    <div className="space-y-8">
      {/* Identity and next action share a row from md up — the banner is the
          tallest thing on the page and parking it beside the title instead of
          under it buys the diagram most of a fold. */}
      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-8">
        <header className="space-y-1.5">
          <p className="font-mono text-sm text-tk-linen/55">{run.orderNumber}</p>
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-tk-linen sm:text-4xl">
            {run.order.item.name}
          </h1>
        </header>

        <NextAction
          run={run}
          delivered={delivered}
          loopClosed={loopClosed}
          stageTotal={stageTotal}
        />
      </div>

      {/* ------------------------------- the show, with its run console */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        {/* Side-by-side only from xl. Below that the console stacks on top —
            "what's it waiting on" beats a diagram you'd have to scroll
            sideways, and the diagram then gets the full width instead of
            being squeezed by a 23rem column. */}
        <div className="order-2 space-y-6 xl:order-1">
          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-tk-linen">
                Your journey, on the wire
              </h2>
              <p className="text-xs text-tk-linen/50">
                Tap any box to look inside.
              </p>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-tk-linen/12 bg-black/25 p-3 sm:p-5">
              <LiveDiagram
                counts={counts}
                recent={recent}
                selected={selected}
                onSelect={(lane) => setSelected((current) => (current === lane ? null : lane))}
                loopClosed={loopClosed}
                newestLane={newestLane}
              />
            </div>
          </section>

          <LaneDetail
            lane={selected}
            events={events}
            run={run}
            onClose={() => setSelected(null)}
          />
        </div>

        <div className="order-1 xl:order-2">
          <div className="xl:sticky xl:top-6">
            <RunConsole rows={consoleRows} />
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- raw ledger */}
      <details className="group rounded-xl border border-tk-linen/12 bg-black/25">
        <summary className="cursor-pointer list-none px-4 py-3 font-ui text-xs font-semibold uppercase tracking-[0.14em] text-tk-linen/55 transition hover:text-tk-linen">
          Raw event ledger — {events.length} rows
          <span className="ml-2 font-normal normal-case tracking-normal text-tk-linen/40 group-open:hidden">
            (every row your run wrote to Postgres)
          </span>
        </summary>
        <ol className="max-h-72 overflow-y-auto border-t border-tk-linen/10 px-4 py-3 font-mono text-xs leading-6 text-tk-linen/70">
          {events
            .slice()
            .reverse()
            .map((e) => (
              <li key={e.id} className="truncate">
                <span className="text-tk-linen/40">
                  {new Date(e.created_at).toISOString().slice(11, 19)}
                </span>{" "}
                <span className="text-tk-teal">{(e.lane ?? "-").padEnd(9, " ")}</span>
                {e.type}
              </li>
            ))}
        </ol>
      </details>
    </div>
  )
}

/* -------------------------------------------------------------- next step */

function NextAction({
  run,
  delivered,
  loopClosed,
  stageTotal,
}: {
  run: RunPayload["run"]
  delivered: boolean
  loopClosed: boolean
  stageTotal: number
}) {
  if (run.status === "awaiting_click") {
    return (
      <Banner tone="teal" icon={<Inbox className="h-5 w-5" aria-hidden="true" />}>
        <p className="font-display text-lg font-semibold text-tk-linen">
          Open your inbox and click the button
        </p>
        <p className="mt-1 text-sm text-tk-linen/75">
          An email is sitting in <span className="font-mono">{run.email}</span> right now.
          Nothing else happens until you click it — that&apos;s the anti-spam design,
          seen from the inside. (Check spam if it&apos;s shy.)
        </p>
      </Banner>
    )
  }

  if (!delivered) {
    return (
      <Banner tone="teal" icon={<Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}>
        <p className="font-display text-lg font-semibold text-tk-linen">
          It&apos;s running. Just watch.
        </p>
        <p className="mt-1 text-sm text-tk-linen/75">
          Stage <span className="nums font-semibold text-tk-linen">{run.stageIndex + 1}</span> of{" "}
          {stageTotal} — <span className="text-tk-linen">{run.order.status}</span>. A new stage
          lands about every minute; eight weeks of made-to-order furniture, compressed. Texts
          start when freight is booked.
        </p>
      </Banner>
    )
  }

  if (!loopClosed) {
    return (
      <Banner tone="teal" icon={<Inbox className="h-5 w-5" aria-hidden="true" />}>
        <p className="font-display text-lg font-semibold text-tk-linen">
          One more email, one more click
        </p>
        <p className="mt-1 text-sm text-tk-linen/75">
          It&apos;s delivered. A second email just went to{" "}
          <span className="font-mono">{run.email}</span> with coupon <strong>PINE10</strong> —
          clicking it fires <span className="font-mono text-xs">coupon.redeemed</span> and closes
          the green loop on the diagram.
        </p>
      </Banner>
    )
  }

  return (
    <Banner tone="green" icon={<PartyPopper className="h-5 w-5" aria-hidden="true" />}>
      <p className="font-display text-lg font-semibold text-tk-linen">
        You ran the whole system.
      </p>
      <p className="mt-1 text-sm text-tk-linen/75">
        Order created in a real WooCommerce store, two designed emails sent and clicked,
        attribution captured, eight fulfilment stages written to a portal you can log into, and
        the repeat-order loop closed. That&apos;s the pitch — you just did it instead of reading it.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/portal"
          className="inline-flex items-center gap-1.5 rounded-lg bg-tk-linen px-4 py-2 font-ui text-sm font-semibold text-tk-onyx transition hover:bg-white"
        >
          Open your order
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        <a
          href="https://www.tallkarol.com/services/systems-integration"
          className="inline-flex items-center gap-1.5 rounded-lg border border-tk-linen/25 px-4 py-2 font-ui text-sm font-semibold text-tk-linen transition hover:border-tk-linen/50"
        >
          Have one built for your store
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </Banner>
  )
}

function Banner({
  tone,
  icon,
  children,
}: {
  tone: "teal" | "green"
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      className={`flex items-start gap-4 rounded-2xl border p-5 ${
        tone === "green" ? "border-lh-green/40 bg-lh-green/10" : "border-tk-teal/45 bg-tk-teal/10"
      }`}
    >
      <span
        className={`mt-0.5 shrink-0 ${tone === "green" ? "text-lh-green" : "text-tk-linen"}`}
      >
        {icon}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------ lane detail */

const LANE_TITLES: Record<LaneKey, { title: string; blurb: string }> = {
  store: {
    title: "WooCommerce — woodemo.tallkarol.com",
    blurb: "A real order row in a real store's admin, created over the REST API.",
  },
  router: {
    title: "Event router",
    blurb:
      "Verifies signatures, dedups on an idempotency key, branches on event type, fans out to four lanes. Failures retry three times, then land in a dead-letter shelf.",
  },
  email: {
    title: "Email — Resend",
    blurb: "Designed HTML, links tagged with UTM parameters that route back through the tracker.",
  },
  sms: {
    title: "SMS — the delivery line",
    blurb:
      "Simulated for this demo: real A2P messaging needs a registered business identity, which a fictional furniture company can't have. The wiring is real; the gateway sits behind a flag.",
  },
  crm: {
    title: "Harbor & Pine CRM",
    blurb:
      "Contact upserted on email, order stages appended to the timeline, tags and staff tasks written as the journey moves.",
  },
  portal: {
    title: "Customer portal",
    blurb: "The page a customer refreshes instead of emailing support. Your order is in it now.",
  },
  analytics: {
    title: "Insights — in-house analytics",
    blurb:
      "Every event above, captured in-process. No third-party tag, no sampling, no next-day lag — which is why the numbers move while you watch.",
  },
}

function LaneDetail({
  lane,
  events,
  run,
  onClose,
}: {
  lane: LaneKey | null
  events: JourneyEvent[]
  run: RunPayload["run"]
  onClose: () => void
}) {
  if (!lane) {
    return (
      <p className="rounded-xl border border-dashed border-tk-linen/15 px-4 py-6 text-center text-sm text-tk-linen/45">
        Tap any box in the diagram to see exactly what it did.
      </p>
    )
  }

  const meta = LANE_TITLES[lane]
  const laneEvents = events.filter((e) => e.lane === lane)

  return (
    <section className="rounded-2xl border border-tk-linen/15 bg-tk-linen/[0.04] p-5">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-tk-linen">{meta.title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-tk-linen/65">{meta.blurb}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md px-2 py-1 font-ui text-xs text-tk-linen/60 transition hover:bg-tk-linen/10 hover:text-tk-linen"
        >
          Close
        </button>
      </header>

      {lane === "portal" && (
        <div className="mb-4 rounded-lg border border-tk-linen/15 bg-black/25 p-4">
          <p className="font-mono text-xs text-tk-linen/80">
            {run.email} <span className="px-1 text-tk-linen/50">/</span> demo
          </p>
          <Link
            href="/portal"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-tk-linen px-4 py-2 font-ui text-sm font-semibold text-tk-onyx transition hover:bg-white"
          >
            Open your order
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}

      {laneEvents.length === 0 ? (
        <p className="text-sm text-tk-linen/45">Nothing here yet — this lane fires later.</p>
      ) : lane === "sms" ? (
        <ul className="space-y-2">
          {laneEvents.map((e) => (
            <li
              key={e.id}
              className="max-w-lg rounded-2xl rounded-tl-sm bg-tk-linen/10 px-3.5 py-2 text-sm leading-relaxed text-tk-linen/85"
            >
              {String(e.detail?.body ?? "")}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-1.5">
          {laneEvents
            .slice()
            .reverse()
            .map((e) => (
              <li key={e.id} className="flex gap-2.5 text-sm text-tk-linen/80">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-tk-teal/70"
                />
                <span className="min-w-0">
                  <span className="font-mono text-xs text-tk-teal">{e.type}</span>
                  {e.detail && Object.keys(e.detail).length > 0 && (
                    <span className="ml-2 text-tk-linen/65">{summarize(e)}</span>
                  )}
                </span>
              </li>
            ))}
        </ul>
      )}
    </section>
  )
}

function summarize(event: JourneyEvent) {
  const d = event.detail ?? {}
  if (typeof d.body === "string") return d.body
  if (typeof d.subject === "string") return d.subject
  if (typeof d.entry === "string") return d.entry
  if (typeof d.task === "string") return d.task
  if (Array.isArray(d.tags)) return (d.tags as string[]).join(", ")
  if (typeof d.wooOrderId === "number") return `order #${d.wooOrderId}`
  if (typeof d.error === "string") return d.error
  if (typeof d.contact === "string") return d.contact
  if (typeof d.label === "string") return d.label
  if (typeof d.note === "string") return d.note
  if (typeof d.coupon === "string") return d.coupon
  if (typeof d.campaign === "string") return d.campaign
  if (typeof d.status === "string") return `status: ${d.status}`
  return ""
}
