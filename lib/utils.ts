export { cn } from "cn"
import { R2_PUBLIC_URL } from "@/lib/r2-public"

export function getAudioUrl(fileName: string) {
  return `${R2_PUBLIC_URL}/${fileName.replace(/^\//, "")}`
}

const vnDateFormatter = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" })

export function formatDateVN(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : vnDateFormatter.format(date)
}
