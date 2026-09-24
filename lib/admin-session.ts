import { cookies } from "next/headers"

export const ADMIN_SESSION_COOKIE = "admin_session"
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!value) throw new Error("Thiếu ADMIN_SESSION_SECRET.")
  return value
}

function base64Url(value: string) {
  return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  return base64Url(btoa(String.fromCharCode(...new Uint8Array(signature))))
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function createAdminSession(email: string) {
  const payload = base64Url(btoa(JSON.stringify({ email, issuedAt: Date.now() })))
  return `${payload}.${await sign(payload)}`
}

export async function isValidAdminSession(value: string | undefined) {
  if (!value) return false
  const [payload, signature] = value.split(".")
  if (!payload || !signature) return false
  if (!safeEqual(signature, await sign(payload))) return false
  try {
    const { issuedAt } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
    return typeof issuedAt === "number" && Date.now() - issuedAt < ADMIN_SESSION_MAX_AGE_SECONDS * 1000
  } catch {
    return false
  }
}

export async function hasAdminSession() {
  return isValidAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value)
}
