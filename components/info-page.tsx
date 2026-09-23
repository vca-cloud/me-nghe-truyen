import type { ReactNode } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const CONTACT_EMAIL = "metruyensupportteam@gmail.com"

export function BrandName() {
  return (
    <span className="whitespace-nowrap font-bold tracking-tight text-foreground">
      <span className="text-[#EE4D2D]">mê</span> nghe truyện
    </span>
  )
}

export function ContactLink() {
  return (
    <Link className="font-medium underline underline-offset-4 hover:text-primary" href="/contact">
      trang Liên hệ
    </Link>
  )
}

export function InfoPage({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8">
        <article className="space-y-10 text-foreground">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          {children}
        </article>
      </main>
      <Footer />
    </div>
  )
}
