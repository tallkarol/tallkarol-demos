/**
 * Chart palette for the analytics demo.
 *
 * These four hues were validated as a categorical set on a white surface —
 * lightness band, chroma floor, CVD separation, normal-vision separation, and
 * contrast vs surface all pass. Two consequences worth keeping in mind before
 * anyone edits them:
 *
 *  - The green↔copper pair sits at the deutan floor (ΔE 8.0), which is legal
 *    only with secondary encoding. Every chart using both must also carry a
 *    legend and direct labels — never colour alone.
 *  - There is no fifth hue. A fifth series folds into `OTHER` (neutral grey),
 *    because cycling the categorical ramp would repaint identity.
 *
 * Colour follows the entity, not its rank: `SERIES[channelKey]` is fixed, so a
 * filter that drops a channel never recolours the survivors.
 */

export const SERIES: Record<string, string> = {
  organic: "#1F6FB2",
  paid: "#B4652F",
  email: "#0E8F66",
  direct: "#7A4E9E",
  other: "#8A8F98",
}

export const OTHER = "#8A8F98"

/** Single-hue ramp for magnitude (heat cells, intensity fills). */
export const SEQUENTIAL = ["#E3EDF5", "#BFD6E8", "#8FB6D6", "#5B92C0", "#1F6FB2", "#13293D"]

export const STATUS = {
  good: "#137333",
  warn: "#8A5A00",
  bad: "#B72A0F",
} as const

export const INK = {
  primary: "#1F2C2B",
  secondary: "rgba(31,44,43,0.68)",
  muted: "rgba(31,44,43,0.48)",
  grid: "rgba(31,44,43,0.10)",
  axis: "rgba(31,44,43,0.22)",
} as const

/** Nice-ish upper bound so the y-axis lands on a readable number. */
export function niceMax(value: number) {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const steps = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]
  for (const step of steps) {
    const candidate = step * magnitude
    if (candidate >= value) return candidate
  }
  return 10 * magnitude
}
