"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const inputClass = "dark:bg-[#9ECDDD] dark:text-[#154B95] dark:placeholder:text-[#2D74A8]"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const login = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { toast.error(`Đăng nhập thất bại: ${error.message}`); return }
    toast.success("Đăng nhập thành công")
    router.push("/")
    router.refresh()
  }

  const loginWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo, queryParams: { access_type: "offline", prompt: "select_account" } } })
    if (error) { toast.error(`Không thể đăng nhập Google: ${error.message}`); return }
    if (!data.url) toast.error("Supabase chưa trả về URL đăng nhập Google")
  }

  return <div className={cn("flex flex-col gap-6", className)} {...props}>
    <Card className="dark:bg-[#D4EEE4] dark:text-[#154B95]">
      <CardHeader><CardTitle className="dark:text-[#154B95]">Login to your account</CardTitle><CardDescription className="dark:text-[#2D74A8]">Enter your email below to login to your account</CardDescription></CardHeader>
      <CardContent><form onSubmit={login}><FieldGroup>
        <Field><FieldLabel className="dark:text-[#154B95]" htmlFor="email">Email</FieldLabel><Input className={inputClass} id="email" type="email" placeholder="m@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></Field>
        <Field><div className="flex items-center"><FieldLabel className="dark:text-[#154B95]" htmlFor="password">Password</FieldLabel><a href="#" className="ml-auto text-sm text-[#154B95] underline-offset-4 hover:underline">Forgot your password?</a></div><Input className={inputClass} id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></Field>
        <Field><Button type="submit" disabled={loading}>{loading ? "Đang đăng nhập..." : "Login"}</Button><Button variant="outline" type="button" onClick={() => void loginWithGoogle()} className="dark:border-[#2D74A8] dark:bg-[#D4EEE4] dark:text-[#154B95]">Login with Google</Button><FieldDescription className="text-center dark:text-[#2D74A8]">Don&apos;t have an account? <Link href="/signup" className="text-[#154B95] underline">Sign up</Link></FieldDescription></Field>
      </FieldGroup></form></CardContent>
    </Card>
  </div>
}
