"use client"

import { useEffect, useMemo, useRef } from "react"
import { animate, svg } from "animejs"

/**
 * Shape-only trend for a stat tile — no axes, no labels, no tooltip. It answers
 * "which way and how steadily", and the number above it answers "how much".
 */
export function Sparkline({
  values,
  color,
  width = 120,
  height = 34,
}: {
  values: number[]
  color: string
  width?: number
  height?: number
}) {
  const ref = useRef<SVGPathElement>(null)

  const d = useMemo(() => {
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = max - min || 1
    return values
      .map((v, i) => {
        const x = (i / Math.max(1, values.length - 1)) * width
        const y = height - 2 - ((v - min) / span) * (height - 4)
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(" ")
  }, [values, width, height])

  useEffect(() => {
    const path = ref.current
    if (!path) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      path.style.opacity = "1"
      return
    }
    path.style.opacity = "1"
    animate(svg.createDrawable(path), { draw: ["0 0", "0 1"], duration: 900, ease: "outQuart" })
  }, [d])

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <path
        ref={ref}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity="0"
      />
    </svg>
  )
}
