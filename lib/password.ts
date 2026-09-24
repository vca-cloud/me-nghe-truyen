import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scrypt = promisify(scryptCallback) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>
const PREFIX = "scrypt$"
const KEY_LENGTH = 64

export function isHashedPassword(stored: string) {
  return stored.startsWith(PREFIX)
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const hash = await scrypt(password, salt, KEY_LENGTH)
  return `${PREFIX}${salt.toString("base64")}$${hash.toString("base64")}`
}

export async function verifyPassword(password: string, stored: string) {
  if (!isHashedPassword(stored)) {
    const a = Buffer.from(password)
    const b = Buffer.from(stored)
    return a.length === b.length && timingSafeEqual(a, b)
  }
  const [saltB64, hashB64] = stored.slice(PREFIX.length).split("$")
  if (!saltB64 || !hashB64) return false
  const expected = Buffer.from(hashB64, "base64")
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length)
  return timingSafeEqual(actual, expected)
}
