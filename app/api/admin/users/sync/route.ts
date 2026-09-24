import { NextResponse } from "next/server"
import { hasAdminSession } from "@/lib/admin-auth"
import { syncAllAuthUsers } from "@/lib/sync-admin-user"

export async function POST() {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const synced = await syncAllAuthUsers()
    return NextResponse.json({ ok: true, count: synced.length, emails: synced })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không đồng bộ được thành viên"
    console.error("POST /api/admin/users/sync:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
