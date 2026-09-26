"use client"

import { useEffect, useState } from "react"
import { ExternalLink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type Limits = Record<string, number>
type SupabaseUsage = {
  connected: boolean
  reason: string | null
  databaseBytes?: number
  storageBytes?: number
  storageObjects?: number
  tables?: { name: string; bytes: number }[]
  mau?: number
  totalUsers?: number
  limits?: Limits
  dashboardUrl?: string
}
type R2Usage = {
  connected: boolean
  reason: string | null
  storageBytes?: number
  objectCount?: number
  classA?: number
  classB?: number
  limits?: Limits
  dashboardUrl?: string
}
type UsagePayload = { checkedAt: string; supabase: SupabaseUsage; r2: R2Usage; links: { supabaseEgress: string; vercelUsage: string } }

function formatBytes(bytes = 0) {
  const units = ["B", "KB", "MB", "GB", "TB"]
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++ }
  return `${value.toLocaleString("vi-VN", { maximumFractionDigits: unit >= 2 ? 2 : 0 })} ${units[unit]}`
}

async function fetchUsage(refresh: boolean): Promise<UsagePayload> {
  const response = await fetch(`/api/admin/usage${refresh ? "?refresh=1" : ""}`, { cache: "no-store" })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload?.error || "Không tải được dữ liệu tài nguyên")
  return payload
}

function Meter({ label, used, limit, format = (n: number) => n.toLocaleString("vi-VN"), note }: { label: string; used: number; limit: number; format?: (n: number) => string; note?: string }) {
  const ratio = limit > 0 ? used / limit : 0
  const color = ratio >= 0.9 ? "bg-red-600" : ratio >= 0.7 ? "bg-amber-500" : "bg-[#2D74A8]"
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{format(used)} / {format(limit)} ({(ratio * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%)</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">Còn lại {format(Math.max(0, limit - used))}{note ? ` • ${note}` : ""}</p>
    </div>
  )
}

function Panel({ title, connected, reason, href, children }: { title: string; connected: boolean; reason: string | null; href?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        {href && <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-[#2D74A8] hover:underline">Mở trang gốc <ExternalLink className="h-3.5 w-3.5" /></a>}
      </div>
      {connected ? children : <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">Chưa kết nối: {reason}</p>}
    </div>
  )
}

export function SystemUsage() {
  const [data, setData] = useState<UsagePayload | null>(null)
  const [loading, setLoading] = useState(true)

  const apply = (promise: Promise<UsagePayload>) => promise
    .then(setData)
    .catch(() => setData(null))
    .finally(() => setLoading(false))

  useEffect(() => { void apply(fetchUsage(false)) }, [])

  const refresh = () => {
    setLoading(true)
    void apply(fetchUsage(true))
  }

  const sb = data?.supabase
  const r2 = data?.r2
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">5. Tài nguyên hệ thống</h2>
          <p className="text-sm text-muted-foreground">
            So với hạn mức gói miễn phí. {data ? `Cập nhật lúc ${new Date(data.checkedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}, lưu tạm 1 giờ.` : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Làm mới
        </Button>
      </div>
      {!data ? <p className="text-sm text-muted-foreground">{loading ? "Đang tải..." : "Không tải được dữ liệu tài nguyên."}</p> : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel title="Supabase (database, đăng nhập)" connected={Boolean(sb?.connected)} reason={sb?.reason ?? null} href={sb?.dashboardUrl}>
            <Meter label="Dung lượng database" used={sb?.databaseBytes ?? 0} limit={sb?.limits?.databaseBytes ?? 1} format={formatBytes} />
            <Meter label="Supabase Storage" used={sb?.storageBytes ?? 0} limit={sb?.limits?.storageBytes ?? 1} format={formatBytes} note={`${(sb?.storageObjects ?? 0).toLocaleString("vi-VN")} file`} />
            <Meter label="Thành viên hoạt động tháng này (MAU)" used={sb?.mau ?? 0} limit={sb?.limits?.mau ?? 1} note={`Tổng ${(sb?.totalUsers ?? 0).toLocaleString("vi-VN")} tài khoản; ước tính theo lần đăng nhập gần nhất`} />
            {sb?.tables && sb.tables.length > 0 && (
              <div className="text-sm">
                <p className="mb-1 font-medium">Bảng chiếm dung lượng nhiều nhất</p>
                <ul className="space-y-0.5 text-muted-foreground">
                  {sb.tables.map((table) => <li key={table.name} className="flex justify-between"><span>{table.name}</span><span>{formatBytes(table.bytes)}</span></li>)}
                </ul>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Băng thông (egress, 5 GB/tháng) Supabase không có API công khai, xem tại <a className="text-[#2D74A8] underline" href={data.links.supabaseEgress} target="_blank" rel="noopener noreferrer">trang Usage của Supabase</a>.</p>
          </Panel>
          <Panel title="Cloudflare R2 (audio, ảnh bìa)" connected={Boolean(r2?.connected)} reason={r2?.reason ?? null} href={r2?.dashboardUrl}>
            <Meter label="Dung lượng lưu trữ" used={r2?.storageBytes ?? 0} limit={r2?.limits?.storageBytes ?? 1} format={formatBytes} note={`${(r2?.objectCount ?? 0).toLocaleString("vi-VN")} file`} />
            <Meter label="Thao tác ghi/liệt kê tháng này (Class A)" used={r2?.classA ?? 0} limit={r2?.limits?.classA ?? 1} />
            <Meter label="Lượt đọc/tải file tháng này (Class B)" used={r2?.classB ?? 0} limit={r2?.limits?.classB ?? 1} />
            <p className="text-xs text-muted-foreground">R2 không tính phí băng thông tải ra; mỗi lần nghe/tải file là 1 lượt Class B.</p>
          </Panel>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Băng thông Vercel không có API công khai, xem tại <a className="text-[#2D74A8] underline" href={data?.links.vercelUsage ?? "https://vercel.com/dashboard/usage"} target="_blank" rel="noopener noreferrer">trang Usage của Vercel</a>.
      </p>
    </section>
  )
}
