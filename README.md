# Tall Karol — live demos

Two working applications, built to be logged into. They're the proof behind the
"Web Apps & Custom Tools" service on [tallkarol.com](https://www.tallkarol.com).

One fictional company — **Harbor & Freight**, made-to-order furniture running
WooCommerce — and two apps over one shared dataset.

| | What it is | Who logs in |
|---|---|---|
| `/analytics` | Store analytics suite — campaigns, orders, products, customers, with GA4 and Google Ads metrics beside store revenue | Staff |
| `/portal` | Customer order tracking — every stage from the workshop floor to the doorstep | Customers |

## Demo accounts

Password is `demo` for all three. Every account is **read-only**.

| Email | App | Sees |
|---|---|---|
| `admin-demo@tallkarol.com` | both | Owner in analytics (margin, ad spend); staff in the portal (all orders + activity trail) |
| `analyst-demo@tallkarol.com` | analytics | Same reports, cost and margin columns removed |
| `customer-demo@tallkarol.com` | portal | One customer's own orders, nothing else |

## Running it

```bash
npm install
npm run dev      # http://localhost:3100
```

```bash
npm run build
npm run typecheck
```

Regenerate the sample data (seeded, so output is deterministic):

```bash
node scripts/generate-data.mjs
```

## Notes

Everything is invented. No real customer, order, product, address, or client of
Tall Karol appears anywhere in this repo. There is no database and no external
API — the whole dataset is one committed JSON file, and no code path writes to
it.

Stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind, anime.js. Charts
are hand-rolled SVG against a colour-validated palette; there's no charting
dependency.
