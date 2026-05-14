"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  BarChart3,
  BellRing,
  ChevronsLeft,
  ChevronsRight,
  FlaskConical,
  LayoutDashboard,
  ListChecks,
  LogOut,
  SendHorizontal,
  Settings2,
  Users,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { useAuthContext } from "@/contexts/auth-context"

const PRIMARY_NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Campaigns", icon: SendHorizontal, href: "/admin/campaigns" },
  { label: "New Campaign", icon: Zap, href: "/admin/campaigns/new" },
  { label: "Audience", icon: Users, href: "/admin/audience" },
  { label: "Templates", icon: BellRing, href: "/admin/templates" },
]

const SECONDARY_NAV = [
  { label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
  { label: "Queue Monitor", icon: ListChecks, href: "/admin/queue" },
  { label: "Test Notifications", icon: FlaskConical, href: "/admin/test-notifications" },
  { label: "Settings", icon: Settings2, href: "/admin/settings" },
]

type NavItemProps = {
  label: string
  icon: React.ElementType
  href: string
  active: boolean
  collapsed: boolean
}

function NavItem({ label, icon: Icon, href, active, collapsed }: NavItemProps) {
  const item = (
    <Link
      href={href}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className={cn("size-4 shrink-0", active && "text-primary-foreground")} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{item}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return item
}

type AdminSidebarProps = {
  collapsed?: boolean
  toggleSidebar?: () => void
  isMobile?: boolean
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"

function BackendStatus({ collapsed, isMobile }: { collapsed: boolean; isMobile: boolean }) {
  const { data, isError, isFetching } = useQuery({
    queryKey: ["backend-health"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/health`, { credentials: "include" })
      if (!res.ok) throw new Error("unhealthy")
      return res.json()
    },
    refetchInterval: 30_000,
    retry: false,
  })

  if (collapsed || isMobile) return null

  const connected = !!data && !isError
  const label = isFetching ? "Checking…" : connected ? "Backend connected" : "Backend not connected"
  const dotClass = isFetching
    ? "bg-amber-400 animate-pulse"
    : connected
      ? "bg-emerald-500"
      : "bg-red-500"

  return (
    <div className="shrink-0 border-t border-border">
      <div className="border-b border-border p-3">
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
          <span className={`size-2 shrink-0 rounded-full ${dotClass}`} />
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-foreground">API</p>
            <p className="truncate text-[11px] text-muted-foreground">{label}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminSidebar({ collapsed = false, toggleSidebar, isMobile = false }: AdminSidebarProps) {
  const pathname = usePathname()
  const { logoutUser } = useAuthContext()

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="flex h-full flex-col bg-card text-card-foreground">
        {/* Header */}
        <div className="flex h-12 items-center justify-between border-b border-border px-3">
          {!collapsed && (
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Notification Hub
            </p>
          )}
          {!isMobile && (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={toggleSidebar}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={collapsed ? "mx-auto" : ""}
            >
              {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
            </Button>
          )}
        </div>

        {/* Primary nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {PRIMARY_NAV.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}

          <div className="py-2">
            <Separator />
          </div>

          {SECONDARY_NAV.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="mt-auto">
          <BackendStatus collapsed={collapsed} isMobile={isMobile} />

          <div className="p-2">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center px-2"
                    data-no-mobile-sidebar-close
                    onClick={() => logoutUser()}
                  >
                    <LogOut className="size-4" />
                    <span className="sr-only">Log out</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Log out</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                data-no-mobile-sidebar-close
                onClick={() => logoutUser()}
              >
                <LogOut className="size-4 shrink-0" />
                <span>Log out</span>
              </Button>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
