export const ADMIN_SESSION_COOKIE = "admin_session"
const secret = () => process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "change-this-admin-secret"

async function sign(payload: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export async function createAdminSession(email: string) {
  const payload = btoa(JSON.stringify({ email, issuedAt: Date.now() })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return `${payload}.${await sign(payload)}`
}

export async function isValidAdminSession(value: string | undefined) {
  if (!value) return false
  const [payload, signature] = value.split(".")
  if (!payload || !signature) return false
  const expected = await sign(payload)
  return signature === expected
}
