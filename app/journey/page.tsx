import { JourneyStart } from "@/components/journey/JourneyStart"
import { journeyProducts } from "@/lib/journey/products"

export const metadata = { title: "Live journey — Tall Karol demos" }

/**
 * The journey's landing: Tall Karol's lab surface (dark, like the demos
 * index), framing Harbor & Pine artifacts. The pitch is the mechanism —
 * a real order in a real store, a real email, real attribution — run on
 * invented merchandise.
 */
export default function JourneyPage() {
  const products = journeyProducts().map((p) => ({
    sku: p.sku,
    name: p.name,
    price: p.price,
    image: p.image,
    category: p.category,
  }))

  return (
    <main className="min-h-screen bg-tk-onyx text-tk-linen">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <p className="font-ui text-tk-eyebrow uppercase text-tk-linen/60">
          Tall Karol — live journey
        </p>
        <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Buy nothing.
          <br />
          Watch everything.
        </h1>
        <p className="mt-5 max-w-2xl text-tk-linen/70">
          Pick a piece, drop your email, and a real automation runs around your fake
          order: it lands in a real WooCommerce store, a designed email hits your
          inbox, your click gets attributed, a portal account exists for you, texts
          simulate the delivery line, and the CRM fills itself in. Eight weeks of
          made-to-order furniture, played in about ten minutes.
        </p>

        <div className="mt-12">
          <JourneyStart products={products} />
        </div>

        <p className="mt-14 max-w-2xl text-xs leading-relaxed text-tk-linen/45">
          No payment exists anywhere in this system and nothing ships — Harbor &amp;
          Pine is fictional. Your email is used only to run this demo: one message
          before you click, a handful after, nothing ever again, and the whole run
          (order included) is auto-deleted within 7 days. Limits: 3 runs per inbox
          per day.
        </p>
      </div>
    </main>
  )
}
