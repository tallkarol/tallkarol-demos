import Link from "next/link"
import { ArrowRight, Armchair, BarChart3, PackageSearch } from "lucide-react"
import { Stagger } from "@/components/motion/Stagger"

const demos = [
  {
    href: "https://woodemo.tallkarol.com",
    external: true,
    kind: "Storefront",
    product: "Harbor & Pine — The store",
    subject: "The WooCommerce storefront the other two demos orbit",
    body: "The store itself: walnut, cane, and brass, commissioned in vanishingly small editions. Browse the collection, configure a piece, and put it in the cart. Checkout stays closed — the fiction never takes a card number.",
    accent: "#B8860B",
    glow: "rgba(184,134,11,0.22)",
    Icon: Armchair,
    access: "No login — the cart works, checkout is disabled.",
  },
  {
    href: "/analytics",
    kind: "Internal tool",
    product: "Harbor & Pine — Insights",
    subject: "Store analytics for the same WooCommerce merchant",
    body: "The reporting layer WooCommerce doesn't ship. Orders, customers, and campaign performance organised around the numbers that get decided on — with GA4 and Google Ads sitting next to store revenue.",
    accent: "#2E4A3D",
    glow: "rgba(46,74,61,0.20)",
    Icon: BarChart3,
    logins: [
      { email: "admin-demo@tallkarol.com", note: "Owner — sees margin, ad spend, exports" },
      { email: "analyst-demo@tallkarol.com", note: "Analyst — same data, costs hidden" },
    ],
  },
  {
    href: "/portal",
    kind: "Customer-facing",
    product: "Harbor & Pine — My orders",
    subject: "Customer order tracking for the same store",
    body: "Furniture is bought once and then waited on for two months. This is where the customer watches theirs get built, inspected, freighted, and delivered — so the 'where is my order?' email never gets sent.",
    accent: "#5D4037",
    glow: "rgba(93,64,55,0.22)",
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
        <Stagger className="flex max-w-2xl items-start gap-5 sm:gap-7" gap={70}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, no optimization pass needed */}
          <img
            data-anim="fade"
            src="/tallkarol-monogram-logo.svg"
            alt=""
            aria-hidden="true"
            width={47}
            height={64}
            className="h-12 w-auto shrink-0 sm:h-16"
          />
          <div>
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
              One fictional company.
              <br />
              Three working demos.
            </h1>
            <p data-anim="rise" className="mt-5 text-tk-linen/70">
              The store, its back office, and its customers&apos; view — real
              screens, real interaction, invented data. The storefront needs no
              login, and every app account is read-only, so nothing you click can
              change what the next visitor sees. No signup, no email, no call.
            </p>
          </div>
        </Stagger>

        <Stagger
          as="ul"
          className="mt-14 grid gap-6 lg:grid-cols-3"
          delay={220}
          gap={110}
        >
          {demos.map(({ Icon, ...demo }) => {
            const cardBody = (
              <>
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

                <dl className="relative mt-6 flex-1 space-y-2 border-t border-tk-linen/15 pt-5">
                  {demo.logins?.map((login) => (
                    <div key={login.email} className="flex flex-col gap-0.5">
                      <dt className="font-mono text-xs text-tk-linen">{login.email}</dt>
                      <dd className="text-xs text-tk-linen/55">{login.note}</dd>
                    </div>
                  ))}
                  {demo.logins ? (
                    <p className="pt-1 font-mono text-xs text-tk-linen/55">
                      password: demo
                    </p>
                  ) : (
                    <p className="font-mono text-xs text-tk-linen/55">{demo.access}</p>
                  )}
                </dl>

                <span className="relative mt-6 inline-flex items-center gap-1.5 font-ui text-sm font-semibold">
                  Open the demo
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </>
            )

            const cardClass =
              "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-tk-linen/15 bg-tk-linen/[0.04] p-7 transition-colors hover:border-tk-linen/35 hover:bg-tk-linen/[0.07]"

            return (
              <li key={demo.href} data-anim="rise">
                {demo.external ? (
                  <a href={demo.href} className={cardClass}>
                    {cardBody}
                  </a>
                ) : (
                  <Link href={demo.href} className={cardClass}>
                    {cardBody}
                  </Link>
                )}
              </li>
            )
          })}
        </Stagger>

        <p className="mt-12 max-w-2xl text-xs leading-relaxed text-tk-linen/45">
          Harbor &amp; Pine is a fictional mid-century-modern furniture company —
          one invented catalogue shared by the storefront and both apps. Every
          customer, order, and product was made up for it. No client of Tall
          Karol appears here, and no real data of any kind is stored,
          transmitted, or displayed.
        </p>
      </div>
    </main>
  )
}
