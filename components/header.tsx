"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase-client"
import type { User } from "@supabase/supabase-js"

export function Header({ value = "", onChange = () => {}, onKeyDown = () => {}, suggestions = [], onSuggestion = () => {} }: { value?: string; onChange?: (value: string) => void; onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void; suggestions?: any[]; onSuggestion?: (story: any) => void }) {
  const [user, setUser] = useState<User | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let active = true
    void supabase.auth.getSession().then(({ data }) => { if (active) setUser(data.session?.user ?? null) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Tài khoản"
  const avatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  const showAvatar = !!avatar
  const initials = (displayName || "U").slice(0, 2).toUpperCase()
  const avatarUrl = showAvatar ? avatar : ""

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex min-h-14 flex-wrap items-center gap-2 px-3 py-2 sm:flex-nowrap sm:px-4">
        <div className="flex items-center"><Link href="/" className="text-4xl font-bold tracking-tight"><span style={{ color: "#EE4D2D" }}>mê</span> nghe truyện</Link></div>
        <div className="relative z-[60] flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => { if (suggestions.length) onChange(value) }}
              placeholder="Tìm truyện, tác giả, thể loại..."
              className="pl-9 w-full rounded-full bg-muted/50"
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 z-[70] mt-1 w-full rounded-xl border border-input bg-background p-1 shadow-lg max-h-64 overflow-auto">
                {suggestions.map((story, i) => (
                  <button
                    key={story.id ?? i}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault()
                      onSuggestion(story)
                    }}
                    className="block w-full rounded-lg px-4 py-2.5 text-left text-sm hover:bg-accent"
                  >
                    <div className="font-medium">{story.title}</div>
                    {story.genre ? <div className="text-xs text-muted-foreground">{story.genre}</div> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user
            ? <button type="button" onClick={() => void signOut()} className="flex items-center gap-2 rounded-md border px-2 py-1 text-xs hover:bg-muted" title="Đăng xuất">
                {showAvatar ? <img src={avatarUrl} alt={displayName} className="h-6 w-6 rounded-full object-cover" /> : <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium">{initials}</span>}
                <span className="max-w-28 truncate">{displayName}</span>
              </button>
            : <>
                <Link href="/login" className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium hover:bg-muted">Đăng nhập</Link>
                <Link href="/signup" className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">Đăng ký</Link>
              </>
          }
        </div>
      </div>
    </header>
  )
}
