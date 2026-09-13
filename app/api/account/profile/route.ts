import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/supabase-server"

export async function GET() {
  const { user, error } = await getAuthenticatedUser()
  if (error || !user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 })
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      user_metadata: user.user_metadata || {},
    },
  })
}
