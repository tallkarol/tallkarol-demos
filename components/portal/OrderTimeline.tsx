"use client"

import { useEffect, useRef } from "react"
import { animate, stagger } from "animejs"
import { Check } from "lucide-react"
import type { TimelineStep } from "@/lib/store"
import { longDate } from "@/lib/utils"
import { cn } from "@/lib/utils"

/**
 * The order's whole story as one vertical ladder.
 *
 * This is the thing the portal exists for: furniture is bought once and then
 * waited on for two months, and every "where is my order?" email is a step
 * this screen already knows about. So each stage carries a plain-English line,
 * completed stages carry the timestamp they actually happened, and upcoming
 * stages carry the date they're expected — an empty future is what makes
 * people call.
 *
 * The connector fills from the top as the completed stages animate in, so the
 * progress reads as travelled distance rather than a static list of ticks.
 */
export function OrderTimeline({ steps }: { steps: TimelineStep[] }) {
  const rootRef = useRef<HTMLOListElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)

  const currentIndex = steps.findIndex((step) => step.state === "current")
  const progress =
    currentIndex < 0 ? 1 : currentIndex / Math.max(1, steps.length - 1)

  useEffect(() => {
    const root = rootRef.current
    const fill = fillRef.current
    if (!root || !fill) return

    const rows = root.querySelectorAll<HTMLElement>("[data-step]")
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reduced) {
      rows.forEach((row) => {
        row.style.opacity = "1"
        row.style.transform = "none"
      })
      fill.style.transform = `scaleY(${progress})`
      return
    }

    animate(rows, {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 460,
      delay: stagger(85),
      ease: "outExpo",
    })

    animate(fill, {
      scaleY: [0, progress],
      duration: 240 + steps.length * 85,
      ease: "outQuad",
    })
  }, [progress, steps.length])

  return (
    <ol ref={rootRef} className="relative pl-1">
      {/* Rail sits behind the dots; the fill is the travelled portion. */}
      <div
        aria-hidden
        className="absolute bottom-4 left-[13px] top-4 w-px"
        style={{ background: "var(--line)" }}
      >
        <div
          ref={fillRef}
          className="h-full w-full origin-top"
          style={{ background: "var(--brand)", transform: "scaleY(0)" }}
        />
      </div>

      {steps.map((step) => {
        const done = step.state === "complete"
        const current = step.state === "current"
        return (
          <li
            key={step.key}
            data-step
            className="relative flex gap-4 pb-6 last:pb-0"
            style={{ opacity: 0 }}
          >
            <span className="relative z-10 mt-0.5 grid h-[27px] w-[27px] shrink-0 place-items-center">
              <span
                className={cn(
                  "grid h-[19px] w-[19px] place-items-center rounded-full ring-4",
                  done || current ? "ring-[var(--surface)]" : "ring-[var(--surface)]"
                )}
                style={{
                  background: done || current ? "var(--brand)" : "var(--line)",
                }}
              >
                {done && <Check className="h-3 w-3 text-white" aria-hidden="true" />}
                {current && (
                  <span
                    className="pulse-ring relative h-2 w-2 rounded-full bg-white"
                    aria-hidden="true"
                  />
                )}
              </span>
            </span>

            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "font-ui text-sm",
                  done || current ? "font-semibold text-app-ink" : "text-app-ink/50"
                )}
              >
                {step.label}
                {current && (
                  <span
                    className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                  >
                    Now
                  </span>
                )}
              </p>

              <p
                className={cn(
                  "mt-0.5 text-sm",
                  done || current ? "text-app-ink/70" : "text-app-ink/40"
                )}
              >
                {step.blurb}
              </p>

              <p className="mt-1 text-xs text-app-ink/50">
                {step.at ? (
                  longDate(step.at.slice(0, 10))
                ) : (
                  <>Expected {longDate(step.expectedOn!)}</>
                )}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
