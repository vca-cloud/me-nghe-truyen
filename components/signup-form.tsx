"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase-client"

const inputClass = "dark:bg-[#9ECDDD] dark:text-[#154B95] dark:placeholder:text-[#2D74A8]"

async function syncUser(user: { id: string; email?: string; created_at?: string; user_metadata?: Record<string, unknown> } | null) {
  if (!user?.id || !user.email) return
  await fetch("/api/sync-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user }),
  })
}

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" })
  const [loading, setLoading] = useState(false)

  const signup = async (event: React.FormEvent) => {
    event.preventDefault()
    if (form.password.length < 8) { toast.error("Mật khẩu phải có ít nhất 8 ký tự"); return }
    if (form.password !== form.confirm) { toast.error("Mật khẩu xác nhận không khớp"); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setLoading(false)
      toast.error(`Đăng ký thất bại: ${error.message}`)
      return
    }

    let user = data.user
    let session = data.session

    if (!session) {
      const signedIn = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      if (signedIn.error) {
        setLoading(false)
        toast.error("Tài khoản đã tạo nhưng chưa đăng nhập được. Tắt Confirm email trong Supabase Auth rồi thử lại.")
        return
      }
      user = signedIn.data.user
      session = signedIn.data.session
    }

    await syncUser(user)
    setLoading(false)
    toast.success("Đăng ký thành công")
    router.push("/")
    router.refresh()
  }

  const signupWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo, queryParams: { access_type: "offline", prompt: "select_account" } } })
    if (error) { toast.error(`Không thể đăng ký Google: ${error.message}`); return }
    if (!data.url) toast.error("Supabase chưa trả về URL đăng ký Google")
  }

  return <Card {...props} className={cn(props.className, "dark:bg-[#D4EEE4] dark:text-[#154B95]")}>
    <CardHeader><CardTitle className="dark:text-[#154B95]">Create an account</CardTitle><CardDescription className="dark:text-[#2D74A8]">Enter your information below to create your account</CardDescription></CardHeader>
    <CardContent><form onSubmit={signup}><FieldGroup>
      <Field><FieldLabel className="dark:text-[#154B95]" htmlFor="name">Full Name</FieldLabel><Input className={inputClass} id="name" type="text" placeholder="John Doe" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
      <Field><FieldLabel className="dark:text-[#154B95]" htmlFor="signup-email">Email</FieldLabel><Input className={inputClass} id="signup-email" type="email" placeholder="m@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /><FieldDescription className="dark:text-[#2D74A8]">We&apos;ll use this to contact you. We will not share your email.</FieldDescription></Field>
      <Field><FieldLabel className="dark:text-[#154B95]" htmlFor="signup-password">Password</FieldLabel><Input className={inputClass} id="signup-password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /><FieldDescription className="dark:text-[#2D74A8]">Must be at least 8 characters long.</FieldDescription></Field>
      <Field><FieldLabel className="dark:text-[#154B95]" htmlFor="confirm-password">Confirm Password</FieldLabel><Input className={inputClass} id="confirm-password" type="password" value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} required /><FieldDescription className="dark:text-[#2D74A8]">Please confirm your password.</FieldDescription></Field>
      <Field><Button type="submit" disabled={loading}>{loading ? "Đang đăng ký..." : "Create Account"}</Button><Button variant="outline" type="button" onClick={() => void signupWithGoogle()} className="dark:border-[#2D74A8] dark:bg-[#D4EEE4] dark:text-[#154B95]">Sign up with Google</Button><FieldDescription className="px-6 text-center dark:text-[#2D74A8]">Already have an account? <Link href="/login" className="text-[#154B95] underline">Sign in</Link></FieldDescription></Field>
    </FieldGroup></form></CardContent>
  </Card>
}
