"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Plus, Pencil, Trash2, Search } from "lucide-react"

interface Audio {
  id: string
  title: string
  author: string | null
  genre: string | null
  description: string | null
  audio_url: string | null
  cover_url: string | null
  episodes: number | null
  duration: string | null
  status: string | null
  base_fake_views?: number | null
  real_views?: number | null
}

export function AdminAudio({ initialAudios = [] }: { initialAudios?: Audio[] }) {
  const [audios, setAudios] = useState<Audio[]>(initialAudios)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Audio | null>(null)
  const [form, setForm] = useState({ title: "", author: "", genre: "", description: "", audio_url: "", cover_url: "", base_fake_views: "" })
  const randomViews = () => Math.floor(1500 + Math.random() * 13501)
  const filtered = audios.filter((audio) => `${audio.title} ${audio.author || ""}`.toLowerCase().includes(searchTerm.toLowerCase()))

  const refresh = async () => {
    const { data } = await supabase.from("stories").select("*").order("id", { ascending: false })
    if (data) setAudios(data as Audio[])
  }
  const start = (audio?: Audio) => {
    setEditing(audio || null)
    setForm(audio ? { title: audio.title, author: audio.author || "", genre: audio.genre || "", description: audio.description || "", audio_url: audio.audio_url || "", cover_url: audio.cover_url || "", base_fake_views: String(audio.base_fake_views || "") } : { title: "", author: "", genre: "", description: "", audio_url: "", cover_url: "", base_fake_views: "" })
    setOpen(true)
  }
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true)
    const base_fake_views = Number(form.base_fake_views) || (editing ? 0 : randomViews())
    const payload = { title: form.title, author: form.author, genre: form.genre, description: form.description, audio_url: form.audio_url, cover_url: form.cover_url || null, base_fake_views }
    const result = editing ? await supabase.from("stories").update(payload).eq("id", editing.id) : await supabase.from("stories").insert(payload)
    if (result.error) toast.error(result.error.message); else { toast.success("Đã lưu truyện"); setOpen(false); await refresh() }
    setLoading(false)
  }
  const remove = async (id: string) => { if (!confirm("Xóa truyện này?")) return; await supabase.from("stories").delete().eq("id", id); await refresh() }

  return <div className="space-y-6"><div className="flex items-center justify-between"><h2 className="text-2xl font-bold">Quản lý Audio</h2><Button onClick={() => start()}><Plus className="mr-2 h-4 w-4" />Thêm truyện</Button></div><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4" /><Input className="pl-10" placeholder="Tìm kiếm truyện, tác giả..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></div><Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b"><th className="p-4 text-left">Tên truyện</th><th className="p-4 text-left">Thể loại</th><th className="p-4 text-left">Lượt nghe</th><th className="p-4 text-right">Thao tác</th></tr></thead><tbody>{filtered.map((audio) => <tr key={audio.id} className="border-b"><td className="p-4">{audio.title}</td><td className="p-4">{(audio.genre || "Khác").split(",").map((genre) => <span key={genre} className="mr-1 inline-block rounded-full border px-2 py-0.5 text-xs">{genre.trim()}</span>)}</td><td className="p-4">{(Number(audio.base_fake_views) || 0) + (Number(audio.real_views) || 0)} ({Number(audio.real_views) || 0} thực)</td><td className="p-4 text-right"><Button variant="ghost" size="icon" onClick={() => start(audio)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => remove(audio.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td></tr>)}</tbody></table></div></CardContent></Card>{open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={save} className="w-full max-w-lg space-y-4 rounded-lg bg-background p-6"><h3 className="text-xl font-bold">{editing ? "Sửa truyện" : "Thêm truyện"}</h3><Label>Tên truyện<Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Label><Label>Tác giả<Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></Label><Label>Thể loại<Input placeholder="Cổ trang, Xuyên sách" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} /></Label><Label>Lượt nghe ban đầu (Số ảo)<Input type="number" min="0" placeholder="Để trống để tự sinh 1.500 - 15.000" value={form.base_fake_views} onChange={(e) => setForm({ ...form, base_fake_views: e.target.value })} /></Label><Label>Mô tả<Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Label><Label>URL Audio R2<Input value={form.audio_url} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} /></Label><Label>URL Cover<Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} /></Label><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={loading}>Lưu</Button></div></form></div>}</div>
}
