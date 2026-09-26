"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDateVN } from "@/lib/utils"

type Counts = { impressions: number; clicks: number }
type Ranked = Counts & { id: number; title: string; rate: number | null }

export type AffiliateStats = {
  since: string | null
  impressions: number
  clicks: number
  uniqueViewers: number
  uniqueClickers: number
  conversionRate: number | null
  byDay: (Counts & { date: string })[]
  byStory: Ranked[]
  byLink: Ranked[]
}

const percent = (value: number | null) => (value == null ? "—" : `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`)

function RankTable({ title, rows, empty }: { title: string; rows: Ranked[]; empty: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : (
        <Table>
          <TableHeader>
            <TableRow><TableHead>Tên</TableHead><TableHead className="text-right">Hiển thị</TableHead><TableHead className="text-right">Click</TableHead><TableHead className="text-right">Tỷ lệ</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="max-w-[220px] truncate">{row.title}</TableCell>
                <TableCell className="text-right">{row.impressions.toLocaleString("vi-VN")}</TableCell>
                <TableCell className="text-right font-semibold text-[#EE4D2D]">{row.clicks.toLocaleString("vi-VN")}</TableCell>
                <TableCell className="text-right">{percent(row.rate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export function AffiliateFunnel({ stats, periodLabel }: { stats: AffiliateStats | null; periodLabel: string }) {
  if (!stats) return null
  const noData = stats.impressions === 0 && stats.clicks === 0
  const cards = [
    { label: "Popup hiển thị", value: stats.impressions.toLocaleString("vi-VN"), detail: `${stats.uniqueViewers.toLocaleString("vi-VN")} người xem khác nhau` },
    { label: "Click link Shopee", value: stats.clicks.toLocaleString("vi-VN"), detail: `${stats.uniqueClickers.toLocaleString("vi-VN")} người bấm khác nhau`, highlight: true },
    { label: "Tỷ lệ chuyển đổi popup", value: percent(stats.conversionRate), detail: "Click / lần popup hiển thị", highlight: true },
    { label: "Bỏ đi không bấm", value: Math.max(0, stats.impressions - stats.clicks).toLocaleString("vi-VN"), detail: "Hiển thị nhưng không click" },
  ]

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">4. Affiliate: {periodLabel}</h2>
        <p className="text-sm text-muted-foreground">
          {stats.since ? `Dữ liệu sự kiện có từ ${formatDateVN(stats.since)}.` : "Chưa có sự kiện nào (cần chạy SQL 20250916 và deploy)."} Mỗi người mở popup liên tục chỉ tính 1 lần hiển thị mỗi phút; click lặp trong 10 phút chỉ tính 1.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className={`mt-2 text-2xl font-bold ${card.highlight ? "text-[#EE4D2D]" : "text-foreground"}`}>{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
          </div>
        ))}
      </div>
      {!noData && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 font-semibold">Hiển thị và click theo ngày</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byDay.map((day) => ({ ...day, label: formatDateVN(`${day.date}T12:00:00+07:00`).slice(0, 5) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="impressions" name="Hiển thị" fill="#689EC2" />
                <Bar dataKey="clicks" name="Click" fill="#EE4D2D" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RankTable title="Truyện mang về nhiều click nhất" rows={stats.byStory} empty="Chưa có dữ liệu trong kỳ này." />
        <RankTable title="Hiệu quả từng link" rows={stats.byLink} empty="Chưa có dữ liệu trong kỳ này." />
      </div>
    </section>
  )
}
