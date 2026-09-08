export { cn } from "cn"

export function getAudioUrl(fileName: string) {
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL

  if (!publicUrl) {
    throw new Error("Thiếu biến môi trường NEXT_PUBLIC_R2_PUBLIC_URL.")
  }

  return `${publicUrl.replace(/\/$/, "")}/${fileName.replace(/^\//, "")}`
}
