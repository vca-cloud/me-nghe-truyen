"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) })
    const payload = await response.json()
    setLoading(false)
    if (!response.ok) { toast.error(payload.error || "Đăng nhập thất bại"); return }
    router.replace("/admin/analytics")
    router.refresh()
  }

  return <main className="flex min-h-svh items-center justify-center bg-background p-6"><Card className="w-full max-w-md dark:bg-[#D4EEE4] dark:text-[#154B95]"><CardHeader><CardTitle className="dark:text-[#154B95]">Đăng nhập quản trị</CardTitle><CardDescription className="dark:text-[#2D74A8]">Sử dụng tài khoản quản trị viên để vào Dashboard.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label htmlFor="admin-email" className="dark:text-[#154B95]">Email quản trị viên</Label><Input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="dark:bg-[#9ECDDD] dark:text-[#154B95] dark:placeholder:text-[#2D74A8]" /></div><div className="space-y-2"><Label htmlFor="admin-password" className="dark:text-[#154B95]">Mật khẩu</Label><Input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required className="dark:bg-[#9ECDDD] dark:text-[#154B95]" /></div><Button className="w-full" type="submit" disabled={loading}>{loading ? "Đang xác thực..." : "Đăng nhập Dashboard"}</Button></form></CardContent></Card></main>
}
