"use client"

import { useEffect, useState } from "react"
import { Edit, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import {
  createAffiliateLink,
  deleteAffiliateLink,
  getAffiliateLinks,
  updateAffiliateLink,
  type AffiliateLink,
  type AffiliateLinkPayload,
} from "@/lib/affiliate-api"

const emptyForm: AffiliateLinkPayload = {
  title: "",
  shoppe_url: "",
  image_url: "",
  is_active: true,
}

export function AffiliateManager() {
  const [items, setItems] = useState<AffiliateLink[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AffiliateLink | null>(null)
  const [form, setForm] = useState<AffiliateLinkPayload>(emptyForm)
  const [fetchingImage, setFetchingImage] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await getAffiliateLinks())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được danh sách affiliate")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const openDialog = (link?: AffiliateLink) => {
    if (link) {
      setEditing(link)
      setForm({
        title: link.title,
        shoppe_url: link.shoppe_url,
        image_url: link.image_url || "",
        is_active: link.is_active,
      })
    } else {
      setEditing(null)
      setForm({ ...emptyForm })
    }
    setOpen(true)
  }

  const fetchImageFromShopee = async () => {
    const url = form.shoppe_url.trim()
    if (!url) {
      toast.error("Nhập URL Shopee trước")
      return
    }
    setFetchingImage(true)
    try {
      const response = await fetch(`/api/affiliate-links/preview?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Không lấy được ảnh")
      if (!data.image_url) {
        toast.info("Không tìm thấy ảnh đại diện từ URL này")
        return
      }
      setForm((current) => ({ ...current, image_url: data.image_url }))
      toast.success("Đã lấy ảnh từ Shopee")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lấy được ảnh Shopee")
    } finally {
      setFetchingImage(false)
    }
  }

  const save = async () => {
    const payload: AffiliateLinkPayload = {
      title: form.title.trim(),
      shoppe_url: form.shoppe_url.trim(),
      image_url: form.image_url?.trim() || null,
      is_active: form.is_active,
    }
    if (!payload.title || !payload.shoppe_url) {
      toast.error("Tiêu đề và URL Shopee không được để trống")
      return
    }
    try {
      if (editing) await updateAffiliateLink(editing.id, payload)
      else await createAffiliateLink(payload)
      toast.success(editing ? "Đã cập nhật link" : "Đã thêm link mới")
      setOpen(false)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu link")
    }
  }

  const toggle = async (link: AffiliateLink) => {
    try {
      await updateAffiliateLink(link.id, {
        title: link.title,
        shoppe_url: link.shoppe_url,
        image_url: link.image_url,
        is_active: !link.is_active,
      })
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đổi trạng thái link")
    }
  }

  const remove = async (link: AffiliateLink) => {
    if (!window.confirm(`Xóa link "${link.title}"?`)) return
    try {
      await deleteAffiliateLink(link.id)
      toast.success("Đã xóa link")
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa link")
    }
  }

  const totalClicks = items.reduce((sum, item) => sum + Number(item.clicks || 0), 0)

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Quản lý Link Affiliate Shopee</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tổng clicks: <span className="font-semibold">{totalClicks.toLocaleString()}</span>
            </p>
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Thêm link
          </Button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Đang tải...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ảnh</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>URL Shopee</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Chưa có link nào. Bấm &quot;Thêm link&quot; để bắt đầu.
                  </TableCell>
                </TableRow>
              ) : items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="relative h-12 w-12">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="h-12 w-12 rounded object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none"
                            event.currentTarget.parentElement?.querySelector(".image-fallback")?.classList.remove("hidden")
                          }}
                        />
                      ) : null}
                      <div className={`image-fallback ${item.image_url ? "hidden " : ""}flex h-12 w-12 items-center justify-center rounded bg-muted text-muted-foreground`}>
                        <ExternalLink className="h-5 w-5" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>
                    <a href={item.shoppe_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      {item.shoppe_url.slice(0, 40)}...
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={item.is_active} onCheckedChange={() => void toggle(item)} />
                      <Badge variant={item.is_active ? "default" : "outline"}>{item.is_active ? "Bật" : "Tắt"}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{Number(item.clicks || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" aria-label="Sửa" onClick={() => openDialog(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Xóa" className="text-destructive" onClick={() => void remove(item)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa link Affiliate" : "Thêm link Affiliate"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="affiliate-title">Tiêu đề</Label>
              <Input id="affiliate-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Mê Nghe Truyện - Mở khóa audio" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliate-url">URL Shopee</Label>
              <Input id="affiliate-url" value={form.shoppe_url} onChange={(event) => setForm({ ...form, shoppe_url: event.target.value })} placeholder="https://s.shopee.vn/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliate-image">URL ảnh sản phẩm</Label>
              <Input id="affiliate-image" value={form.image_url ?? ""} onChange={(event) => setForm({ ...form, image_url: event.target.value })} placeholder="Tự lấy từ Shopee hoặc nhập URL ảnh" />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void fetchImageFromShopee()} disabled={fetchingImage}>
              {fetchingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
              Lấy ảnh từ Shopee
            </Button>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: Boolean(checked) })} />
              <Label>Bật link này cho popup</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={() => void save()}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
