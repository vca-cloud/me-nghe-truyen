import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-background py-8 text-sm text-muted-foreground">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex w-full flex-col items-center justify-center gap-3 text-center">
          <Link href="/about" className="hover:text-foreground hover:underline">
            Read me
          </Link>
          <div>
            Email: {" "}
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