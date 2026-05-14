"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { LaptopMinimal, Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

type ThemeMode = "light" | "dark" | "system"

const order: ThemeMode[] = ["system", "light", "dark"]

function nextMode(current: string | undefined): ThemeMode {
  const mode = (current === "light" || current === "dark" || current === "system" ? current : "system") as ThemeMode
  return order[(order.indexOf(mode) + 1) % order.length] ?? "system"
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Before mount, render the button shell with a fixed placeholder icon so
  // the server HTML and the initial client render match exactly (no hydration mismatch).
  if (!mounted) {
    return (
      <Button type="button" variant="outline" size="sm" className={className} disabled>
        <LaptopMinimal className="size-4" />
        <span className="ml-2 hidden sm:inline">System</span>
      </Button>
    )
  }

  const icon =
    theme === "dark" ? <Moon className="size-4" /> : theme === "light" ? <Sun className="size-4" /> : <LaptopMinimal className="size-4" />

  const label = theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System"

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={() => setTheme(nextMode(theme))}
      title="Toggle theme (system/light/dark)"
    >
      {icon}
      <span className="ml-2 hidden sm:inline">{label}</span>
    </Button>
  )
}

