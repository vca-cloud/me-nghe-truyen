import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/supabase-server"
import { syncAdminUser } from "@/lib/sync-admin-user"

export async function POST() {
  try {
    const { user } = await getAuthenticatedUser()
    if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { error } = await syncAdminUser(user)
    if (error) {
      console.error("Sync user failed:", error)
      return NextResponse.json({ error: "Không đồng bộ được user" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("POST /api/sync-user:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Không đồng bộ được user" }, { status: 500 })
  }
}
