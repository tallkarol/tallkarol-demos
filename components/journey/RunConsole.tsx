"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Check, ChevronRight, Clock, Loader2 } from "lucide-react"
import type { ConsoleRow, ConsoleStatus } from "@/lib/journey/console"

/**
 * The run console — the journey as a task list, the way a Zap run history
 * reads: every step, every wait, timestamps, and the detail behind each one
 * an accordion away.
 *
 * The waiting rows are the point. They're styled apart from the steps because
 * "parked on a human clicking an email" is the honest majority of an
 * automation's wall clock, and a demo that hides it is selling a lie.
 *
 * The step that's currently happening opens itself; anything the visitor
 * opens by hand stays open.
 */

const STATUS_RING: Record<ConsoleStatus, string> = {
  done: "border-lh-green/50 bg-lh-green/15 text-lh-green",
  running: "border-tk-teal bg-tk-teal/20 text-tk-linen",
  waiting: "border-amber-400/50 bg-amber-400/15 text-amber-300",
  pending: "border-tk-linen/15 bg-tk-linen/[0.04] text-tk-linen/35",
  error: "border-red-400/50 bg-red-400/15 text-red-300",
}

function StatusDot({ status }: { status: ConsoleStatus }) {
  return (
    <span
      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${STATUS_RING[status]}`}
      aria-hidden="true"
    >
      {status === "done" && <Check className="h-3 w-3" />}
      {status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === "waiting" && <Clock className="h-3 w-3" />}
      {status === "error" && <AlertTriangle className="h-3 w-3" />}
      {status === "pending" && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    </span>
  )
}

const clock = (iso: string) => new Date(iso).toISOString().slice(11, 19)

function elapsed(sinceIso: string, now: number) {
  const seconds = Math.max(0, Math.round((now - new Date(sinceIso).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

const STATUS_LABEL: Record<ConsoleStatus, string> = {
  done: "done",
  running: "running",
  waiting: "waiting",
  pending: "not started",
  error: "failed",
}

export function RunConsole({ rows }: { rows: ConsoleRow[] }) {
  const activeId = rows.find((r) => r.status === "running" || r.status === "waiting")?.id
  const [open, setOpen] = useState<Set<string>>(() => new Set(activeId ? [activeId] : []))
  const [now, setNow] = useState(() => Date.now())

  /* Follow the run: whatever is happening now opens itself. */
  useEffect(() => {
    if (!activeId) return
    setOpen((current) => (current.has(activeId) ? current : new Set(current).add(activeId)))
  }, [activeId])

  /* Only tick while something is actually waiting. */
  const hasWaiting = rows.some((r) => r.status === "waiting")
  useEffect(() => {
    if (!hasWaiting) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [hasWaiting])

  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const doneCount = rows.filter((r) => r.status === "done").length

  return (
    <aside className="rounded-2xl border border-tk-linen/15 bg-black/30">
      <header className="border-b border-tk-linen/10 px-4 py-3.5">
        <h2 className="font-ui text-xs font-semibold uppercase tracking-[0.14em] text-tk-linen/60">
          Run console
        </h2>
        <p className="mt-1 text-xs text-tk-linen/45">
          {doneCount} of {rows.length} steps complete — every action and every wait.
        </p>
      </header>

      <ol className="p-2">
        {rows.map((row, index) => {
          const isOpen = open.has(row.id)
          const isWait = row.kind === "wait"
          const live = row.status === "waiting" || row.status === "running"

          return (
            <li key={row.id} className="relative">
              {/* rail between rows */}
              {index < rows.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[22px] top-9 h-[calc(100%-1.75rem)] w-px ${
                    row.status === "done" ? "bg-lh-green/25" : "bg-tk-linen/10"
                  }`}
                />
              )}

              <button
                type="button"
                onClick={() => toggle(row.id)}
                aria-expanded={isOpen}
                className={`relative flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-tk-linen/[0.05] ${
                  isWait ? "my-0.5" : ""
                }`}
              >
                <StatusDot status={row.status} />

                <span className="min-w-0 flex-1">
                  <span
                    className={`block leading-snug ${
                      isWait
                        ? "font-ui text-[11px] font-semibold uppercase tracking-[0.1em]"
                        : "font-ui text-sm font-medium"
                    } ${
                      row.status === "pending"
                        ? "text-tk-linen/40"
                        : isWait && live
                          ? "text-amber-300"
                          : "text-tk-linen"
                    }`}
                  >
                    {row.title}
                  </span>

                  <span className="mt-0.5 flex items-center gap-2 text-[11px] text-tk-linen/45">
                    {row.at ? (
                      <span className="nums">{clock(row.at)}</span>
                    ) : row.status === "waiting" && row.since ? (
                      <span className="nums text-amber-300/80">
                        waiting {elapsed(row.since, now)}
                      </span>
                    ) : (
                      <span>{STATUS_LABEL[row.status]}</span>
                    )}
                  </span>
                </span>

                <ChevronRight
                  className={`mt-1 h-3.5 w-3.5 shrink-0 text-tk-linen/35 transition-transform ${
                    isOpen ? "rotate-90" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isOpen && (
                <div className="ml-[38px] mr-2 mb-2 space-y-3 rounded-lg border border-tk-linen/10 bg-tk-linen/[0.03] p-3">
                  <dl className="space-y-1.5">
                    {row.detail.map((d) => (
                      <div key={d.label} className="grid grid-cols-[5.5rem_1fr] gap-2">
                        <dt className="font-ui text-[10px] uppercase tracking-wider text-tk-linen/40">
                          {d.label}
                        </dt>
                        <dd className="min-w-0 break-words font-mono text-[11px] leading-relaxed text-tk-linen/75">
                          {d.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {row.substeps && (
                    <ol className="space-y-1 border-t border-tk-linen/10 pt-2.5">
                      {row.substeps.map((sub) => (
                        <li key={sub.label} className="flex items-start gap-2 text-[11px]">
                          <span
                            aria-hidden="true"
                            className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                              sub.state === "complete"
                                ? "bg-lh-green/70"
                                : sub.state === "current"
                                  ? "bg-tk-teal"
                                  : "bg-tk-linen/20"
                            }`}
                          />
                          <span className="min-w-0 flex-1">
                            <span
                              className={
                                sub.state === "upcoming" ? "text-tk-linen/35" : "text-tk-linen/80"
                              }
                            >
                              {sub.label}
                            </span>
                            {sub.state !== "upcoming" && (
                              <span className="block text-tk-linen/45">{sub.fired}</span>
                            )}
                          </span>
                          {sub.at && (
                            <span className="nums shrink-0 text-tk-linen/40">{clock(sub.at)}</span>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}

                  {row.note && (
                    <p className="border-t border-tk-linen/10 pt-2.5 text-[11px] leading-relaxed text-tk-linen/55">
                      {row.note}
                    </p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
