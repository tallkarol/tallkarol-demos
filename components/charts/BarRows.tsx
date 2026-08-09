"use client"

import { useEffect, useRef, useState } from "react"
import { animate, stagger } from "animejs"
import { INK } from "@/lib/chart-theme"
import { formatValue, type FormatKey } from "@/lib/format"

export type BarRow = {
  key: string
  label: string
  value: number
  color: string
  /** Optional second line under the label (share, delta, source). */
  note?: string
}

/**
 * Horizontal magnitude bars, one per entity.
 *
 * Horizontal rather than vertical because the categories are words, not dates —
 * long labels get a full line instead of a rotated axis. Every bar is direct-
 * labelled with its value, which is also the secondary encoding the green↔copper
 * pair needs (see chart-theme.ts).
 */
export function BarRows({
  rows,
  format,
  max: maxOverride,
}: {
  rows: BarRow[]
  format: FormatKey
  max?: number
}) {
  const ref = useRef<HTMLUListElement>(null)
  const [hover, setHover] = useState<string | null>(null)
  const max = maxOverride ?? Math.max(...rows.map((r) => r.value))

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const bars = root.querySelectorAll<HTMLElement>("[data-bar]")
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      bars.forEach((bar) => {
        bar.style.transform = "scaleX(1)"
      })
      return
    }
    animate(bars, {
      scaleX: [0, 1],
      duration: 780,
      delay: stagger(70),
      ease: "outExpo",
    })
  }, [rows])

  return (
    <ul ref={ref} className="space-y-3">
      {rows.map((row) => (
        <li
          key={row.key}
          onPointerEnter={() => setHover(row.key)}
          onPointerLeave={() => setHover(null)}
          className="group"
        >
          <div className="flex items-baseline justify-between gap-4">
            <span className="flex items-center gap-2 text-sm text-app-ink">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                style={{ background: row.color }}
              />
              {row.label}
            </span>
            <span className="nums font-display text-sm font-semibold text-app-ink">
              {formatValue(format, row.value)}
            </span>
          </div>

          <div
            className="mt-1.5 h-2 w-full overflow-hidden rounded-full"
            style={{ background: INK.grid }}
          >
            <div
              data-bar
              className="h-full rounded-full transition-opacity"
              style={{
                width: `${Math.max(1, (row.value / max) * 100)}%`,
                background: row.color,
                transformOrigin: "left center",
                transform: "scaleX(0)",
                opacity: hover && hover !== row.key ? 0.45 : 1,
              }}
            />
          </div>

          {row.note && <p className="mt-1 text-xs text-app-ink/55">{row.note}</p>}
        </li>
      ))}
    </ul>
  )
}
