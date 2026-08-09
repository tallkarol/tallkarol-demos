import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import usersFile from "@/data/users.json"

/**
 * Auth for the demos — deliberately the smallest thing that can honestly show
 * a roles model. The user list is a JSON file, the session is a cookie holding
 * a user id, and nothing in the app writes anywhere. There is no database, no
 * password hashing, and no account recovery, because there are no accounts:
 * three fixed identities whose credentials are published on tallkarol.com.
 *
 * Every capability below is a *read*. That's the point — a demo anyone can log
 * into must not be able to destroy the thing the next visitor sees, so the
 * permission model has no destructive verbs to grant in the first place.
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
  // Harbor & Pine — store analytics
  owner: ["view:revenue", "view:margin", "view:adspend", "view:settings", "export"],
  analyst: ["view:revenue", "view:adspend"],
  // TraceWell Labs — client portal
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

const SESSION_COOKIE = "tk_demo_session"

const users = usersFile.users as StoredUser[]

/** Strips the password so a user object can safely cross into a client component. */
const publicUser = ({ password: _password, ...rest }: StoredUser): DemoUser => rest

export function findByEmail(email: string): StoredUser | null {
  const normalized = email.trim().toLowerCase()
  return users.find((u) => u.email.toLowerCase() === normalized) ?? null
}

/** Constant-time comparison isn't warranted here — the passwords are published. */
export function authenticate(email: string, password: string): DemoUser | null {
  const user = findByEmail(email)
  if (!user || user.password !== password.trim()) return null
  return publicUser(user)
}

export async function getSessionUser(): Promise<DemoUser | null> {
  const store = await cookies()
  const id = store.get(SESSION_COOKIE)?.value
  if (!id) return null
  const user = users.find((u) => u.id === id)
  return user ? publicUser(user) : null
}

export async function startSession(userId: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  })
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
