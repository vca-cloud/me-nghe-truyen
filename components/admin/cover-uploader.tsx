"use client"

import { useRef, useState } from "react"
import { ImagePlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toCoverImage } from "@/lib/image-to-webp"

type Props = { value: string; onChange: (url: string) => void; storyTitle: string }

export function CoverUploader({ value, onChange, storyTitle }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const { blob, width, height } = await toCoverImage(file)
      const response = await fetch("/api/admin/r2/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: storyTitle || file.name.replace(/\.[^.]+$/, ""), contentType: blob.type }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || "Không tạo được link tải lên")
      // Trình duyệt chặn (CORS chưa đặt/sai) thì fetch ném TypeError "Failed to fetch", không có mã lỗi.
      const put = await fetch(data.uploadUrl, { method: "PUT", headers: { "Content-Type": blob.type }, body: blob }).catch(() => {
        throw new Error(`R2 chặn tải lên từ ${window.location.origin}: bucket chưa đặt CORS (Cloudflare → R2 → bucket → Settings → CORS Policy).`)
      })
      if (!put.ok) throw new Error(`R2 từ chối tải lên (${put.status}). Kiểm tra CORS của bucket.`)
      onChange(data.publicUrl)
      toast.success(`Đã tải ảnh bìa ${width}×${height} (${blob.type === "image/webp" ? "WebP" : "JPEG"}, ${Math.round(blob.size / 1024)} KB)`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tải ảnh thất bại")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex gap-4">
      <div className="flex aspect-[4/5] w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted text-muted-foreground">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value ? <img src={value} alt="Ảnh bìa" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6" />}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file) }} />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
          {uploading ? "Đang xử lý & tải lên…" : value ? "Đổi ảnh bìa" : "Chọn ảnh bìa"}
        </Button>
        <p className="text-xs text-muted-foreground">Tự cắt 4:5, thu về 1080×1350 và đổi sang WebP trước khi tải lên R2.</p>
        <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Hoặc dán link ảnh" className="h-8 text-xs" />
      </div>
    </div>
  )
}
