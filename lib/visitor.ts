import { createHash } from "node:crypto"
import { clientIp } from "@/lib/request-ip"

// Mã ẩn danh cho một người xem: đếm được người không trùng mà không lưu IP gốc.
export function visitorHash(request: Request) {
  const salt = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  return createHash("sha256").update(`${clientIp(request)}|${salt}`).digest("hex").slice(0, 32)
}
