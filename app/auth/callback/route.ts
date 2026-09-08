import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/"
  const response = NextResponse.redirect(new URL(next, requestUrl.origin))

  if (!code) return response

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return response

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.headers.get("cookie")?.split("; ").map((item) => { const index = item.indexOf("="); return { name: item.slice(0, index), value: item.slice(index + 1) } }) || [] },
      setAll(cookies) { cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) },
    },
  })
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) console.error("Auth callback error:", error.message)
  return response
}
