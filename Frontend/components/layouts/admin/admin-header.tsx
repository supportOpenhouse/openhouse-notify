"use client"

import Image from "next/image"
import { Menu, Search } from "lucide-react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAppDispatch } from "@/store/hooks"
import { toggleCommandPalette } from "@/store/slices/ui-slice"

type AdminHeaderProps = {
  openMobileSidebar: () => void
}

export function AdminHeader({ openMobileSidebar }: AdminHeaderProps) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        dispatch(toggleCommandPalette())
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [dispatch])

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <Button type="button" variant="outline" size="icon-sm" className="lg:hidden" onClick={openMobileSidebar}>
          <Menu className="size-4" />
        </Button>
        <div className="flex h-8 items-center">
          <Image
            src="/images/OH_Black.svg"
            alt="Openhouse"
            width={32}
            height={32}
            className="h-8 w-auto dark:invert"
            priority
            unoptimized
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden gap-2 text-muted-foreground sm:flex"
          onClick={() => dispatch(toggleCommandPalette())}
        >
          <Search className="size-3.5" />
          <span className="text-xs">Search…</span>
          <kbd className="pointer-events-none ml-2 hidden select-none rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline-flex">
            ⌘K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="sm:hidden"
          onClick={() => dispatch(toggleCommandPalette())}
        >
          <Search className="size-4" />
        </Button>
        <ThemeToggle className="w-fit" />
      </div>
    </header>
  )
}
