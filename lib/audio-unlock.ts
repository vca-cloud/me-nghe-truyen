import { createHmac, timingSafeEqual } from "node:crypto"

export const AUDIO_UNLOCK_COOKIE = "mnt_unlock"
export const AUDIO_UNLOCK_TTL_MS = 6 * 60 * 60 * 1000
const MAX_STORIES = 30

type UnlockMap = Record<string, number>

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!value) throw new Error("Thiếu secret để ký cookie mở khóa.")
  return value
}

const sign = (payload: string) => createHmac("sha256", `audio-unlock|${secret()}`).update(payload).digest("base64url")

export function readUnlocks(value: string | undefined): UnlockMap {
  if (!value) return {}
  const [payload, signature] = value.split(".")
  if (!payload || !signature) return {}
  const expected = Buffer.from(sign(payload))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return {}
  try {
    const map = JSON.parse(Buffer.from(payload, "base64url").toString()) as UnlockMap
    const now = Date.now()
    return Object.fromEntries(Object.entries(map).filter(([, exp]) => typeof exp === "number" && exp > now))
  } catch {
    return {}
  }
}

export function isUnlocked(value: string | undefined, storyId: number) {
  return Boolean(readUnlocks(value)[String(storyId)])
}

// Thêm truyện vào cookie mở khóa (giữ tối đa MAX_STORIES truyện gần nhất).
export function addUnlock(value: string | undefined, storyId: number) {
  const map = readUnlocks(value)
  map[String(storyId)] = Date.now() + AUDIO_UNLOCK_TTL_MS
  const kept = Object.fromEntries(Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, MAX_STORIES))
  const payload = Buffer.from(JSON.stringify(kept)).toString("base64url")
  return `${payload}.${sign(payload)}`
}

export const unlockCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: AUDIO_UNLOCK_TTL_MS / 1000,
}
