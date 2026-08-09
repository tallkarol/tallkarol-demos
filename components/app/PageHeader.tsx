import type { ReactNode } from "react"

export function PageHeader({
  title,
  description,
  aside,
}: {
  title: string
  description?: string
  aside?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-app-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-app-ink/60">{description}</p>
        )}
      </div>
      {aside}
    </div>
  )
}

/** Small provenance chip — says which system a number actually came from. */
export function SourceChip({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-ui text-[11px] font-medium"
      style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
    >
      {children}
    </span>
  )
}
