"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Circle, MailCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase-client"
import { getSafeNextPath, getSiteUrl } from "@/lib/site-url"
import { PASSWORD_RULES, normalizeEmail, translateAuthError, validateSignup, type SignupErrors, type SignupFields } from "@/lib/signup-validation"

const inputClass = "dark:bg-[#9ECDDD] dark:text-[#154B95] dark:placeholder:text-[#2D74A8]"
const labelClass = "dark:text-[#154B95]"
const hintClass = "dark:text-[#2D74A8]"
const errorClass = "text-sm font-medium text-[#EE4D2D]"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const supabase = useMemo(() => createClient(), [])
  const [form, setForm] = useState<SignupFields>({ name: "", email: "", password: "", confirm: "" })
  const [touched, setTouched] = useState<Partial<Record<keyof SignupFields, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [website, setWebsite] = useState("")
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const errors: SignupErrors = validateSignup(form)
  const show = (field: keyof SignupFields) => (submitted || touched[field]) && errors[field]
  const update = (field: keyof SignupFields) => (event: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: event.target.value })
  const blur = (field: keyof SignupFields) => () => setTouched({ ...touched, [field]: true })

  const signup = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (website) return
    if (Object.keys(errors).length) {
      toast.error("Vui lòng sửa các ô được đánh dấu đỏ trước khi đăng ký.")
      return
    }

    setLoading(true)
    const email = normalizeEmail(form.email)
    const { data, error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: { data: { full_name: form.name.trim().replace(/\s+/g, " ") }, emailRedirectTo: `${getSiteUrl(window.location.origin)}/auth/callback` },
    })
    setLoading(false)

    if (error) {
      toast.error(translateAuthError(error.message))
      return
    }
    if (data.user && data.user.identities?.length === 0) {
      toast.error("Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.")
      return
    }
    if (!data.session) {
      setSentTo(email)
      return
    }

    await fetch("/api/sync-user", { method: "POST" })
    toast.success("Đăng ký thành công")
    const safeNext = getSafeNextPath(new URLSearchParams(window.location.search).get("next"))
    window.location.assign(new URL(safeNext, getSiteUrl(window.location.origin)).toString())
  }

  const signupWithGoogle = async () => {
    const redirectTo = `${getSiteUrl(window.location.origin)}/auth/callback`
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo, queryParams: { access_type: "offline", prompt: "select_account" } } })
    if (error) { toast.error(`Không thể đăng ký Google: ${error.message}`); return }
    if (!data.url) toast.error("Supabase chưa trả về URL đăng ký Google")
  }

  const cardClass = cn(props.className, "dark:bg-[#D4EEE4] dark:text-[#154B95]")

  if (sentTo) {
    return <Card {...props} className={cardClass}>
      <CardHeader className="items-center text-center">
        <MailCheck className="mx-auto h-12 w-12 text-[#154B95]" />
        <CardTitle className={labelClass}>Kiểm tra email để kích hoạt tài khoản</CardTitle>
        <CardDescription className={hintClass}>Chúng tôi đã gửi link xác nhận tới <strong className="text-[#154B95]">{sentTo}</strong>.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Mở hộp thư của email trên (xem cả mục <strong>Spam/Quảng cáo</strong>).</li>
          <li>Bấm link <strong>xác nhận</strong> trong thư. Tài khoản chỉ dùng được sau bước này.</li>
          <li>Quay lại trang đăng nhập và đăng nhập bằng email, mật khẩu vừa tạo.</li>
        </ol>
        <p className={hintClass}>Không thấy thư sau 5 phút? Có thể bạn đã gõ sai email, hãy đăng ký lại với email đúng.</p>
        <div className="flex flex-col gap-2 pt-2">
          <Button nativeButton={false} render={<Link href="/login" />}>Đến trang đăng nhập</Button>
          <Button variant="outline" type="button" onClick={() => { setSentTo(null); setSubmitted(false); setTouched({}) }}>Đăng ký lại với email khác</Button>
        </div>
      </CardContent>
    </Card>
  }

  return <Card {...props} className={cardClass}>
    <CardHeader>
      <CardTitle className={labelClass}>Tạo tài khoản</CardTitle>
      <CardDescription className={hintClass}>Vui lòng nhập <strong>email thật bạn đang dùng</strong>: chúng tôi sẽ gửi link xác nhận vào email này, tài khoản chỉ hoạt động sau khi bạn bấm link.</CardDescription>
    </CardHeader>
    <CardContent><form onSubmit={signup} noValidate><FieldGroup>
      <input type="text" name="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />
      <Field>
        <FieldLabel className={labelClass} htmlFor="name">Họ và tên</FieldLabel>
        <Input className={inputClass} id="name" type="text" autoComplete="name" placeholder="Nguyễn Văn An" value={form.name} onChange={update("name")} onBlur={blur("name")} aria-invalid={Boolean(show("name"))} maxLength={50} />
        {show("name") ? <p className={errorClass}>{errors.name}</p> : <FieldDescription className={hintClass}>Tên hiển thị trên tài khoản, 2–50 chữ cái.</FieldDescription>}
      </Field>
      <Field>
        <FieldLabel className={labelClass} htmlFor="signup-email">Email</FieldLabel>
        <Input className={inputClass} id="signup-email" type="email" inputMode="email" autoComplete="email" placeholder="tenban@gmail.com" value={form.email} onChange={update("email")} onBlur={blur("email")} aria-invalid={Boolean(show("email"))} />
        {show("email") ? <p className={errorClass}>{errors.email}</p> : <FieldDescription className={hintClass}>Link xác nhận sẽ được gửi tới email này. Kiểm tra kỹ chính tả trước khi đăng ký.</FieldDescription>}
      </Field>
      <Field>
        <FieldLabel className={labelClass} htmlFor="signup-password">Mật khẩu</FieldLabel>
        <Input className={inputClass} id="signup-password" type="password" autoComplete="new-password" value={form.password} onChange={update("password")} onBlur={blur("password")} aria-invalid={Boolean(show("password"))} />
        <ul className="space-y-1 text-sm">
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(form.password)
            return <li key={rule.id} className={cn("flex items-center gap-2", ok ? "text-green-700" : submitted || touched.password ? "text-[#EE4D2D]" : "text-muted-foreground dark:text-[#2D74A8]")}>
              {ok ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}{rule.label}
            </li>
          })}
        </ul>
      </Field>
      <Field>
        <FieldLabel className={labelClass} htmlFor="confirm-password">Nhập lại mật khẩu</FieldLabel>
        <Input className={inputClass} id="confirm-password" type="password" autoComplete="new-password" value={form.confirm} onChange={update("confirm")} onBlur={blur("confirm")} aria-invalid={Boolean(show("confirm"))} />
        {show("confirm") ? <p className={errorClass}>{errors.confirm}</p> : <FieldDescription className={hintClass}>Gõ lại đúng mật khẩu ở trên.</FieldDescription>}
      </Field>
      <Field>
        <Button type="submit" disabled={loading}>{loading ? "Đang đăng ký..." : "Tạo tài khoản"}</Button>
        <Button variant="outline" type="button" onClick={() => void signupWithGoogle()} className="dark:border-[#2D74A8] dark:bg-[#D4EEE4] dark:text-[#154B95]">Đăng ký bằng Google</Button>
        <FieldDescription className={cn("px-6 text-center", hintClass)}>Đã có tài khoản? <Link href="/login" className="text-[#154B95] underline">Đăng nhập</Link></FieldDescription>
      </Field>
    </FieldGroup></form></CardContent>
  </Card>
}
