import type { Config } from "tailwindcss"

/**
 * Brand tokens are copied verbatim from the tallkarol.com repo (dev/) — these
 * demos are shown as Tall Karol work, so they wear the same palette and type
 * scale. The colour values were solved for WCAG AA there; don't lighten them
 * here either. See dev/CLAUDE.md for the audit notes.
 *
 * `app-*` tokens are additions that only exist in this repo: the demo apps are
 * dense product UIs (tables, sidebars, charts) and need surface/hairline steps
 * the marketing site never did.
 */
const config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "tk-teal": "#006965",
        "tk-linen": "#F1EADC",
        "tk-slate": "#1F2C2B",
        "tk-onyx": "#0F1615",

        // Product-UI surfaces. The marketing site is linen-on-white; app
        // chrome needs a colder, quieter ground so data reads as the content.
        "app-canvas": "#F7F6F3",
        "app-surface": "#FFFFFF",
        "app-line": "#E3E0D8",
        "app-ink": "#1F2C2B",

        // Status. Green/amber/red are UI state only — never a chart series,
        // and never a text colour without checking contrast on its own chip.
        "st-good": "#137333",
        "st-warn": "#8A5A00",
        "st-bad": "#B72A0F",
      },
      fontFamily: {
        display: ["var(--font-inter-tight)", "sans-serif"],
        ui: ["var(--font-plus-jakarta)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        "tk-eyebrow": [
          "0.75rem",
          { lineHeight: "1rem", fontWeight: "600", letterSpacing: "0.22em" },
        ],
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
