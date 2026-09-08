import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-background py-8 text-sm text-muted-foreground">
      <div className="container px-4 md:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link href="/about" className="hover:text-foreground hover:underline">
              Về chúng tôi
            </Link>
            <span>|</span>
            <Link href="/privacy" className="hover:text-foreground hover:underline">
              Chính sách bảo mật
            </Link>
            <span>|</span>
            <Link href="/copyright" className="hover:text-foreground hover:underline">
              Quyền tác giả
            </Link>
          </div>
          <div>
            Email:{" "}
            <a
              href="mailto:venturecreativeagency@gmail.com"
              className="hover:text-foreground hover:underline"
            >
              venturecreativeagency@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}