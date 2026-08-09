import Link from "next/link"
import { ArrowRight, BarChart3, PackageSearch } from "lucide-react"
import { Stagger } from "@/components/motion/Stagger"

const demos = [
  {
    href: "/analytics",
    kind: "Internal tool",
    product: "Harbor & Freight — Insights",
    subject: "Store analytics for a WooCommerce merchant",
    body: "The reporting layer WooCommerce doesn't ship. Orders, customers, and campaign performance organised around the numbers that get decided on — with GA4 and Google Ads sitting next to store revenue.",
    accent: "#13293D",
    glow: "rgba(19,41,61,0.18)",
    Icon: BarChart3,
    logins: [
      { email: "admin-demo@tallkarol.com", note: "Owner — sees margin, ad spend, exports" },
      { email: "analyst-demo@tallkarol.com", note: "Analyst — same data, costs hidden" },
    ],
  },
  {
    href: "/portal",
    kind: "Customer-facing",
    product: "Harbor & Freight — My orders",
    subject: "Customer order tracking for the same store",
    body: "Furniture is bought once and then waited on for two months. This is where the customer watches theirs get built, inspected, freighted, and delivered — so the 'where is my order?' email never gets sent.",
    accent: "#8F4E22",
    glow: "rgba(143,78,34,0.20)",
    Icon: PackageSearch,
    logins: [
      { email: "customer-demo@tallkarol.com", note: "Customer — sees only their own orders" },
      { email: "admin-demo@tallkarol.com", note: "Staff — all orders, plus the activity trail" },
    ],
  },
]

export default function DemoIndexPage() {
  return (
    <main className="min-h-screen bg-tk-onyx text-tk-linen">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <Stagger className="max-w-2xl" gap={70}>
          <p
            data-anim="fade"
            className="font-ui text-tk-eyebrow uppercase text-tk-linen/60"
          >
            Tall Karol — live demos
          </p>
          <h1
            data-anim="rise"
            className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl"
          >
            Two working applications.
            <br />
            Log in and use them.
          </h1>
          <p data-anim="rise" className="mt-5 text-tk-linen/70">
            Real screens, real interaction, invented data. Every account below is
            read-only — nothing you click can change what the next visitor sees.
            No signup, no email, no call.
          </p>
        </Stagger>

        <Stagger
          as="ul"
          className="mt-14 grid gap-6 lg:grid-cols-2"
          delay={220}
          gap={110}
        >
          {demos.map(({ Icon, ...demo }) => (
            <li key={demo.href} data-anim="rise">
              <Link
                href={demo.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-tk-linen/15 bg-tk-linen/[0.04] p-7 transition-colors hover:border-tk-linen/35 hover:bg-tk-linen/[0.07]"
              >
                {/* Soft brand wash so each demo reads as its own product. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: demo.glow, opacity: 0.65 }}
                />

                <div className="relative flex items-center gap-3">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-lg"
                    style={{ background: demo.accent }}
                  >
                    <Icon className="h-4 w-4 text-white" aria-hidden="true" />
                  </span>
                  <span className="font-ui text-tk-eyebrow uppercase text-tk-linen/60">
                    {demo.kind}
                  </span>
                </div>

                <h2 className="relative mt-5 font-display text-xl font-semibold tracking-tight">
                  {demo.product}
                </h2>
                <p className="relative mt-1 text-sm text-tk-linen/60">{demo.subject}</p>
                <p className="relative mt-4 text-sm leading-relaxed text-tk-linen/75">
                  {demo.body}
                </p>

                <dl className="relative mt-6 space-y-2 border-t border-tk-linen/15 pt-5">
                  {demo.logins.map((login) => (
                    <div key={login.email} className="flex flex-col gap-0.5">
                      <dt className="font-mono text-xs text-tk-linen">{login.email}</dt>
                      <dd className="text-xs text-tk-linen/55">{login.note}</dd>
                    </div>
                  ))}
                  <p className="pt-1 font-mono text-xs text-tk-linen/55">
                    password: demo
                  </p>
                </dl>

                <span className="relative mt-6 inline-flex items-center gap-1.5 font-ui text-sm font-semibold">
                  Open the demo
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          ))}
        </Stagger>

        <p className="mt-12 max-w-2xl text-xs leading-relaxed text-tk-linen/45">
          Harbor &amp; Freight is a fictional furniture company. Both demos run on
          one invented dataset — every customer, order, and product was made up
          for it. No client of Tall Karol appears here, and no real data of any
          kind is stored, transmitted, or displayed.
        </p>
      </div>
    </main>
  )
}
