"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { animate, svg } from "animejs"
import { INK, niceMax } from "@/lib/chart-theme"
import { formatValue, type FormatKey } from "@/lib/format"
import { shortDate } from "@/lib/utils"

export type TrendPoint = { date: string; value: number }

type AreaTrendProps = {
  points: TrendPoint[]
  color: string
  /** Names the single series, so no legend box is needed. */
  label: string
  format: FormatKey
  height?: number
}

const W = 760
const PAD = { top: 14, right: 12, bottom: 26, left: 52 }

/**
 * Single-series area + line with a crosshair tooltip.
 *
 * One series on one axis — never a second y-scale bolted on; a second measure
 * gets its own chart. The line draws in with anime.js (`svg.createDrawable`)
 * and the fill fades under it, so the shape is read as it arrives rather than
 * appearing all at once.
 */
export function AreaTrend({ points, color, label, format, height = 240 }: AreaTrendProps) {
  const H = height
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const lineRef = useRef<SVGPathElement>(null)
  const areaRef = useRef<SVGPathElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const gradientId = useMemo(
    () => `area-${label.replace(/\W+/g, "-").toLowerCase()}`,
    [label]
  )

  const { max, coords, linePath, areaPath, ticks } = useMemo(() => {
    const max = niceMax(Math.max(...points.map((p) => p.value)))
    const x = (i: number) => PAD.left + (i / Math.max(1, points.length - 1)) * innerW
    const y = (v: number) => PAD.top + innerH - (v / max) * innerH

    const coords = points.map((p, i) => ({ x: x(i), y: y(p.value), ...p }))
    const linePath = coords
      .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
      .join(" ")
    const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(2)} ${(
      PAD.top + innerH
    ).toFixed(2)} L${coords[0].x.toFixed(2)} ${(PAD.top + innerH).toFixed(2)} Z`

    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      value: max * t,
      y: PAD.top + innerH - t * innerH,
    }))

    return { max, coords, linePath, areaPath, ticks }
  }, [points, innerH, innerW])

  useEffect(() => {
    const line = lineRef.current
    const area = areaRef.current
    if (!line || !area) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      line.style.opacity = "1"
      area.style.opacity = "1"
      return
    }

    line.style.opacity = "1"
    animate(svg.createDrawable(line), {
      draw: ["0 0", "0 1"],
      duration: 1100,
      ease: "outQuart",
    })
    animate(area, { opacity: [0, 1], duration: 900, delay: 260, ease: "outQuad" })
  }, [linePath])

  const active = hover != null ? coords[hover] : null

  return (
    <figure className="relative m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={`${label} over ${points.length} days`}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const ratio = (event.clientX - rect.left) / rect.width
          const px = ratio * W
          const index = Math.round(((px - PAD.left) / innerW) * (points.length - 1))
          setHover(Math.min(points.length - 1, Math.max(0, index)))
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Recessive grid — present enough to read a value off, quiet enough
            that the data is what you see first. */}
        {ticks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={tick.y}
              y2={tick.y}
              stroke={INK.grid}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={PAD.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="11"
              fill={INK.muted}
              className="nums"
            >
              {formatValue(format, tick.value)}
            </text>
          </g>
        ))}

        <path ref={areaRef} d={areaPath} fill={`url(#${gradientId})`} opacity="0" />
        <path
          ref={lineRef}
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          opacity="0"
        />

        {active && (
          <g>
            <line
              x1={active.x}
              x2={active.x}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke={INK.axis}
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            {/* 2px surface ring so the marker stays legible over the fill. */}
            <circle cx={active.x} cy={active.y} r="5.5" fill="#fff" />
            <circle cx={active.x} cy={active.y} r="4" fill={color} />
          </g>
        )}

        {[0, Math.floor(points.length / 2), points.length - 1].map((i) => (
          <text
            key={i}
            x={coords[i].x}
            y={H - 8}
            textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
            fontSize="11"
            fill={INK.muted}
          >
            {shortDate(points[i].date)}
          </text>
        ))}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-lg border border-[var(--line)] bg-white px-3 py-2 shadow-lg"
          style={{ left: `${(active.x / W) * 100}%` }}
        >
          <p className="text-[11px] text-app-ink/55">{shortDate(active.date)}</p>
          <p className="nums font-display text-sm font-semibold text-app-ink">
            {formatValue(format, active.value)}
          </p>
          <p className="text-[11px] text-app-ink/55">{label}</p>
        </div>
      )}
    </figure>
  )
}
