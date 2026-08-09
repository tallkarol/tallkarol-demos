"use client"

import { useEffect, useState } from "react"
import NumberFlow from "@number-flow/react"
import { Lock, TrendingDown, TrendingUp } from "lucide-react"
import { Sparkline } from "@/components/charts/Sparkline"
import { STATUS } from "@/lib/chart-theme"

type StatTileProps = {
  label: string
  value: number
  /** NumberFlow's own format type — a narrowed Intl.NumberFormatOptions. */
  format: React.ComponentProps<typeof NumberFlow>["format"]
  delta?: number
  /** Higher is worse for things like refund rate or cost per conversion. */
  invertDelta?: boolean
  trend?: number[]
  color?: string
  /** Rendered instead of the number when the role can't see this metric. */
  locked?: boolean
  lockedNote?: string
}

/**
 * A hero number is a chart form in its own right — when the job is "one figure,
 * read instantly", a plot would only dilute it. The sparkline rides along to
 * answer direction without competing for the read.
 */
export function StatTile({
  label,
  value,
  format,
  delta,
  invertDelta = false,
  trend,
  color = "#1F6FB2",
  locked = false,
  lockedNote,
}: StatTileProps) {
  // Mount at zero, then set the real value so NumberFlow ticks up into it.
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (locked) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value)
      return
    }
    const id = window.setTimeout(() => setDisplay(value), 90)
    return () => window.clearTimeout(id)
  }, [value, locked])

  const good = delta == null ? null : invertDelta ? delta < 0 : delta > 0
  const Icon = (delta ?? 0) >= 0 ? TrendingUp : TrendingDown

  return (
    <div className="panel flex flex-col gap-3 p-4">
      <p className="font-ui text-xs font-medium text-app-ink/60">{label}</p>

      {locked ? (
        <div className="flex items-center gap-2 py-1">
          <Lock className="h-4 w-4 text-app-ink/35" aria-hidden="true" />
          <span className="text-sm text-app-ink/45">{lockedNote ?? "Hidden for your role"}</span>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-3">
          <NumberFlow
            value={display}
            format={format}
            className="nums font-display text-2xl font-semibold tracking-tight text-app-ink"
          />
          {trend && trend.length > 1 && <Sparkline values={trend} color={color} />}
        </div>
      )}

      {!locked && delta != null && (
        <p
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: good ? STATUS.good : STATUS.bad }}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="nums">
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)}%
          </span>
          <span className="text-app-ink/50">vs previous 30 days</span>
        </p>
      )}
    </div>
  )
}
