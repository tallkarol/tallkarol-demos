/**
 * Minimal WooCommerce REST client for woodemo.tallkarol.com.
 *
 * Basic auth over HTTPS with the consumer key/secret — the standard Woo REST
 * auth for external apps. Every function is tolerant: a Woo hiccup degrades
 * the journey (an event notes the failure) rather than killing it, because
 * the demo's job is to keep moving while someone watches.
 */

type WooResult<T> = { ok: true; data: T } | { ok: false; error: string }

function wooConfigured() {
  return Boolean(
    process.env.WOO_BASE_URL && process.env.WOO_CONSUMER_KEY && process.env.WOO_CONSUMER_SECRET
  )
}

async function woo<T>(
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<WooResult<T>> {
  if (!wooConfigured()) return { ok: false, error: "woo env not configured" }

  const base = process.env.WOO_BASE_URL!.replace(/\/$/, "")
  const auth = Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_CONSUMER_SECRET}`
  ).toString("base64")

  try {
    const res = await fetch(`${base}/wp-json/wc/v3${path}`, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      // Woo on shared hosting can be slow; don't hang a serverless function.
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      const text = (await res.text()).slice(0, 300)
      return { ok: false, error: `woo ${res.status}: ${text}` }
    }
    return { ok: true, data: (await res.json()) as T }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "woo fetch failed" }
  }
}

type WooProduct = { id: number; name: string; sku: string }
type WooOrder = { id: number; number: string; status: string }

/**
 * Create the order. Looks the product up by SKU first; if woodemo's catalogue
 * doesn't carry that SKU (drift between the seeded data and the store), the
 * order still gets created with a named fee line for the same amount.
 */
export async function createWooOrder(opts: {
  runId: string
  email: string
  customerName: string
  sku: string
  productName: string
  price: number
}): Promise<WooResult<WooOrder>> {
  const bySku = await woo<WooProduct[]>(`/products?sku=${encodeURIComponent(opts.sku)}`)
  const productId = bySku.ok && bySku.data[0] ? bySku.data[0].id : null

  const [firstName, ...rest] = opts.customerName.split(" ")

  return woo<WooOrder>("/orders", {
    method: "POST",
    body: {
      status: "pending",
      billing: { email: opts.email, first_name: firstName, last_name: rest.join(" ") },
      ...(productId
        ? { line_items: [{ product_id: productId, quantity: 1 }] }
        : { fee_lines: [{ name: opts.productName, total: String(opts.price) }] }),
      customer_note: "Tall Karol live journey demo — simulated order, auto-deleted within 7 days.",
      meta_data: [{ key: "_tk_journey", value: opts.runId }],
    },
  })
}

export async function setWooOrderStatus(orderId: number, status: "processing" | "completed") {
  return woo<WooOrder>(`/orders/${orderId}`, { method: "PUT", body: { status } })
}

/** GC only — journey orders older than the retention window. */
export async function deleteWooOrder(orderId: number) {
  return woo<{ id: number }>(`/orders/${orderId}?force=true`, { method: "DELETE" })
}

export async function addWooOrderNote(orderId: number, note: string) {
  return woo<{ id: number }>(`/orders/${orderId}/notes`, {
    method: "POST",
    body: { note, customer_note: false },
  })
}
