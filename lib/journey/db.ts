import { neon } from "@neondatabase/serverless"

/**
 * One Neon HTTP client for the journey tables. HTTP (not websocket pooling)
 * on purpose: every caller is a short-lived serverless route, and Neon's
 * fetch-based driver is the zero-connection-management fit for that.
 *
 * Lazy so that builds without DATABASE_URL (or routes that never touch the
 * journey) don't crash at import time.
 */
let client: ReturnType<typeof neon> | null = null

export function sql() {
  if (!client) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL is not set")
    client = neon(url)
  }
  return client
}
