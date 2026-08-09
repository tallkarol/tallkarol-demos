"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { animate } from "animejs"
import { Loader2, LogIn } from "lucide-react"
import { login, type LoginState } from "@/app/actions"
import type { DemoKey } from "@/lib/auth"

export type DemoAccount = {
  email: string
  label: string
  hint: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] font-ui text-sm font-semibold text-[var(--brand-ink)] transition hover:brightness-110 disabled:opacity-70"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogIn className="h-4 w-4" aria-hidden="true" />
      )}
      {pending ? "Signing in…" : "Sign in"}
    </button>
  )
}

/**
 * Credentials are published, so the fastest path in is a one-click fill —
 * asking a visitor to hand-type a demo password is friction that costs logins.
 * The accounts list doubles as the roles explainer: picking one tells you what
 * you're about to see.
 */
export function LoginForm({
  demo,
  accounts,
}: {
  demo: DemoKey
  accounts: DemoAccount[]
}) {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {
    error: null,
  })
  const [email, setEmail] = useState(accounts[0]?.email ?? "")
  const [password, setPassword] = useState("demo")
  const formRef = useRef<HTMLFormElement>(null)

  // A failed sign-in should be felt, not just read.
  useEffect(() => {
    if (!state.error || !formRef.current) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    animate(formRef.current, {
      translateX: [0, -7, 6, -4, 3, 0],
      duration: 420,
      ease: "outQuad",
    })
  }, [state.error])

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <input type="hidden" name="demo" value={demo} />

      <div className="space-y-1.5">
        <label htmlFor="email" className="block font-ui text-xs font-semibold text-app-ink/70">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 w-full rounded-lg border border-[var(--line)] bg-white px-3 font-mono text-sm text-app-ink outline-none transition focus:border-[var(--brand)]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block font-ui text-xs font-semibold text-app-ink/70">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 w-full rounded-lg border border-[var(--line)] bg-white px-3 font-mono text-sm text-app-ink outline-none transition focus:border-[var(--brand)]"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-st-bad/10 px-3 py-2 text-sm text-st-bad">
          {state.error}
        </p>
      )}

      <SubmitButton />

      <div className="space-y-2 rounded-lg border border-dashed border-[var(--line)] p-3">
        <p className="font-ui text-[11px] font-semibold uppercase tracking-wider text-app-ink/50">
          Demo accounts — click to fill
        </p>
        {accounts.map((account) => {
          const active = account.email === email
          return (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email)
                setPassword("demo")
              }}
              className={`block w-full rounded-md px-2 py-1.5 text-left transition ${
                active ? "bg-[var(--brand-soft)]" : "hover:bg-black/[0.03]"
              }`}
            >
              <span className="block font-mono text-xs text-app-ink">{account.email}</span>
              <span className="block text-xs text-app-ink/60">
                <span className="font-semibold">{account.label}</span> — {account.hint}
              </span>
            </button>
          )
        })}
      </div>
    </form>
  )
}
