"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { animate } from "animejs"
import {
  FileText,
  FlaskConical,
  LayoutDashboard,
  Megaphone,
  Package,
  ReceiptText,
  ScrollText,
  ShoppingCart,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Icons resolve here, inside the client boundary. A server component can't
 * hand a component reference to a client one — only serialisable props cross —
 * so the shell passes a name and this map turns it back into a component.
 */
const ICONS = {
  dashboard: LayoutDashboard,
  campaigns: Megaphone,
  orders: ShoppingCart,
  products: Package,
  customers: Users,
  results: FlaskConical,
  documents: FileText,
  invoices: ReceiptText,
  audit: ScrollText,
} as const

export type IconName = keyof typeof ICONS

export type NavItem = {
  href: string
  label: string
  icon: IconName
}

/**
 * Sidebar navigation with a single travelling highlight.
 *
 * The active pill is one absolutely-positioned element that anime.js moves
 * between items, rather than a background that blinks off one row and on
 * another — the eye tracks the move and knows where it came from.
 */
export function AppNav({
  items,
  orientation = "vertical",
}: {
  items: NavItem[]
  orientation?: "vertical" | "horizontal"
}) {
  const horizontal = orientation === "horizontal"
  const pathname = usePathname()
  const listRef = useRef<HTMLUListElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)

  const activeIndex = items.reduce((best, item, index) => {
    if (pathname === item.href) return index
    if (pathname.startsWith(`${item.href}/`) && item.href.split("/").length > 2) return index
    return best
  }, 0)

  useEffect(() => {
    const list = listRef.current
    const pill = pillRef.current
    if (!list || !pill) return

    const target = list.children[activeIndex] as HTMLElement | undefined
    if (!target) return

    const offset = horizontal ? target.offsetLeft : target.offsetTop
    const size = horizontal ? target.offsetWidth : target.offsetHeight
    const axis = horizontal ? "translateX" : "translateY"
    const dimension = horizontal ? "width" : "height"
    const first = pill.dataset.placed !== "true"
    pill.dataset.placed = "true"

    if (first || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      pill.style.transform = `${axis}(${offset}px)`
      pill.style[dimension] = `${size}px`
      pill.style.opacity = "1"
      return
    }

    animate(pill, {
      [axis]: offset,
      [dimension]: size,
      duration: 420,
      ease: "outExpo",
    })
  }, [activeIndex, items.length, horizontal])

  return (
    <nav aria-label="Sections" className="relative">
      <div
        ref={pillRef}
        aria-hidden
        className={cn(
          "pointer-events-none absolute rounded-lg opacity-0",
          horizontal ? "top-0" : "left-0 right-0"
        )}
        style={{ background: "var(--brand-soft)" }}
      />
      <ul
        ref={listRef}
        className={cn("relative", horizontal ? "flex gap-0.5" : "space-y-0.5")}
      >
        {items.map((item, index) => {
          const active = index === activeIndex
          const Icon = ICONS[item.icon]
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 font-ui text-sm transition-colors",
                  horizontal && "whitespace-nowrap",
                  active
                    ? "font-semibold text-[var(--brand)]"
                    : "text-app-ink/65 hover:text-app-ink"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
