import { NextResponse } from "next/server"
import { syncAdminUser } from "@/lib/sync-admin-user"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const user = body?.user
    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: "Thiếu thông tin user" }, { status: 400 })
    }

    const { error } = await syncAdminUser({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      user_metadata: user.user_metadata || {},
    } as Parameters<typeof syncAdminUser>[0])

    if (error) {
      console.error("Sync user failed:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không đồng bộ được user"
    console.error("POST /api/sync-user:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
