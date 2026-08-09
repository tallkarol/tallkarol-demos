/**
 * Number formatting as a *key* rather than a function.
 *
 * Charts are client components and the pages that use them are server
 * components — and a function can't cross that boundary. Passing a key the
 * chart resolves itself keeps the prop serialisable and keeps formatting
 * consistent between a tooltip, an axis, and a table cell.
 */
export type FormatKey =
  | "currency"
  | "currency2"
  | "compact"
  | "number"
  | "percent1"
  | "ratio"

const CURRENCY_0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const CURRENCY_2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const COMPACT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})

const NUMBER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })

export function formatValue(key: FormatKey, value: number): string {
  switch (key) {
    case "currency":
      return CURRENCY_0.format(value)
    case "currency2":
      return CURRENCY_2.format(value)
    case "compact":
      return COMPACT.format(value)
    case "percent1":
      return `${(value * 100).toFixed(1)}%`
    case "ratio":
      return value.toFixed(2)
    case "number":
    default:
      return NUMBER.format(value)
  }
}
