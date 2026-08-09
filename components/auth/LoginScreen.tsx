import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { LoginForm, type DemoAccount } from "@/components/auth/LoginForm"
import { Stagger } from "@/components/motion/Stagger"
import { BRANDS } from "@/lib/brands"
import type { DemoKey } from "@/lib/auth"

/**
 * Shared sign-in screen, themed per demo. The left panel is the fictional
 * product's marketing face; the right is the app. Splitting them means the
 * login itself already shows two visual registers before you're even inside.
 */
export function LoginScreen({
  demo,
  accounts,
  points,
}: {
  demo: DemoKey
  accounts: DemoAccount[]
  points: string[]
}) {
  const brand = BRANDS[demo]

  return (
    <div className="grid min-h-[calc(100vh-2.25rem)] lg:grid-cols-[1.05fr_1fr]" style={brand.vars}>
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-14"
        style={{ background: brand.accent }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full opacity-25 blur-3xl"
          style={{ background: "var(--accent)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-16 h-[26rem] w-[26rem] rounded-full opacity-20 blur-3xl"
          style={{ background: "#ffffff" }}
        />

        <Stagger className="relative" gap={80}>
          <p data-anim="fade" className="font-ui text-tk-eyebrow uppercase opacity-70">
            {brand.tagline}
          </p>
          <p
            data-anim="rise"
            className="mt-6 font-display text-3xl font-semibold tracking-tight xl:text-4xl"
          >
            {brand.company}
          </p>
          <p data-anim="rise" className="mt-2 font-ui text-lg opacity-80">
            {brand.product}
          </p>
        </Stagger>

        <Stagger as="ul" className="relative space-y-4" delay={260} gap={90}>
          {points.map((point) => (
            <li key={point} data-anim="rise" className="flex gap-3 text-sm opacity-90">
              <span
                aria-hidden
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: "var(--accent)" }}
              />
              {point}
            </li>
          ))}
        </Stagger>

        <p className="relative text-xs opacity-55">
          {brand.company} is a fictional company created for this demo. All data
          shown is invented.
        </p>
      </div>

      <div className="flex items-center justify-center bg-[var(--canvas)] px-6 py-14">
        <Stagger className="w-full max-w-sm" gap={60}>
          <div data-anim="rise" className="lg:hidden">
            <p className="font-display text-2xl font-semibold tracking-tight text-app-ink">
              {brand.company}
            </p>
            <p className="mt-1 text-sm text-app-ink/60">{brand.product}</p>
          </div>

          <div data-anim="rise" className="mt-6 lg:mt-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-app-ink">
              Sign in
            </h1>
            <p className="mt-1.5 text-sm text-app-ink/60">
              Use one of the demo accounts below — they&apos;re read-only.
            </p>
          </div>

          <div data-anim="rise" className="mt-7">
            <LoginForm demo={demo} accounts={accounts} />
          </div>

          <p data-anim="fade" className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-ui text-xs text-app-ink/55 hover:text-app-ink hover:underline"
            >
              <ArrowLeft className="h-3 w-3" aria-hidden="true" />
              Both Tall Karol demos
            </Link>
          </p>
        </Stagger>
      </div>
    </div>
  )
}
