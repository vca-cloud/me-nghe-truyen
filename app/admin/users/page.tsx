"use client"

import { useEffect, useState } from "react"
import { Eye, Lock, Unlock, Pencil, Plus, Trash2 } from "lucide-react"
import { AdminShell } from "@/components/admin/admin-shell"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

type User = { id: number; name: string; email: string; register: string; plays: string; package: "Free" | "VIP"; locked: boolean }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState({ name: "", email: "", package: "Free" as User["package"] })

  const load = async () => {
    const { data, error } = await supabase.from("admin_users").select("*").order("id")
    if (error) toast.error(`Lỗi tải thành viên: ${error.message}`)
    else setUsers(data || [])
  }

  useEffect(() => {
    void load()
  }, [])

  const save = async () => {
    const name = form.name.trim()
    const email = form.email.trim()
    if (!name || !email) return

    const result = editing
      ? await supabase.from("admin_users").update({ name, email, package: form.package }).eq("id", editing.id)
      : await supabase.from("admin_users").insert({ name, email, package: form.package })

    if (result.error) {
      toast.error(`Lỗi lưu: ${result.error.message}`)
      return
    }
    toast.success("Đã lưu thành viên")
    setOpen(false)
    await load()
  }

  const toggle = async (user: User) => {
    const { error } = await supabase.from("admin_users").update({ locked: !user.locked }).eq("id", user.id)
    if (error) toast.error(error.message)
    else await load()
  }

  const remove = async (user: User) => {
    if (!confirm(`Xóa thành viên ${user.name}?`)) return
    const { error } = await supabase.from("admin_users").delete().eq("id", user.id)
    if (error) toast.error(`Lỗi xóa: ${error.message}`)
    else {
      toast.success("Đã xóa thành viên")
      await load()
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Danh sách Thành viên</h1>
          <Button onClick={() => { setEditing(null); setForm({ name: "", email: "", package: "Free" }); setOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Thêm thành viên
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ngày đăng ký</TableHead>
              <TableHead>Lượt nghe</TableHead>
              <TableHead>Gói</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.register}</TableCell>
                <TableCell>{user.plays}</TableCell>
                <TableCell>
                  <Badge variant={user.package === "VIP" ? "default" : "outline"}>{user.package}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.locked ? "secondary" : "default"}>{user.locked ? "Đã khóa" : "Hoạt động"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(user)
                        setForm({ name: user.name, email: user.email, package: user.package })
                        setOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => void toggle(user)}>
                      {user.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => void remove(user)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Sửa thành viên" : "Thêm thành viên"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Tên</Label>
                <Input
                  id="user-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-package">Gói</Label>
                <Select value={form.package} onValueChange={(value) => setForm({ ...form, package: value as User["package"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Free">Free</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button onClick={() => void save()}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  )
}
