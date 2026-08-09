"use server"

import { redirect } from "next/navigation"
import { authenticate, endSession, startSession, type DemoKey } from "@/lib/auth"

export type LoginState = { error: string | null }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const demo = String(formData.get("demo") ?? "") as DemoKey

  const user = authenticate(email, password)
  if (!user) {
    return { error: "That email and password don't match a demo account." }
  }
  if (!user.access[demo]) {
    return {
      error: "That account is valid, but it doesn't have access to this app.",
    }
  }

  await startSession(user.id)
  // redirect() throws to unwind — it must sit outside any try/catch.
  redirect(`/${demo}`)
}

export async function logout(formData: FormData) {
  const demo = String(formData.get("demo") ?? "") as DemoKey
  await endSession()
  redirect(`/${demo}/login`)
}
