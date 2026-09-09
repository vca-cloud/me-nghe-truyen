import { createClient, type User } from "@supabase/supabase-js"

export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Thiếu cấu hình Supabase service role.")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function profileFromUser(user: User) {
  const metadata = user.user_metadata || {}
  const name = String(metadata.full_name || metadata.name || user.email?.split("@")[0] || "User")
  const avatarUrl = metadata.avatar_url || metadata.picture || null

  return {
    auth_id: user.id,
    email: user.email || "",
    name,
    avatar_url: avatarUrl,
    package: "Free",
    locked: false,
    register: user.created_at || new Date().toISOString(),
    plays: "0",
  }
}

export async function syncAdminUser(user: User) {
  const db = createServiceClient()
  const row = profileFromUser(user)
  const { error } = await db.from("admin_users").upsert(row, { onConflict: "auth_id" })

  if (error && /avatar_url/i.test(error.message)) {
    const { avatar_url: _avatar, ...withoutAvatar } = row
    return db.from("admin_users").upsert(withoutAvatar, { onConflict: "auth_id" })
  }

  return { error }
}

export async function syncAllAuthUsers() {
  const db = createServiceClient()
  const synced: string[] = []
  let page = 1

  while (true) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error

    const users = data.users || []
    if (!users.length) break

    for (const user of users) {
      const result = await syncAdminUser(user)
      if (result.error) throw result.error
      if (user.email) synced.push(user.email)
    }

    if (users.length < 200) break
    page += 1
  }

  return synced
}
