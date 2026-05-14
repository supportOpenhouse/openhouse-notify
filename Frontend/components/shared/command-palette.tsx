"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BarChart3, BellRing, Layout, LayoutDashboard, ListChecks, SendHorizontal, Settings2, Users, Zap } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { closeCommandPalette } from "@/store/slices/ui-slice"

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin", group: "Navigate" },
  { label: "Campaigns", icon: SendHorizontal, href: "/admin/campaigns", group: "Navigate" },
  { label: "New Campaign", icon: Zap, href: "/admin/campaigns/new", group: "Navigate" },
  { label: "Audience", icon: Users, href: "/admin/audience", group: "Navigate" },
  { label: "Templates", icon: BellRing, href: "/admin/templates", group: "Navigate" },
  { label: "Analytics", icon: BarChart3, href: "/admin/analytics", group: "Navigate" },
  { label: "Queue Monitor", icon: ListChecks, href: "/admin/queue", group: "Navigate" },
  { label: "Test Notifications", icon: Layout, href: "/admin/test-notifications", group: "Navigate" },
  { label: "Settings", icon: Settings2, href: "/admin/settings", group: "Navigate" },
]

export function CommandPalette() {
  const open = useAppSelector((s) => s.ui.commandPaletteOpen)
  const dispatch = useAppDispatch()
  const router = useRouter()

  const handleSelect = (href: string) => {
    router.push(href)
    dispatch(closeCommandPalette())
  }

  return (
    <CommandDialog open={open} onOpenChange={(o) => !o && dispatch(closeCommandPalette())}>
      <CommandInput placeholder="Search pages, campaigns, templates…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {["Navigate"].map((group) => (
          <CommandGroup key={group} heading={group}>
            {NAV_ITEMS.filter((i) => i.group === group).map((item) => (
              <CommandItem key={item.href} onSelect={() => handleSelect(item.href)}>
                <item.icon className="size-4 text-muted-foreground" />
                <span>{item.label}</span>
                <CommandShortcut>↵</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => handleSelect("/admin/campaigns/new")}>
            <Zap className="size-4 text-primary" />
            <span>Create New Campaign</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
