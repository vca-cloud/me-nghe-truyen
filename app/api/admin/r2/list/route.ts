import { NextResponse } from "next/server"
import { hasAdminSession } from "@/lib/admin-auth"
import { listR2, publicUrlFor, R2NotConfiguredError } from "@/lib/r2"

export const dynamic = "force-dynamic"

const AUDIO = /\.(mp3|m4a|aac|ogg|opus|wav)$/i

export async function GET(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const prefix = (new URL(request.url).searchParams.get("prefix") ?? "").replace(/^\/+/, "")
  if (prefix && !prefix.endsWith("/")) return NextResponse.json({ error: "prefix phải kết thúc bằng /" }, { status: 400 })
  try {
    const { folders, files } = await listR2(prefix)
    return NextResponse.json({
      prefix,
      folders: folders.map((folder) => ({ prefix: folder, name: folder.slice(prefix.length).replace(/\/$/, "") })),
      files: files
        .filter((file) => AUDIO.test(file.key))
        .map((file) => ({ key: file.key, name: file.key.slice(prefix.length), size: file.size, url: publicUrlFor(file.key) })),
    })
  } catch (error) {
    const status = error instanceof R2NotConfiguredError ? 503 : 502
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không đọc được R2" }, { status })
  }
}
