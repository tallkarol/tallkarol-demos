import { store, type Product } from "@/lib/store"

/**
 * The four pieces a visitor can "order" on the journey page — the flagship of
 * each family, pulled from the same seeded catalogue the analytics demo
 * reports on, so a journey order always names a product that exists
 * everywhere else in the system.
 *
 * Woo lookup happens by SKU at order time (the woodemo store is built from
 * the same brand sheet); if a SKU isn't found there, the order is created
 * with a fee line instead so the journey never dies on catalogue drift.
 */
const JOURNEY_SKUS = ["HP-MAR-601", "HP-GAL-301", "HP-TAI-201", "HP-MOD-403"] as const

export type JourneyProduct = Product

export function journeyProducts(): JourneyProduct[] {
  return JOURNEY_SKUS.map((sku) => {
    const product = store.products.find((p) => p.sku === sku)
    if (!product) throw new Error(`journey product missing from catalogue: ${sku}`)
    return product
  })
}

export function journeyProduct(sku: string): JourneyProduct | null {
  if (!(JOURNEY_SKUS as readonly string[]).includes(sku)) return null
  return store.products.find((p) => p.sku === sku) ?? null
}
