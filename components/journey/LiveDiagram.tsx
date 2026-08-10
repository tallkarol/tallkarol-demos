"use client"

import { useEffect, useRef } from "react"
import { animate, svg, utils } from "animejs"

/**
 * The wiring diagram from tallkarol.com — running.
 *
 * Same geometry, same nodes, same wires as the static blueprint on the
 * marketing site (components/demos/JourneyDiagram.tsx over there), re-skinned
 * for a dark control-room surface and wired to the run's event ledger: a lane
 * that has fired lights up and carries a looping packet, the newest lane
 * pulses, and the coupon loop turns green when it closes.
 *
 * The SVG itself is aria-hidden. Real HTML buttons are absolutely positioned
 * over each node (percentages derived from the viewBox), so selecting a lane
 * is keyboard-operable and focus-visible without fighting SVG focus quirks.
 */

const W = 1240
const H = 740

const LINEN = "#F1EADC"
const TEAL = "#2FA39C" // lifted from tk-teal for legibility on onyx
const GREEN = "#0CCE6B"

export type LaneKey = "store" | "router" | "email" | "sms" | "crm" | "portal" | "analytics"

type NodeSpec = {
  lane: LaneKey
  label: string
  sub: string
  x: number
  y: number
  w: number
  h: number
}

const NODES: NodeSpec[] = [
  { lane: "store", label: "Storefront", sub: "WooCommerce", x: 36, y: 330, w: 160, h: 124 },
  { lane: "router", label: "Event router", sub: "verify · dedup · fan out", x: 300, y: 310, w: 172, h: 164 },
  { lane: "email", label: "Email", sub: "Resend", x: 552, y: 56, w: 312, h: 128 },
  { lane: "sms", label: "SMS", sub: "delivery line", x: 552, y: 232, w: 312, h: 158 },
  { lane: "crm", label: "CRM", sub: "Harbor & Pine", x: 552, y: 408, w: 312, h: 158 },
  { lane: "portal", label: "Customer portal", sub: "their order, live", x: 552, y: 584, w: 312, h: 118 },
  { lane: "analytics", label: "Insights", sub: "in-house analytics", x: 962, y: 598, w: 242, h: 104 },
]

/** Wire per lane — the path a packet travels when that lane fires. */
const WIRES: { lane: LaneKey; id: string; d: string }[] = [
  { lane: "store", id: "w-store", d: "M196 392 H 293" },
  { lane: "email", id: "w-email", d: "M472 342 H 512 V 120 H 545" },
  { lane: "sms", id: "w-sms", d: "M472 376 H 500 V 311 H 545" },
  { lane: "crm", id: "w-crm", d: "M472 410 H 532 V 487 H 545" },
  { lane: "portal", id: "w-portal", d: "M472 444 H 496 V 643 H 545" },
  { lane: "analytics", id: "w-analytics", d: "M864 311 H 924 V 650 H 955" },
]

const LOOP_D = "M868 88 H 1204 V 26 H 116 V 322"

const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, Math.max(0, max - 1))}…` : text

const pctX = (v: number) => `${(v / W) * 100}%`
const pctY = (v: number) => `${(v / H) * 100}%`

export function LiveDiagram({
  counts,
  recent,
  selected,
  onSelect,
  loopClosed,
  newestLane,
}: {
  counts: Record<LaneKey, number>
  /** Up to two most recent human-readable lines per lane — the node's feed. */
  recent: Record<LaneKey, string[]>
  selected: LaneKey | null
  onSelect: (lane: LaneKey) => void
  loopClosed: boolean
  newestLane: LaneKey | null
}) {
  const rootRef = useRef<SVGSVGElement>(null)
  const running = useRef<Set<string>>(new Set())

  /* Packets: one looping traveller per lane that has carried at least one
     event. Started once per lane and left running — the ambient motion IS the
     "this is live" signal. */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    WIRES.forEach((wire, index) => {
      if (counts[wire.lane] < 1 || running.current.has(wire.id)) return
      const packet = root.querySelector<SVGCircleElement>(`#packet-${wire.lane}`)
      const path = root.querySelector<SVGPathElement>(`#${wire.id}`)
      if (!packet || !path) return

      running.current.add(wire.id)
      packet.style.opacity = "1"
      const motion = svg.createMotionPath(path)
      animate(packet, {
        translateX: motion.translateX,
        translateY: motion.translateY,
        duration: 2400,
        delay: index * 260,
        loop: true,
        ease: "linear",
      })
    })
  }, [counts])

  /* A new event in a lane flashes that lane's frame — the eye is drawn to
     where the system just did something. */
  useEffect(() => {
    const root = rootRef.current
    if (!root || !newestLane) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const frame = root.querySelector<SVGRectElement>(`#frame-${newestLane}`)
    if (!frame) return
    utils.set(frame, { strokeWidth: 1.2 })
    animate(frame, {
      strokeWidth: [2.6, 1.2],
      opacity: [1, 0.85],
      duration: 900,
      ease: "outQuad",
    })
  }, [newestLane, counts])

  return (
    <div className="relative w-full min-w-[720px]">
      <svg
        ref={rootRef}
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        aria-hidden="true"
      >
        <defs>
          <pattern id="j-dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.1" fill={LINEN} opacity="0.06" />
          </pattern>
          <filter id="j-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={W} height={H} fill="url(#j-dots)" />

        {/* ------------------------------------------------ the coupon loop */}
        <path
          d={LOOP_D}
          fill="none"
          stroke={loopClosed ? GREEN : LINEN}
          strokeOpacity={loopClosed ? 0.75 : 0.12}
          strokeWidth={loopClosed ? 1.8 : 1.2}
          strokeDasharray={loopClosed ? undefined : "5 5"}
          filter={loopClosed ? "url(#j-glow)" : undefined}
          style={{ transition: "stroke 600ms ease, stroke-opacity 600ms ease" }}
        />
        <text
          x={660}
          y={18}
          textAnchor="middle"
          fontSize="10"
          letterSpacing="0.06em"
          fill={loopClosed ? GREEN : LINEN}
          opacity={loopClosed ? 0.9 : 0.3}
          fontFamily="inherit"
          style={{ transition: "fill 600ms ease, opacity 600ms ease" }}
        >
          coupon.redeemed → order.created
        </text>

        {/* ------------------------------------------------------- the wires */}
        {WIRES.map((wire) => {
          const live = counts[wire.lane] > 0
          return (
            <path
              key={wire.id}
              id={wire.id}
              d={wire.d}
              fill="none"
              stroke={live ? TEAL : LINEN}
              strokeOpacity={live ? 0.55 : 0.14}
              strokeWidth="1.3"
              style={{ transition: "stroke 500ms ease, stroke-opacity 500ms ease" }}
            />
          )
        })}

        {/* feedback wire — the system hearing itself */}
        <path
          d="M708 184 V 214 H 486 V 303"
          fill="none"
          stroke={counts.email > 1 ? TEAL : LINEN}
          strokeOpacity={counts.email > 1 ? 0.4 : 0.1}
          strokeWidth="1.2"
          strokeDasharray="4 4"
          style={{ transition: "stroke 500ms ease, stroke-opacity 500ms ease" }}
        />

        {/* quiet-hours gate */}
        <g>
          <rect
            x={505}
            y={299}
            width={24}
            height={24}
            transform="rotate(45 517 311)"
            fill="#0F1615"
            stroke={counts.sms > 0 ? TEAL : LINEN}
            strokeOpacity={counts.sms > 0 ? 0.6 : 0.18}
            strokeWidth="1.2"
          />
          <text x={517} y={315} textAnchor="middle" fontSize="9" fill={LINEN} opacity="0.5" fontFamily="inherit">
            ?
          </text>
        </g>

        {/* ------------------------------------------------------- the nodes */}
        {NODES.map((node) => {
          const live = counts[node.lane] > 0
          const isSelected = selected === node.lane
          return (
            <g key={node.lane}>
              <rect
                id={`frame-${node.lane}`}
                x={node.x}
                y={node.y}
                width={node.w}
                height={node.h}
                rx="12"
                fill={live ? "rgba(47,163,156,0.10)" : "rgba(241,234,220,0.03)"}
                stroke={isSelected ? LINEN : live ? TEAL : LINEN}
                strokeOpacity={isSelected ? 0.9 : live ? 0.55 : 0.14}
                strokeWidth="1.2"
                style={{ transition: "fill 500ms ease, stroke 400ms ease, stroke-opacity 400ms ease" }}
              />
              <text
                x={node.x + 16}
                y={node.y + 26}
                fontSize="13"
                fontWeight="600"
                fill={LINEN}
                opacity={live ? 0.95 : 0.4}
                fontFamily="inherit"
                style={{ transition: "opacity 500ms ease" }}
              >
                {node.label}
              </text>
              <text
                x={node.x + 16}
                y={node.y + 44}
                fontSize="10.5"
                letterSpacing="0.05em"
                fill={live ? TEAL : LINEN}
                opacity={live ? 0.9 : 0.28}
                fontFamily="inherit"
                style={{ transition: "fill 500ms ease, opacity 500ms ease" }}
              >
                {node.sub}
              </text>

              {/* Live feed: what this box most recently did. Truncated to the
                  node's own width — SVG text doesn't wrap or ellipsize. */}
              {(recent[node.lane] ?? []).slice(0, node.h > 120 ? 2 : 1).map((line, i) => (
                <text
                  key={i}
                  x={node.x + 16}
                  y={node.y + 70 + i * 18}
                  fontSize="11"
                  fill={LINEN}
                  opacity={i === 0 ? 0.7 : 0.45}
                  fontFamily="inherit"
                >
                  {truncate(line, Math.floor((node.w - 34) / 5.6))}
                </text>
              ))}

              {/* event tally — the number climbing is the "it's working" tell */}
              {live && (
                <>
                  <rect
                    x={node.x + node.w - 46}
                    y={node.y + 12}
                    width="34"
                    height="20"
                    rx="10"
                    fill={TEAL}
                    fillOpacity="0.22"
                  />
                  <text
                    x={node.x + node.w - 29}
                    y={node.y + 26}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill={LINEN}
                    opacity="0.95"
                    fontFamily="inherit"
                  >
                    {counts[node.lane]}
                  </text>
                </>
              )}
            </g>
          )
        })}

        {/* packets ride last so they sit above the wires */}
        {WIRES.map((wire) => (
          <circle
            key={`packet-${wire.lane}`}
            id={`packet-${wire.lane}`}
            r="4.5"
            fill={TEAL}
            filter="url(#j-glow)"
            opacity="0"
          />
        ))}
      </svg>

      {/* Accessible controls, one per node, sitting exactly over it. */}
      {NODES.map((node) => (
        <button
          key={node.lane}
          type="button"
          onClick={() => onSelect(node.lane)}
          aria-pressed={selected === node.lane}
          className="absolute rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tk-linen"
          style={{
            left: pctX(node.x),
            top: pctY(node.y),
            width: pctX(node.w),
            height: pctY(node.h),
          }}
        >
          <span className="sr-only">
            {node.label} — {counts[node.lane]} events. Show detail.
          </span>
        </button>
      ))}
    </div>
  )
}
