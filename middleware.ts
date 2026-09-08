import { NextRequest, NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-session"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") return NextResponse.next()
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (await isValidAdminSession(session)) return NextResponse.next()
  return NextResponse.redirect(new URL("/admin/login", request.url))
}

export const config = { matcher: ["/admin/:path*"] }
