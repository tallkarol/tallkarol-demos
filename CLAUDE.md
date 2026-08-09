# Tall Karol demos — rules for Claude

Two working demo applications, linked from tallkarol.com as proof of the
"Web Apps & Custom Tools" service. Deployed separately from the marketing site
(`demos.tallkarol.com`), so the rules here are **not** the rules in `dev/`.

## What this is

One fictional company, **Harbor & Pine** (mid-century-modern audiophile
furniture on WooCommerce), and two apps over one shared dataset. Catalogue,
materials, and palette come from `~/Work/harbor-pine/harbor_pine_brand.md` —
the same sheet driving the real WooCommerce store, so keep them in step:

- `/analytics` — the merchant's internal reporting layer. The reporting
  WooCommerce doesn't ship: campaigns, orders, products, customers, with GA4
  and Google Ads metrics beside store revenue.
- `/portal` — the customer's order tracker. Furniture is bought once and then
  waited on for two months; this is where the buyer watches theirs get built,
  inspected, freighted, and delivered.

They share `data/store.json` on purpose: a number in the dashboard and a number
in a customer's order are the same number.

## Non-negotiables

- **Read-only, always.** Every capability in `lib/auth.ts` is a read. The demo
  credentials are published on tallkarol.com, so nothing a visitor clicks may
  change what the next visitor sees. Don't add a write path, a form that
  persists, or a destructive action — the permission model deliberately has no
  destructive verbs to grant.
- **No real data, ever.** Every customer, order, product, address, and campaign
  is invented. No client of Tall Karol appears here.
- **Data is generated, then committed.** `node scripts/generate-data.mjs`
  rewrites `data/store.json` from a seeded PRNG. Same seed → byte-identical
  output, so a screenshot never disagrees with the app. Edit the generator, not
  the JSON.
- **Server/client boundary.** Pages are server components; charts and tables are
  client components. Functions and component references can't cross that
  boundary — that's why charts take a `FormatKey` (`lib/format.ts`) instead of a
  format callback, and why `AppNav` takes icon *names* instead of icons.

## Performance & SEO

Unlike the marketing site, these are **behind a login and not indexed**
(`robots: { index: false }` in `app/layout.tsx`). There is no Lighthouse
contract and no First Load JS budget here. Animation is a feature, not a
liability — but keep it a *layer* over working UI:

- Motion is anime.js (`animate`, `stagger`, `svg.createDrawable`). Ambient,
  always-on effects stay in CSS (`app/globals.css`).
- Anything animated in starts hidden via `[data-anim]` and is only ever moved
  *towards* visible, so a JS failure can't leave content invisible — the
  `.no-js` and `prefers-reduced-motion` fallbacks in `globals.css` restore it.
- Every animation must have a reduced-motion path that lands on the final state.

## Charts

`lib/chart-theme.ts` holds a **validated** categorical palette — lightness band,
chroma floor, CVD separation, normal-vision separation, and contrast vs surface
all pass on a white surface. Rules that follow from that:

- Four categorical hues, fixed per entity. A fifth series folds into `OTHER`
  (grey); never cycle the ramp, and never let a filter recolour survivors.
- The green↔copper pair sits at the deutan floor, so any chart using both needs
  secondary encoding — direct labels, which `BarRows` already does.
- **One axis per chart.** Two measures of different scale get two charts. That's
  why sessions and revenue are separate plots on the overview.
- Re-validate before changing any colour:
  `node scripts/validate_palette.js "<hex,…>" --mode light` from the dataviz
  skill.

## Workflow

- `npm run dev` (port 3100) and `npm run build` share `.next/`. Building while
  the dev server runs breaks it with `Cannot find module './vendor-chunks/…'` —
  build with `NEXT_DIST_DIR=.next-verify npx next build` instead, or restart dev
  after.
- `npm run typecheck` before committing.
- Brand tokens are per-demo CSS vars in `lib/brands.ts`, applied on each app
  shell's root. Components read `var(--brand)`, `var(--surface)`, `var(--line)`
  — never hardcode a brand colour in a component.

## Deploy

Vercel project, root directory `demos/`, custom domain `demos.tallkarol.com`.
No environment variables and no external services — the CSP in `next.config.js`
blocks every third-party origin, and nothing here fetches one.

When both demos are live, flip `DEMOS_LIVE` in the marketing site's
`components/sections/AppProof.tsx` so the homepage CTAs become real links.
