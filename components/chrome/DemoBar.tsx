import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

/**
 * The one piece of Tall Karol chrome inside an otherwise client-branded app.
 *
 * It exists so a visitor is never confused about what they're looking at: the
 * product below is a fictional brand, the data is invented, and the studio
 * that built it is named at the top of every screen. Deliberately slim and
 * dark so it reads as browser chrome rather than part of the product UI.
 */
export function DemoBar({ demo }: { demo: "analytics" | "portal" }) {
  const other = demo === "analytics" ? "portal" : "analytics"
  const otherLabel = demo === "analytics" ? "Client portal demo" : "Store analytics demo"

  return (
    <div
      className="bg-tk-onyx text-tk-linen"
      /* Undo the app shell's font swap: this strip is Tall Karol's, not the
         fictional client's. */
      style={
        {
          "--font-display": "var(--font-tk-display)",
          "--font-ui": "var(--font-tk-ui)",
          "--font-body": "var(--font-tk-body)",
        } as React.CSSProperties
      }
    >
      <div className="mx-auto flex h-9 max-w-[1600px] items-center gap-3 px-4 text-xs sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-ui font-semibold hover:underline">
          <span className="grid h-4 w-4 place-items-center rounded-[3px] border border-tk-linen/60 text-[9px] leading-none">
            k
          </span>
          Tall Karol
        </Link>

        <span className="text-tk-linen/50" aria-hidden="true">
          /
        </span>

        <span className="text-tk-linen/70">Live demo — sample data, no real customers</span>

        <div className="ml-auto flex items-center gap-4">
          <Link href={`/${other}`} className="hidden text-tk-linen/70 hover:text-tk-linen hover:underline sm:inline">
            {otherLabel}
          </Link>
          <a
            href="https://www.tallkarol.com"
            className="inline-flex items-center gap-1 text-tk-linen/70 hover:text-tk-linen hover:underline"
          >
            tallkarol.com
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  )
}
