"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { animate, stagger } from "animejs"
import { ArrowUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export type Column<Row> = {
  key: string
  header: string
  align?: "left" | "right"
  width?: string
  /** Sort/search value. Omit to make the column non-sortable. */
  sortValue?: (row: Row) => string | number
  render: (row: Row) => ReactNode
}

/**
 * The table both demos lean on: sortable, filterable, and animated in on load
 * and on every re-sort.
 *
 * Re-animating on sort is the point — when rows reorder, a static repaint
 * leaves you re-reading the whole table to find where a row went. A short
 * staggered settle makes the reorder legible as a change rather than a jump.
 */
export function DataTable<Row>({
  columns,
  rows,
  getKey,
  searchable = true,
  searchPlaceholder = "Filter…",
  initialSort,
  empty = "Nothing matches that filter.",
  toolbar,
}: {
  columns: Column<Row>[]
  rows: Row[]
  getKey: (row: Row) => string
  searchable?: boolean
  searchPlaceholder?: string
  initialSort?: { key: string; direction: "asc" | "desc" }
  empty?: string
  toolbar?: ReactNode
}) {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState(initialSort ?? null)
  const bodyRef = useRef<HTMLTableSectionElement>(null)

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    let next = rows

    if (needle) {
      next = rows.filter((row) =>
        columns.some((column) => {
          const value = column.sortValue?.(row)
          return value != null && String(value).toLowerCase().includes(needle)
        })
      )
    }

    if (sort) {
      const column = columns.find((c) => c.key === sort.key)
      if (column?.sortValue) {
        next = [...next].sort((a, b) => {
          const av = column.sortValue!(a)
          const bv = column.sortValue!(b)
          const result =
            typeof av === "number" && typeof bv === "number"
              ? av - bv
              : String(av).localeCompare(String(bv))
          return sort.direction === "asc" ? result : -result
        })
      }
    }

    return next
  }, [rows, columns, query, sort])

  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    const trs = body.querySelectorAll<HTMLElement>("tr")
    if (!trs.length) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      trs.forEach((tr) => {
        tr.style.opacity = "1"
        tr.style.transform = "none"
      })
      return
    }
    animate(trs, {
      opacity: [0, 1],
      translateY: [6, 0],
      duration: 380,
      // Capped so a 48-row table doesn't take three seconds to settle.
      delay: stagger(14, { start: 0 }),
      ease: "outQuad",
    })
  }, [visible])

  return (
    <div className="panel overflow-hidden">
      {(searchable || toolbar) && (
        <div
          className="flex flex-wrap items-center gap-3 border-b px-4 py-3"
          style={{ borderColor: "var(--line)" }}
        >
          {searchable && (
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-app-ink/40"
                aria-hidden="true"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-8 w-full rounded-md border bg-transparent pl-8 pr-3 text-sm outline-none transition focus:border-[var(--brand)]"
                style={{ borderColor: "var(--line)" }}
              />
            </div>
          )}
          {toolbar}
          <span className="nums shrink-0 text-xs text-app-ink/50">
            {visible.length} of {rows.length}
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--line)" }}>
              {columns.map((column) => {
                const sortable = Boolean(column.sortValue)
                const active = sort?.key === column.key
                return (
                  <th
                    key={column.key}
                    scope="col"
                    style={{ width: column.width, borderColor: "var(--line)" }}
                    className={cn(
                      "px-4 py-2.5 font-ui text-xs font-semibold text-app-ink/60",
                      column.align === "right" ? "text-right" : "text-left"
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSort({
                            key: column.key,
                            direction:
                              active && sort?.direction === "desc" ? "asc" : "desc",
                          })
                        }
                        className={cn(
                          "inline-flex items-center gap-1 transition hover:text-app-ink",
                          column.align === "right" && "flex-row-reverse",
                          active && "text-[var(--brand)]"
                        )}
                      >
                        {column.header}
                        <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody ref={bodyRef}>
            {visible.map((row) => (
              <tr
                key={getKey(row)}
                className="border-b transition-colors last:border-0 hover:bg-[var(--brand-soft)]"
                style={{ borderColor: "var(--line)", opacity: 0 }}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-4 py-2.5 text-app-ink/85",
                      column.align === "right" && "text-right"
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {!visible.length && (
          <p className="px-4 py-10 text-center text-sm text-app-ink/50">{empty}</p>
        )}
      </div>
    </div>
  )
}
