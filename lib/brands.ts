import type { CSSProperties } from "react"
import type { DemoKey } from "@/lib/auth"

/**
 * One fictional company, two apps.
 *
 * Harbor & Pine sells mid-century-modern audiophile furniture on WooCommerce.
 * `analytics` is the staff-facing reporting layer; `portal` is what the
 * customer who ordered a Mariner Console logs into to watch it get built and
 * delivered. Same brand, two audiences — so the shells deliberately don't look
 * alike: the internal tool is cool and dense, the customer portal is warm and
 * roomy.
 *
 * Colours are the brand sheet's, unchanged: Forest Green #2e4a3d, Deep Walnut
 * #5d4037, Antique Brass #b8860b, Cane Neutral #d7ccc8. Brass is decorative
 * only — at 3.0:1 on white it can't carry text.
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
  /** Photo behind the login panel, under a scrim (see LoginScreen). */
  scene: string
  vars: CSSProperties
}

export const COMPANY = "Harbor & Pine"

export const BRANDS: Record<DemoKey, Brand> = {
  analytics: {
    key: "analytics",
    company: COMPANY,
    product: "Insights",
    tagline: "Mid-century modern audiophile furniture · WooCommerce",
    accent: "#2E4A3D",
    scene: "/scenes/analytics.jpg",
    vars: {
      "--brand": "#2E4A3D",
      "--brand-ink": "#FFFFFF",
      "--brand-soft": "rgb(46 74 61 / 0.08)",
      "--accent": "#B8860B",
      "--canvas": "#F4F5F3",
      "--surface": "#FFFFFF",
      "--line": "#E1E4DF",
    } as CSSProperties,
  },
  portal: {
    key: "portal",
    company: COMPANY,
    product: "My orders",
    tagline: "Track your order, every step",
    accent: "#5D4037",
    scene: "/scenes/portal.jpg",
    vars: {
      "--brand": "#5D4037",
      "--brand-ink": "#FFFFFF",
      "--brand-soft": "rgb(93 64 55 / 0.08)",
      "--accent": "#B8860B",
      // Cane Neutral, lifted — the warm ground the customer side sits on.
      "--canvas": "#FAF6F3",
      "--surface": "#FFFFFF",
      "--line": "#E4D9D3",
    } as CSSProperties,
  },
}
