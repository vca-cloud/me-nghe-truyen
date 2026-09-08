"use client"

import { useEffect, useState } from "react"
import { Edit, Eye, EyeOff, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { slugify } from "@/lib/slug"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

type Category = { id: number; name: string; slug: string; stories_count: number; plays_count: string; is_visible: boolean }

export function CategoryManager() {
  const [items, setItems] = useState<Category[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: "", slug: "" })
  const load = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("name")
    if (!error) {
      setItems(data || [])
      localStorage.setItem("admin-categories", JSON.stringify(data || []))
      return
    }
    const cached = localStorage.getItem("admin-categories")
    if (cached) setItems(JSON.parse(cached) as Category[])
    else toast.error(`Lỗi tải thể loại: ${error.message}. Hãy chạy migration admin trong Supabase.`)
  }
  useEffect(() => { void load() }, [])
  const save = async () => {
    const name = form.name.trim(); const slug = form.slug.trim() || slugify(name)
    if (!name) return
    const result = editing ? await supabase.from("categories").update({ name, slug }).eq("id", editing.id) : await supabase.from("categories").insert({ name, slug })
    if (result.error) {
      const cached = items
      const fallback = editing ? cached.map((item) => item.id === editing.id ? { ...item, name, slug } : item) : [...cached, { id: Date.now(), name, slug, stories_count: 0, plays_count: "0", is_visible: true }]
      setItems(fallback)
      localStorage.setItem("admin-categories", JSON.stringify(fallback))
      toast.warning("Đã lưu tạm trên trình duyệt. Hãy chạy migration categories để đồng bộ Supabase.")
      setOpen(false)
      return
    }
    toast.success("Đã lưu thể loại"); setOpen(false); await load()
  }
  const toggle = async (item: Category) => { const { error } = await supabase.from("categories").update({ is_visible: !item.is_visible }).eq("id", item.id); if (error) toast.error(error.message); else await load() }
  const remove = async (item: Category) => { if (!confirm(`Xóa thể loại ${item.name}?`)) return; const { error } = await supabase.from("categories").delete().eq("id", item.id); if (error) toast.error(`Lỗi xóa: ${error.message}`); else { toast.success("Đã xóa thể loại"); await load() } }
  return <>
    <div className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Quản lý Thể loại</h1><Button onClick={() => { setEditing(null); setForm({ name: "", slug: "" }); setOpen(true) }}><Plus className="mr-2 h-4 w-4" />Thêm thể loại</Button></div>
      <Table><TableHeader><TableRow><TableHead>Tên</TableHead><TableHead>Slug</TableHead><TableHead>Số truyện</TableHead><TableHead>Trạng thái</TableHead><TableHead>Hành động</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell>{item.slug}</TableCell><TableCell>{item.stories_count}</TableCell><TableCell><Badge variant={item.is_visible ? "default" : "outline"}>{item.is_visible ? "Hiển thị" : "Ẩn"}</Badge></TableCell><TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => { setEditing(item); setForm({ name: item.name, slug: item.slug }); setOpen(true) }}><Edit className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => void toggle(item)}>{item.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => void remove(item)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table>
    </div><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "Sửa thể loại" : "Thêm thể loại"}</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="category-name">Tên thể loại</Label><Input id="category-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div className="space-y-2"><Label htmlFor="category-slug">Slug</Label><Input id="category-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button onClick={() => void save()}>Lưu</Button></DialogFooter></DialogContent></Dialog>
  </>
}
