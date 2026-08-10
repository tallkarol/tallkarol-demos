"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Contact2,
  Inbox,
  MessageSquare,
  Store,
} from "lucide-react"
import type { Order } from "@/lib/store"

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
  events: {
    id: number
    type: string
    lane: string | null
    detail: Record<string, unknown> | null
    utm: Record<string, string> | null
    created_at: string | Date
  }[]
}

const POLL_MS = 2500

/**
 * The live run page: the wiring diagram, running. Each lane panel renders its
 * slice of the event ledger; the ledger itself scrolls at the bottom like a
 * tail -f. Polling advances the journey server-side, so keeping this page
 * open IS what makes time pass.
 */
export function JourneyLive({ initial }: { initial: RunPayload }) {
  const [data, setData] = useState<RunPayload>(initial)

  const loopClosed = useMemo(
    () => data.events.some((e) => e.type === "loop.closed"),
    [data.events]
  )

  useEffect(() => {
    if (data.run.status === "complete" && loopClosed) return
    const id = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/journey/state/${data.run.id}`, { cache: "no-store" })
        if (res.ok) setData((await res.json()) as RunPayload)
      } catch {
        /* next tick retries */
      }
    }, POLL_MS)
    return () => window.clearInterval(id)
  }, [data.run.id, data.run.status, loopClosed])

  const { run, events } = data
  const lane = (name: string) => events.filter((e) => e.lane === name)
  const stageTotal = run.order.timeline.length

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------ header */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="font-mono text-sm text-tk-linen/60">{run.orderNumber}</p>
          <span
            className={`rounded-full px-3 py-1 font-ui text-xs font-semibold ${
              run.status === "complete"
                ? "bg-lh-green/15 text-lh-green"
                : run.status === "active"
                  ? "bg-tk-teal/20 text-tk-linen"
                  : "bg-tk-linen/10 text-tk-linen/80"
            }`}
          >
            {run.status === "awaiting_click"
              ? "Waiting on your inbox"
              : run.status === "active"
                ? `Live — ${run.order.status}`
                : loopClosed
                  ? "Complete — loop closed"
                  : "Delivered"}
          </span>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-tk-linen sm:text-4xl">
          {run.order.item.name}
        </h1>

        {/* stage segments */}
        <div className="flex max-w-xl gap-1" aria-hidden="true">
          {run.order.timeline.map((step, index) => (
            <div
              key={step.key}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-700 ${
                index <= run.stageIndex ? "bg-tk-teal" : "bg-tk-linen/15"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-tk-linen/70">
          Stage <span className="nums font-semibold text-tk-linen">{run.stageIndex + 1}</span> of{" "}
          {stageTotal} — {run.order.status}. Eight weeks of made-to-order furniture,
          compressed to about a minute per stage, while you watch.
        </p>
      </header>

      {run.status === "awaiting_click" && (
        <div className="flex items-start gap-3 rounded-xl border border-tk-teal/40 bg-tk-teal/10 p-4">
          <Inbox className="mt-0.5 h-5 w-5 shrink-0 text-tk-linen" aria-hidden="true" />
          <div className="text-sm text-tk-linen/85">
            <p className="font-semibold text-tk-linen">
              Check <span className="font-mono">{run.email}</span> — nothing moves until you click.
            </p>
            <p className="mt-1 text-tk-linen/65">
              The first email doubles as verification. No click, no more email — that&apos;s the
              anti-spam design, visible from the inside. (Look in spam if it&apos;s shy.)
            </p>
          </div>
        </div>
      )}

      {loopClosed && (
        <div className="flex items-start gap-3 rounded-xl border border-lh-green/40 bg-lh-green/10 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lh-green" aria-hidden="true" />
          <p className="text-sm text-tk-linen/85">
            <span className="font-semibold text-tk-linen">Loop closed.</span> coupon.redeemed →
            order.created — the green wire on the diagram, and you just ran it with a real click.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------- lanes */}
      <div className="grid gap-4 lg:grid-cols-2">
        <LanePanel icon={<Inbox className="h-4 w-4" aria-hidden="true" />} title="Email — Resend">
          {lane("email").length === 0 && <Empty>First send fires the moment the run starts.</Empty>}
          <ul className="space-y-2">
            {lane("email").map((e) => (
              <li key={e.id} className="text-sm text-tk-linen/80">
                {e.type === "email.sent" && (
                  <>
                    <span className="text-tk-teal">sent</span>{" "}
                    {String(e.detail?.subject ?? e.detail?.template ?? "email")}
                  </>
                )}
                {e.type === "email.link.clicked" && (
                  <>
                    <span className="text-lh-green">clicked</span> — verified, UTM captured{" "}
                    <span className="font-mono text-xs text-tk-linen/55">
                      {e.utm?.utm_campaign}
                    </span>
                  </>
                )}
                {e.type === "coupon.redeemed" && (
                  <>
                    <span className="text-lh-green">coupon</span> PINE10 redeemed
                  </>
                )}
                {e.type === "email.error" && (
                  <span className="text-red-300">send failed — {String(e.detail?.error ?? "")}</span>
                )}
              </li>
            ))}
          </ul>
        </LanePanel>

        <LanePanel
          icon={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
          title="SMS — delivery line"
          note="simulated — a real gateway sits behind a flag"
        >
          {lane("sms").length === 0 && <Empty>Texts start when freight is booked.</Empty>}
          <ul className="space-y-2">
            {lane("sms").map((e) => (
              <li
                key={e.id}
                className="max-w-[95%] rounded-2xl rounded-tl-sm bg-tk-linen/10 px-3.5 py-2 text-sm leading-relaxed text-tk-linen/85"
              >
                {String(e.detail?.body ?? "")}
              </li>
            ))}
          </ul>
        </LanePanel>

        <LanePanel
          icon={<Contact2 className="h-4 w-4" aria-hidden="true" />}
          title="Harbor & Pine CRM"
        >
          {lane("crm").length === 0 && <Empty>Contact upserts on verification.</Empty>}
          <ul className="space-y-1.5">
            {lane("crm").map((e) => (
              <li key={e.id} className="flex gap-2 text-sm text-tk-linen/80">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-tk-teal/70" />
                <span>
                  {e.type === "crm.contact.upserted" && `Contact upserted — ${String(e.detail?.contact ?? "")}`}
                  {e.type === "crm.timeline.appended" && String(e.detail?.entry ?? "")}
                  {e.type === "crm.task.created" && `Task: ${String(e.detail?.task ?? "")}`}
                  {e.type === "crm.tag.applied" && `Tags: ${(e.detail?.tags as string[] | undefined)?.join(", ")}`}
                </span>
              </li>
            ))}
          </ul>
        </LanePanel>

        <LanePanel icon={<Store className="h-4 w-4" aria-hidden="true" />} title="WooCommerce — woodemo">
          {lane("store").length === 0 && <Empty>The order lands in wp-admin as the run starts.</Empty>}
          <ul className="space-y-1.5">
            {lane("store").map((e) => (
              <li key={e.id} className="text-sm text-tk-linen/80">
                {e.type === "woo.order.created" && (
                  <>
                    Order <span className="font-mono text-xs">#{String(e.detail?.wooOrderId)}</span>{" "}
                    created — a real row in the store&apos;s admin
                  </>
                )}
                {e.type === "woo.status.updated" && `Status → ${String(e.detail?.status)}`}
                {e.type === "woo.webhook.received" && (
                  <span className="text-tk-teal">
                    webhook back — signature verified, the system hears itself
                  </span>
                )}
                {e.type === "woo.error" && (
                  <span className="text-red-300">Woo unavailable — journey continues without it</span>
                )}
              </li>
            ))}
          </ul>
        </LanePanel>

        <LanePanel
          icon={<ArrowUpRight className="h-4 w-4" aria-hidden="true" />}
          title="Customer portal"
        >
          <p className="text-sm text-tk-linen/80">
            Your order is live in the portal — the page you&apos;d refresh instead of emailing
            support.
          </p>
          <p className="mt-3 font-mono text-xs text-tk-linen/70">
            {run.email} <span className="px-1 text-tk-linen/50">/</span> demo
          </p>
          <Link
            href="/portal"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-tk-linen px-4 py-2 font-ui text-sm font-semibold text-tk-onyx transition hover:bg-white"
          >
            Open your order
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </LanePanel>

        <LanePanel icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />} title="Analytics — in-house">
          <p className="text-sm text-tk-linen/80">
            <span className="nums font-display text-2xl font-semibold text-tk-linen">
              {events.length}
            </span>{" "}
            events on this run&apos;s ledger — attribution captured in-process, no third-party
            tag, no lag.
          </p>
          {lane("analytics").some((e) => e.type === "analytics.attributed") && (
            <p className="mt-2 text-xs text-tk-linen/60">
              Attributed: <span className="font-mono">journey_welcome</span> — the UTM on the link
              you clicked.
            </p>
          )}
        </LanePanel>
      </div>

      {/* ------------------------------------------------------ ledger */}
      <section className="rounded-xl border border-tk-linen/15 bg-black/30">
        <h2 className="border-b border-tk-linen/10 px-4 py-2.5 font-ui text-xs font-semibold uppercase tracking-[0.14em] text-tk-linen/60">
          Event ledger — tail -f
        </h2>
        <ol className="max-h-72 overflow-y-auto px-4 py-3 font-mono text-xs leading-6 text-tk-linen/75">
          {events
            .slice()
            .reverse()
            .map((e) => (
              <li key={e.id} className="truncate">
                {/* Server-rendered initial props carry Dates; polled JSON
                    carries strings — normalize through Date either way. */}
                <span className="text-tk-linen/50">
                  {new Date(e.created_at).toISOString().slice(11, 19)}
                </span>{" "}
                <span className="text-tk-teal">{(e.lane ?? "-").padEnd(9, " ")}</span> {e.type}
              </li>
            ))}
        </ol>
      </section>
    </div>
  )
}

function LanePanel({
  icon,
  title,
  note,
  children,
}: {
  icon: React.ReactNode
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-tk-linen/15 bg-tk-linen/[0.05] p-5">
      <header className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-tk-teal/20 text-tk-linen">
          {icon}
        </span>
        <h2 className="font-display text-sm font-semibold text-tk-linen">{title}</h2>
        {note && <span className="ml-auto text-[10px] uppercase tracking-wider text-tk-linen/50">{note}</span>}
      </header>
      {children}
    </section>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-tk-linen/50">{children}</p>
}
