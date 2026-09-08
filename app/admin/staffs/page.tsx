"use client"

import { useEffect, useState } from "react"
import { Edit, Lock, Unlock, Plus, Trash2 } from "lucide-react"
import { AdminShell } from "@/components/admin/admin-shell"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

type Staff = { id: number; name: string; email: string; locked: boolean }
export default function StaffsPage() {
  const [staffs, setStaffs] = useState<Staff[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [form, setForm] = useState({ name: "", email: "", password: "" })

  const load = async () => {
    const { data, error } = await supabase.from("staffs").select("*").order("id")
    if (error) toast.error(`Lỗi tải quản trị viên: ${error.message}`)
    else setStaffs(data || [])
  }

  useEffect(() => {
    void load()
  }, [])

  const save = async () => {
    const name = form.name.trim()
    const email = form.email.trim()
    const password = form.password.trim()

    if (!name || !email) {
      toast.error("Vui lòng nhập đầy đủ tên và email")
      return
    }

    if (!editing && !password) {
      toast.error("Vui lòng nhập mật khẩu")
      return
    }

    const result = editing
      ? await supabase.from("staffs").update({ name, email, ...(password ? { password } : {}) }).eq("id", editing.id)
      : await supabase.from("staffs").insert({ name, email, password })

    if (result.error) {
      toast.error(`Lỗi lưu: ${result.error.message}`)
      return
    }

    toast.success("Đã lưu quản trị viên")
    setDialogOpen(false)
    setForm({ name: "", email: "", password: "" })
    await load()
  }

  const toggle = async (staff: Staff) => {
    const { error } = await supabase.from("staffs").update({ locked: !staff.locked }).eq("id", staff.id)
    if (error) toast.error(error.message)
    else await load()
  }

  const remove = async (staff: Staff) => {
    if (!confirm(`Xóa quản trị viên ${staff.name}?`)) return
    const { error } = await supabase.from("staffs").delete().eq("id", staff.id)
    if (error) toast.error(`Lỗi xóa: ${error.message}`)
    else {
      toast.success("Đã xóa quản trị viên")
      await load()
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Quản lý Quản trị viên</h1>
          <Button
            onClick={() => {
              setEditing(null)
              setForm({ name: "", email: "", password: "" })
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm admin
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Admin</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffs.map((staff) => (
              <TableRow key={staff.id}>
                <TableCell>{staff.name}</TableCell>
                <TableCell>{staff.email}</TableCell>
                <TableCell>
                  <Badge variant={staff.locked ? "secondary" : "default"}>
                    {staff.locked ? "Khóa" : "Hoạt động"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(staff)
                        setForm({ name: staff.name, email: staff.email, password: "" })
                        setDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => void toggle(staff)}>
                      {staff.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => void remove(staff)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa quản trị viên" : "Thêm quản trị viên"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Tên</Label>
              <Input id="staff-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-password">Mật khẩu{editing ? " mới (để trống nếu giữ nguyên)" : ""}</Label>
              <Input
                id="staff-password"
                type="password"
                value={form.password}
                placeholder={editing ? "Nhập mật khẩu mới nếu muốn đổi" : "Nhập mật khẩu"}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void save()}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
