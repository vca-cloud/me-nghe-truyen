import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { syncAdminUser } from "@/lib/sync-admin-user"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/"
  const response = NextResponse.redirect(new URL(next, requestUrl.origin))

  if (!code) return response

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.headers.get("cookie")
            ? request.headers.get("cookie")!.split("; ").map((item) => {
                const [name, ...rest] = item.split("=")
                return { name, value: rest.join("=") }
              })
            : []
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("Auth callback error:", error.message)
    return response
  }

  if (session?.user) {
    try {
      const { error: upsertError } = await syncAdminUser(session.user)
      if (upsertError) console.error("Sync admin_users failed:", upsertError)
    } catch (err) {
      console.error("Error syncing admin_users:", err)
    }
  }

  return response
}
