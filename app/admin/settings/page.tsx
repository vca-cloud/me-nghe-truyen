"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AdminShell } from "@/components/admin/admin-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminSettingsPage() {
  const [downloading, setDownloading] = useState(false)

  const downloadBackup = async () => {
    setDownloading(true)
    try {
      const response = await fetch("/api/backup", { cache: "no-store" })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error || "Không thể tạo bản sao lưu.")
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `me-nghe-truyen-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success("Đã tải bản sao lưu stories, episodes và affiliate_links.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải bản sao lưu.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Cài đặt</h1>
          <p className="text-sm text-muted-foreground">Quản lý sao lưu dữ liệu cho hệ thống.</p>
        </div>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Sao lưu dữ liệu</CardTitle>
            <CardDescription>Xuất toàn bộ dữ liệu hai bảng stories, episodes và affiliate_links thành một file JSON để lưu trữ định kỳ.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void downloadBackup()} disabled={downloading}>
              {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {downloading ? "Đang tạo bản sao lưu..." : "Tải bản sao lưu (Backup JSON)"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
