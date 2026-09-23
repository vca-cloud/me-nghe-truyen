import Link from "next/link"

const footerLinks = [
  { href: "/about", label: "Giới thiệu" },
  { href: "/privacy", label: "Chính sách bảo mật" },
  { href: "/terms", label: "Điều khoản sử dụng" },
  { href: "/contact", label: "Liên hệ" },
]

export function Footer() {
  return (
    <footer className="border-t bg-background py-8 text-sm text-muted-foreground">
      <div className="container mx-auto px-4 md:px-8">
        <nav className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-base font-bold hover:text-foreground hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
