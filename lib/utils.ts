export { cn } from "cn"

export function getAudioUrl(fileName: string) {
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL

  if (!publicUrl) {
    throw new Error("Thiếu biến môi trường NEXT_PUBLIC_R2_PUBLIC_URL.")
  }

  return `${publicUrl.replace(/\/$/, "")}/${fileName.replace(/^\//, "")}`
}

const vnDateFormatter = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" })

export function formatDateVN(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : vnDateFormatter.format(date)
}
