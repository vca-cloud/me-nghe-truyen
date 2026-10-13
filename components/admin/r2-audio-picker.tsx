"use client"

import { useState } from "react"
import { ChevronRight, FileAudio, Folder, FolderOpen, HardDrive, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { AudioFile } from "@/lib/episode-order"

type Listing = { prefix: string; folders: { prefix: string; name: string }[]; files: { key: string; name: string; size: number; url: string }[] }
export type R2Pick = { kind: "folder"; folderName: string; files: AudioFile[] } | { kind: "file"; file: AudioFile }

async function fetchListing(prefix: string): Promise<Listing> {
  const response = await fetch(`/api/admin/r2/list?prefix=${encodeURIComponent(prefix)}`, { cache: "no-store" })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error || "Không đọc được R2")
  return data
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`

// Duyệt bucket R2: truyện 1 tập = chọn 1 file; truyện nhiều tập = chọn cả thư mục (các file sắp theo số thứ tự).
export function R2AudioPicker({ onPick }: { onPick: (pick: R2Pick) => void }) {
  const [open, setOpen] = useState(false)
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = (prefix: string) => {
    setLoading(true)
    setError(null)
    fetchListing(prefix)
      .then(setListing)
      .catch((err) => setError(err instanceof Error ? err.message : "Lỗi đọc R2"))
      .finally(() => setLoading(false))
  }

  const openPicker = () => {
    setOpen(true)
    load("")
  }

  const pickFolder = async (prefix: string, name: string) => {
    setLoading(true)
    try {
      const data = prefix === listing?.prefix ? listing : await fetchListing(prefix)
      if (!data.files.length) throw new Error(`Thư mục "${name}" không có file audio.`)
      onPick({ kind: "folder", folderName: name, files: data.files.map((file) => ({ name: file.name, url: file.url })) })
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi đọc thư mục")
    } finally {
      setLoading(false)
    }
  }

  const crumbs = (listing?.prefix ?? "").split("/").filter(Boolean)

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={openPicker}><HardDrive className="mr-2 h-4 w-4" />Chọn audio từ R2</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto shadow-2xl ring-2 ring-[#2D74A8] sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Chọn audio từ Cloudflare R2</DialogTitle>
            <DialogDescription>Truyện 1 tập: bấm vào file. Truyện nhiều tập: bấm &quot;Dùng thư mục&quot; — các tập tự xếp theo số 01, 02, 03…</DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-1 text-sm">
            <button type="button" className="font-medium text-[#2D74A8] hover:underline" onClick={() => load("")}>R2</button>
            {crumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                <button type="button" className="font-medium text-[#2D74A8] hover:underline" onClick={() => load(`${crumbs.slice(0, index + 1).join("/")}/`)}>{crumb}</button>
              </span>
            ))}
          </div>

          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
          {loading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Đang đọc R2…</p>}

          {listing && !loading && (
            <div className="space-y-1">
              {listing.prefix && listing.files.length > 0 && (
                <Button type="button" className="mb-2 w-full" onClick={() => void pickFolder(listing.prefix, crumbs[crumbs.length - 1] ?? "")}>
                  <FolderOpen className="mr-2 h-4 w-4" />Dùng thư mục này ({listing.files.length} tập)
                </Button>
              )}
              {listing.folders.map((folder) => (
                <div key={folder.prefix} className="flex items-center gap-2 rounded-md border p-2">
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left hover:underline" onClick={() => load(folder.prefix)}>
                    <Folder className="h-4 w-4 shrink-0 text-[#2D74A8]" /><span className="truncate">{folder.name}</span>
                  </button>
                  <Button type="button" size="sm" variant="outline" onClick={() => void pickFolder(folder.prefix, folder.name)}>Dùng thư mục</Button>
                </div>
              ))}
              {listing.files.map((file) => (
                <button key={file.key} type="button" onClick={() => { onPick({ kind: "file", file: { name: file.name, url: file.url } }); setOpen(false) }} className="flex w-full items-center gap-2 rounded-md border p-2 text-left hover:bg-muted">
                  <FileAudio className="h-4 w-4 shrink-0 text-[#EE4D2D]" /><span className="min-w-0 flex-1 truncate">{file.name}</span><span className="text-xs text-muted-foreground">{mb(file.size)}</span>
                </button>
              ))}
              {!listing.folders.length && !listing.files.length && <p className="text-sm text-muted-foreground">Không có thư mục hay file audio nào ở đây.</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
