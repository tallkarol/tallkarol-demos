import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import usersFile from "@/data/users.json"
import { getRun, latestRunByEmail, type JourneyRun } from "@/lib/journey/runs"
import { initialsOf } from "@/lib/journey/ladder"

/**
 * Auth for the demos — deliberately the smallest thing that can honestly show
 * a roles model. Two kinds of identity:
 *
 *  - The three published demo accounts, from data/users.json. Their world is
 *    the immutable seeded dataset; nothing a visitor does ever changes what
 *    they see.
 *  - Journey users: anyone who starts a live journey. Email + password `demo`
 *    signs them into the portal scoped to exactly one order — their own run.
 *    Session cookie carries `jr:<run_id>`.
 *
 * Every capability in both worlds is a read. The journey WRITES live in the
 * journey tables and only ever into the visitor's own namespaced run — the
 * published accounts' world stays frozen.
 */

export type DemoKey = "analytics" | "portal"
export type Role = "owner" | "analyst" | "admin" | "customer"

export type Capability =
  | "view:revenue"
  | "view:margin"
  | "view:adspend"
  | "view:settings"
  | "export"
  | "view:all-clients"
  | "view:audit"
  | "view:own"

const CAPABILITIES: Record<Role, Capability[]> = {
  owner: ["view:revenue", "view:margin", "view:adspend", "view:settings", "export"],
  analyst: ["view:revenue", "view:adspend"],
  admin: ["view:all-clients", "view:audit", "export"],
  customer: ["view:own"],
}

export type DemoAccess = { role: Role; title: string }

export type DemoUser = {
  id: string
  email: string
  name: string
  initials: string
  customerId?: string
  access: Partial<Record<DemoKey, DemoAccess>>
}

type StoredUser = DemoUser & { password: string }

export const SESSION_COOKIE = "tk_demo_session"

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  }
}

const users = usersFile.users as StoredUser[]

/** Strips the password so a user object can safely cross into a client component. */
const publicUser = ({ password: _password, ...rest }: StoredUser): DemoUser => rest

function journeyUser(run: JourneyRun): DemoUser {
  const name = run.order_json.customerName
  return {
    id: `jr:${run.id}`,
    email: run.email,
    name,
    initials: initialsOf(name),
    customerId: `jr:${run.id}`,
    access: { portal: { role: "customer", title: "Customer" } },
  }
}

export function findByEmail(email: string): StoredUser | null {
  const normalized = email.trim().toLowerCase()
  return users.find((u) => u.email.toLowerCase() === normalized) ?? null
}

/**
 * Constant-time comparison isn't warranted here — the demo passwords are
 * published. Journey lookup only happens on a JSON miss, and only when the
 * password is the published one, so the DB never sees a credentials probe.
 */
export async function authenticate(email: string, password: string): Promise<DemoUser | null> {
  const user = findByEmail(email)
  if (user) return user.password === password.trim() ? publicUser(user) : null

  if (password.trim() === "demo") {
    try {
      const run = await latestRunByEmail(email)
      if (run) return journeyUser(run)
    } catch {
      // DB down → journey logins fail, seeded accounts keep working.
    }
  }
  return null
}

export async function getSessionUser(): Promise<DemoUser | null> {
  const store = await cookies()
  const value = store.get(SESSION_COOKIE)?.value
  if (!value) return null

  if (value.startsWith("jr:")) {
    try {
      const run = await getRun(value.slice(3))
      return run ? journeyUser(run) : null
    } catch {
      return null
    }
  }

  const user = users.find((u) => u.id === value)
  return user ? publicUser(user) : null
}

export async function startSession(userId: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, userId, sessionCookieOptions())
}

export async function endSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export function can(user: DemoUser, demo: DemoKey, capability: Capability) {
  const role = user.access[demo]?.role
  return role ? CAPABILITIES[role].includes(capability) : false
}

/**
 * Gate for a demo's authenticated area. Sends anyone without a session — or
 * with a session for the *other* demo — back to that demo's own login.
 */
export async function requireDemoUser(demo: DemoKey): Promise<DemoUser & { demoRole: DemoAccess }> {
  const user = await getSessionUser()
  const access = user?.access[demo]
  if (!user || !access) redirect(`/${demo}/login`)
  return { ...user, demoRole: access }
}
