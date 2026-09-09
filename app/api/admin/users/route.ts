import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Thiếu config Supabase" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Lỗi fetch admin_users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users: data || [] })
  } catch (err: any) {
    console.error("Lỗi fetch admin_users:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Thiếu config Supabase" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const body = await request.json()
    const { name, email, package: pkg } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Tên và email không được để trống" }, { status: 400 })
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      package: pkg || "Free",
      locked: false,
      register: new Date().toISOString(),
      plays: "0",
    }
    const { data, error } = await supabase
      .from("admin_users")
      .insert(payload)
      .select()

    if (error) {
      console.error("Lỗi insert admin_users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: data?.[0] })
  } catch (err: any) {
    console.error("Lỗi POST /api/admin/users:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Thiếu config Supabase" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const body = await request.json()
    const { auth_id, name, email, package: pkg, locked } = body

    if (!auth_id || !name || !email) {
      return NextResponse.json({ error: "auth_id, tên và email không được để trống" }, { status: 400 })
    }

    const updates: Record<string, unknown> = {
      name: name.trim(),
      email: email.trim(),
      package: pkg || "Free",
    }
    if (typeof locked === "boolean") updates.locked = locked

    const { data, error } = await supabase
      .from("admin_users")
      .update(updates)
      .eq("auth_id", auth_id)
      .select()

    if (error) {
      console.error("Lỗi update admin_users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: data?.[0] })
  } catch (err: any) {
    console.error("Lỗi PUT /api/admin/users:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Thiếu config Supabase" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { searchParams } = new URL(request.url)
    const auth_id = searchParams.get("auth_id")

    if (!auth_id) {
      return NextResponse.json({ error: "Thiếu auth_id" }, { status: 400 })
    }

    const { error } = await supabase
      .from("admin_users")
      .delete()
      .eq("auth_id", auth_id)

    if (error) {
      console.error("Lỗi delete admin_users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Lỗi DELETE /api/admin/users:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
