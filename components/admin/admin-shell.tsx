import NextLink from "next/link"
import {
  BookOpen,
  ChevronDown,
  FileAudio,
  LayoutDashboard,
  Link2,
  LogOut,
  Moon,
  PanelLeft,
  Settings,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const navigation = [
  { href: "/admin/audio", label: "Quản lý Audio", icon: FileAudio },
  { href: "/admin/affiliate", label: "Affiliate Shopee", icon: Link2 },
  { href: "/admin/users", label: "Thành viên", icon: Users },
  { href: "/admin/staffs", label: "Quản trị viên", icon: ShieldCheck },
  { href: "/admin/categories", label: "Thể loại", icon: Tags },
  { href: "/admin/settings", label: "Cài đặt", icon: Settings },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-background lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold leading-none">mê nghe truyện</div>
            <div className="mt-1 text-xs text-muted-foreground">Admin</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tổng quan</p>
          <NextLink href="/admin/analytics" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </NextLink>
          <p className="mb-3 mt-7 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quản lý</p>
          {navigation.map(({ href, label, icon: Icon }) => (
            <NextLink key={href} href={href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <Icon className="h-4 w-4" /> {label}
            </NextLink>
          ))}
        </nav>
        <div className="border-t p-4">
          <NextLink href="/" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
            <BookOpen className="h-4 w-4" /> Về trang nghe truyện
          </NextLink>
          <NextLink href="/login" className="mt-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
            <LogOut className="h-4 w-4" /> Đăng xuất
          </NextLink>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Mở menu"><PanelLeft className="h-5 w-5" /></Button>
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <Input placeholder="Tìm kiếm..." className="h-9 w-full bg-muted/50" />
            </div>
            <Button variant="ghost" size="icon" aria-label="Cài đặt"><Settings className="h-4 w-4" /></Button>
            <div className="hidden items-center gap-2 border-l pl-3 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">AD</div>
              <div className="hidden text-left xl:block"><div className="text-sm font-medium">Admin</div><div className="text-xs text-muted-foreground">Quản trị viên</div></div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
