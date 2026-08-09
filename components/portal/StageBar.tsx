"use client"

import { useEffect, useRef } from "react"
import { animate, stagger } from "animejs"
import type { Order } from "@/lib/store"

/**
 * Compact progress for an order card — eight segments, one per fulfilment
 * stage, filled up to where the order actually is.
 *
 * Segments rather than a continuous bar because the stages are discrete and
 * countable: "5 of 8" is a thing a customer can hold in their head, where a
 * 62%-full bar is not.
 */
export function StageBar({ order }: { order: Order }) {
  const ref = useRef<HTMLDivElement>(null)
  const reached = order.stageIndex + 1
  const totalStages = order.timeline.length

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const filled = root.querySelectorAll<HTMLElement>("[data-filled='true']")
    if (!filled.length) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      filled.forEach((segment) => {
        segment.style.transform = "scaleX(1)"
      })
      return
    }

    animate(filled, {
      scaleX: [0, 1],
      duration: 320,
      delay: stagger(70, { start: 120 }),
      ease: "outQuad",
    })
  }, [reached])

  return (
    <div>
      <div ref={ref} className="flex gap-1" aria-hidden="true">
        {order.timeline.map((step, index) => {
          const filled = index < reached
          return (
            <div
              key={step.key}
              className="h-1.5 flex-1 overflow-hidden rounded-full"
              style={{ background: "var(--line)" }}
            >
              <div
                data-filled={filled}
                className="h-full w-full origin-left rounded-full"
                style={{
                  background: "var(--brand)",
                  transform: filled ? "scaleX(0)" : "scaleX(0)",
                }}
              />
            </div>
          )
        })}
      </div>

      <p className="mt-2 text-xs text-app-ink/60">
        Step <span className="nums font-semibold text-app-ink">{reached}</span> of{" "}
        <span className="nums">{totalStages}</span> — {order.status}
      </p>
    </div>
  )
}
