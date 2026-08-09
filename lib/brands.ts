import type { CSSProperties } from "react"
import type { DemoKey } from "@/lib/auth"

/**
 * One fictional company, two apps.
 *
 * Harbor & Freight sells made-to-order furniture on WooCommerce. `analytics`
 * is the staff-facing reporting layer; `portal` is what the customer who
 * bought a sofa logs into to watch it get built and delivered. Same brand,
 * two audiences — so the shells deliberately don't look alike: the internal
 * tool is cool and dense, the customer portal is warm and roomy.
 *
 * The vars land on each app shell's root element; everything inside reads them
 * (see globals.css).
 */
export type Brand = {
  key: DemoKey
  company: string
  product: string
  tagline: string
  accent: string
  vars: CSSProperties
}

export const COMPANY = "Harbor & Freight"

export const BRANDS: Record<DemoKey, Brand> = {
  analytics: {
    key: "analytics",
    company: COMPANY,
    product: "Insights",
    tagline: "Made-to-order furniture · WooCommerce",
    accent: "#13293D",
    vars: {
      "--brand": "#13293D",
      "--brand-ink": "#FFFFFF",
      "--brand-soft": "rgb(19 41 61 / 0.07)",
      "--accent": "#B4652F",
      "--canvas": "#F5F6F7",
      "--surface": "#FFFFFF",
      "--line": "#E2E5E8",
    } as CSSProperties,
  },
  portal: {
    key: "portal",
    company: COMPANY,
    product: "My orders",
    tagline: "Track your order, every step",
    // Deep copper rather than the accent copper: #B4652F is only 3.9:1 on
    // white, which fails for button labels. This step clears 4.5:1.
    accent: "#8F4E22",
    vars: {
      "--brand": "#8F4E22",
      "--brand-ink": "#FFFFFF",
      "--brand-soft": "rgb(143 78 34 / 0.08)",
      "--accent": "#13293D",
      "--canvas": "#FAF6F0",
      "--surface": "#FFFFFF",
      "--line": "#E8DFD4",
    } as CSSProperties,
  },
}
