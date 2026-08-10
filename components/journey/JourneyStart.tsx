"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { ArrowRight, Loader2 } from "lucide-react"

type StartProduct = {
  sku: string
  name: string
  price: number
  image: string
  category: string
}

const currency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)

/**
 * The journey's front door. One email, one product, one button — everything
 * else the machine does. The invisible `company` field and the render
 * timestamp are the anti-bot layer (see /api/journey/start).
 */
export function JourneyStart({ products }: { products: StartProduct[] }) {
  const router = useRouter()
  const renderedAt = useRef(Date.now())
  const [sku, setSku] = useState(products[0]?.sku ?? "")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/journey/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, sku, company, t: renderedAt.current }),
      })
      const data = (await res.json()) as { ok?: boolean; id?: string; error?: string }
      if (!res.ok || !data.id) {
        setError(data.error ?? "Something broke — try again.")
        setBusy(false)
        return
      }
      router.push(`/journey/${data.id}`)
    } catch {
      setError("Network hiccup — try again.")
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <fieldset>
        <legend className="mb-4 font-ui text-sm font-semibold text-tk-linen/80">
          1 · Pick your piece
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product) => {
            const active = product.sku === sku
            return (
              <button
                key={product.sku}
                type="button"
                onClick={() => setSku(product.sku)}
                aria-pressed={active}
                className={`group flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-tk-teal bg-tk-linen text-tk-onyx"
                    : "border-tk-linen/20 bg-tk-linen/[0.05] text-tk-linen hover:border-tk-linen/45"
                }`}
              >
                <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-white">
                  <Image
                    src={product.image}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-contain p-1"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-sm font-semibold leading-snug">
                    {product.name}
                  </span>
                  <span className={`block text-xs ${active ? "text-tk-slate/70" : "text-tk-linen/55"}`}>
                    {product.category} · {currency(product.price)}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="max-w-md space-y-4">
        <legend className="mb-1 font-ui text-sm font-semibold text-tk-linen/80">
          2 · Where do we send the order emails?
        </legend>

        <div>
          <label htmlFor="j-email" className="mb-1.5 block font-ui text-xs text-tk-linen/60">
            Email — the journey happens in your inbox
          </label>
          <input
            id="j-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-11 w-full rounded-lg border border-tk-linen/25 bg-tk-linen/[0.06] px-3 font-mono text-sm text-tk-linen outline-none transition placeholder:text-tk-linen/50 focus:border-tk-teal"
          />
        </div>

        <div>
          <label htmlFor="j-name" className="mb-1.5 block font-ui text-xs text-tk-linen/60">
            First name <span className="text-tk-linen/50">(optional — the emails greet you)</span>
          </label>
          <input
            id="j-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Karol"
            maxLength={40}
            className="h-11 w-full rounded-lg border border-tk-linen/25 bg-tk-linen/[0.06] px-3 text-sm text-tk-linen outline-none transition placeholder:text-tk-linen/50 focus:border-tk-teal"
          />
        </div>

        {/* Honeypot — humans never see it, autofill bots fill it. */}
        <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="j-company">Company</label>
          <input
            id="j-company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="max-w-md rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !email}
        className="inline-flex h-12 items-center gap-2 rounded-lg bg-tk-teal px-6 font-ui text-sm font-semibold text-tk-linen transition hover:brightness-110 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        )}
        {busy ? "Wiring it up…" : "Place the fake order — start the real machine"}
      </button>
    </form>
  )
}
