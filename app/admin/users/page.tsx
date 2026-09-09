"use client"

import { useEffect, useState } from "react"
import { Eye, Lock, Unlock, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"
import { AdminShell } from "@/components/admin/admin-shell"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type User = {
  auth_id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  register: string;
  plays: string;
  package: "Free" | "VIP";
  locked: boolean;
  created_at?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState({ name: "", email: "", package: "Free" as User["package"] })
  const [submitting, setSubmitting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" })
      const result = await response.json()

      if (!response.ok) {
        console.error("API Error:", result.error)
        throw new Error(result.error || "Không tải được danh sách thành viên")
      }

      console.log("Users loaded:", result.users)
      setUsers(result.users || [])
    } catch (error) {
      console.error("Lỗi tải thành viên:", error)
      toast.error(error instanceof Error ? error.message : "Lỗi tải thành viên")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const syncFromAuth = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/admin/users/sync", { method: "POST" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Không đồng bộ được thành viên")
      toast.success(`Đã đồng bộ ${result.count || 0} thành viên từ Auth`)
      await load()
    } catch (error) {
      console.error("Lỗi đồng bộ Auth:", error)
      toast.error(error instanceof Error ? error.message : "Lỗi đồng bộ Auth")
    } finally {
      setSyncing(false)
    }
  }

  const handleAddUser = async () => {
    const name = form.name.trim()
    const email = form.email.trim()
    if (!name || !email) {
      toast.error("Tên và email không được để trống")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, package: form.package })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Lỗi thêm thành viên")
      }

      toast.success("Đã thêm thành viên mới")
      setOpen(false)
      setForm({ name: "", email: "", package: "Free" })
      await load()
    } catch (error) {
      console.error("Lỗi thêm user:", error)
      toast.error(error instanceof Error ? error.message : "Lỗi thêm thành viên")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditUser = async () => {
    const name = form.name.trim()
    const email = form.email.trim()
    if (!name || !email || !editing) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth_id: editing.auth_id, name, email, package: form.package })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Lỗi sửa thành viên")
      }

      toast.success("Đã cập nhật thành viên")
      setOpen(false)
      setEditing(null)
      await load()
    } catch (error) {
      console.error("Lỗi sửa user:", error)
      toast.error(error instanceof Error ? error.message : "Lỗi sửa thành viên")
    } finally {
      setSubmitting(false)
    }
  }

  const save = async () => {
    if (editing) {
      await handleEditUser()
    } else {
      await handleAddUser()
    }
  }

  const toggle = async (user: User) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth_id: user.auth_id, name: user.name, email: user.email, package: user.package, locked: !user.locked })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Lỗi toggle locked")
      }

      await load()
    } catch (error) {
      console.error("Lỗi toggle locked:", error)
      toast.error(error instanceof Error ? error.message : "Lỗi toggle locked")
    }
  }

  const remove = async (user: User) => {
    if (!confirm(`Xóa thành viên ${user.name}?`)) return

    try {
      const response = await fetch(`/api/admin/users?auth_id=${encodeURIComponent(user.auth_id)}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Lỗi xóa thành viên")
      }

      toast.success("Đã xóa thành viên")
      await load()
    } catch (error) {
      console.error("Lỗi xóa user:", error)
      toast.error(error instanceof Error ? error.message : "Lỗi xóa thành viên")
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Danh sách Thành viên</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void syncFromAuth()} disabled={syncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} /> Đồng bộ từ Auth
            </Button>
            <Button onClick={() => { setEditing(null); setForm({ name: "", email: "", package: "Free" }); setOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" /> Thêm thành viên
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">Đang tải...</div>
        ) : users.length === 0 ? (
          <div className="flex justify-center py-8 text-muted-foreground">Chưa có thành viên nào</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avatar</TableHead>
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
                <TableRow key={user.auth_id}>
                  <TableCell>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        {user.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </TableCell>
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
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => void toggle(user)}
                      >
                        {user.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => void remove(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

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
              <Button onClick={save} disabled={submitting}>
                {submitting ? "Đang lưu..." : editing ? "Lưu" : "Thêm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  )
}
