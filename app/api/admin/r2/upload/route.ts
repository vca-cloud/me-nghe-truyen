import { NextResponse } from "next/server"
import { hasAdminSession } from "@/lib/admin-auth"
import { presignPut, publicUrlFor, R2NotConfiguredError } from "@/lib/r2"
import { slugify } from "@/lib/slug"

export const dynamic = "force-dynamic"

const TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg" }

// Cấp URL PUT có chữ ký cho ảnh bìa đã được trình duyệt chuyển sang WebP (hoặc JPEG nếu trình duyệt không mã hóa được WebP).
export async function POST(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json().catch(() => null)
  const contentType = String(body?.contentType ?? "")
  const ext = TYPES[contentType]
  if (!ext) return NextResponse.json({ error: "Chỉ nhận ảnh WebP hoặc JPEG." }, { status: 400 })
  const base = slugify(String(body?.name ?? "")).slice(0, 60) || "cover"
  const key = `covers/${base}-${Date.now().toString(36)}.${ext}`
  try {
    return NextResponse.json({ uploadUrl: await presignPut(key, contentType), publicUrl: publicUrlFor(key), key })
  } catch (error) {
    const status = error instanceof R2NotConfiguredError ? 503 : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không tạo được link tải lên" }, { status })
  }
}
