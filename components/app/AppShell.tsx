import type { ReactNode } from "react"
import { LogOut } from "lucide-react"
import { DemoBar } from "@/components/chrome/DemoBar"
import { AppNav, type NavItem } from "@/components/app/AppNav"
import { logout } from "@/app/actions"
import { BRANDS } from "@/lib/brands"
import type { DemoAccess, DemoKey, DemoUser } from "@/lib/auth"

/**
 * Shared chrome for both demo apps: Tall Karol bar, product topbar, sidebar
 * nav, content column. Everything below the DemoBar reads the per-demo CSS
 * vars, so the same shell renders as two different products.
 */
export function AppShell({
  demo,
  user,
  access,
  nav,
  children,
}: {
  demo: DemoKey
  user: DemoUser
  access: DemoAccess
  nav: NavItem[]
  children: ReactNode
}) {
  const brand = BRANDS[demo]

  /* Re-pointing the three role vars here means every `font-display` /
     `font-ui` / `font-body` inside the app resolves to Harbor & Pine's
     typefaces without touching a single component. DemoBar undoes it for
     itself, so the Tall Karol strip keeps the studio's fonts. */
  const shellStyle = {
    ...brand.vars,
    "--font-display": "var(--font-hp-display)",
    "--font-ui": "var(--font-hp-body)",
    "--font-body": "var(--font-hp-body)",
  } as React.CSSProperties

  return (
    <div style={shellStyle} className="min-h-screen bg-[var(--canvas)]">
      <DemoBar demo={demo} />

      <header className="sticky top-0 z-30 border-b bg-[var(--surface)]" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-7 w-7 place-items-center rounded-md font-display text-xs font-bold text-[var(--brand-ink)]"
              style={{ background: "var(--brand)" }}
            >
              {brand.company
                .split(/[\s&]+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word[0])
                .join("")}
            </span>
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold text-app-ink">{brand.company}</p>
              <p className="text-[11px] text-app-ink/55">{brand.product}</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span
              className="hidden rounded-full px-2.5 py-1 font-ui text-[11px] font-semibold sm:inline"
              style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            >
              {access.title}
            </span>

            <div className="flex items-center gap-2">
              <span
                className="grid h-7 w-7 place-items-center rounded-full font-ui text-[11px] font-semibold text-white"
                style={{ background: "var(--brand)" }}
                aria-hidden="true"
              >
                {user.initials}
              </span>
              <span className="hidden text-sm text-app-ink md:inline">{user.name}</span>
            </div>

            <form action={logout}>
              <input type="hidden" name="demo" value={demo} />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 font-ui text-xs text-app-ink/60 transition hover:bg-black/[0.04] hover:text-app-ink"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-8 px-4 py-6 sm:px-6 lg:py-8">
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-20">
            <AppNav items={nav} />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {/* Below lg the sidebar becomes a scrolling strip rather than a
              drawer — one tap to switch section instead of two. */}
          <div className="-mx-4 mb-5 overflow-x-auto px-4 pb-1 lg:hidden">
            <AppNav items={nav} orientation="horizontal" />
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
