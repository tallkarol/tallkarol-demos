# Tall Karol demos — rules for Claude

Two working demo applications, linked from tallkarol.com as proof of the
"Web Apps & Custom Tools" service. Deployed separately from the marketing site
(`demos.tallkarol.com`), so the rules here are **not** the rules in `dev/`.

The index page also links out to a third demo that does not live in this repo:
the Harbor & Pine WooCommerce storefront at `woodemo.tallkarol.com` (WP Engine;
theme source in `~/Work/harbor-pine/theme/harbor-pine`). The index presents all
three as one story — the store, its back office, its customers' view.

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

- **The published accounts' world is read-only, always.** The three demo
  accounts in `data/users.json` see the immutable seeded dataset; nothing any
  visitor does may change what they show. The ONE sanctioned write path is the
  live journey (`lib/journey/`), and it writes only into the visitor's own
  namespaced run (journey_runs / journey_events in Neon) — a journey user sees
  exactly one order, their own, and the seeded world never changes. Don't add
  any other write path, and no destructive verbs anywhere.
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

## Live journey (`/journey`)

One fictional purchase runs the real machine: Woo REST order into woodemo,
Resend email (sender renders as `Harbor & Pine <RESEND_FROM_EMAIL>`), in-house
click tracking (`/api/t`), simulated SMS, CRM-shaped events, portal account
(their email / `demo`), eight stages on a compressed clock.

- **State**: Neon Postgres (`DATABASE_URL`). Schema in
  `scripts/journey-schema.sql`; apply with the node one-liner in git history or
  any SQL client. Events are append-only.
- **Advancement is lazy** — every read (`/api/journey/state`, the portal
  bridge) advances due stages; there is no per-minute cron. The daily Vercel
  cron (`vercel.json` → `/api/journey/gc`, `CRON_SECRET` auth) only deletes
  runs older than 7 days, Woo orders included — that's the privacy promise on
  the form.
- **Anti-abuse**: honeypot + min-time on the form; 3 runs/email/day,
  5/IP/day, 100/day global in `createRun`; first email doubles as
  verification (no click → nothing else ever sends); `verify_token` gates all
  event writes; run ids are unguessable capabilities.
- **Env**: RESEND_API_KEY, RESEND_FROM_EMAIL, WOO_BASE_URL, WOO_CONSUMER_KEY,
  WOO_CONSUMER_SECRET, WOO_WEBHOOK_SECRET are team-level SENSITIVE shared vars
  — values are unreadable by design; manage them by linking/unlinking the
  project in the dashboard, never by `vercel env pull` (they pull as empty).
  Woo/Resend failures degrade to `*.error` events; the journey keeps moving.
- The Woo webhook (order updated → `/api/journey/hook/woo`) verifies
  HMAC-SHA256; Woo's unsigned activation ping gets a 200.

## Deploy

Vercel project, root directory `demos/`, custom domain `demos.tallkarol.com`.
No environment variables and no external services — the CSP in `next.config.js`
blocks every third-party origin, and nothing here fetches one.

When both demos are live, flip `DEMOS_LIVE` in the marketing site's
`components/sections/AppProof.tsx` so the homepage CTAs become real links.
