"use client"

import { useEffect, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"

type Theme = "light" | "dark"

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  return () => observer.disconnect()
}

const readTheme = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light")

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme | null>(subscribe, readTheme, () => null)

  useEffect(() => {
    const stored = localStorage.getItem("theme")
    const dark = stored === "dark" || (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    document.documentElement.classList.toggle("dark", dark)
  }, [])

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark"
    document.documentElement.classList.toggle("dark", next === "dark")
    localStorage.setItem("theme", next)
  }

  if (!theme) {
    return <Button variant="ghost" size="icon" aria-label="Đổi giao diện"><Sun className="h-4 w-4" /></Button>
  }

  return (
    <Button variant="ghost" size="icon" aria-label="Đổi giao diện" onClick={toggle}>
      {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
