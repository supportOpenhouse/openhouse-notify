"use client"

import * as React from "react"

type DashboardLayoutShellProps = {
  children: React.ReactNode
  sidebar: (args: {
    collapsed: boolean
    closeMobile: () => void
    toggleSidebar: () => void
    isMobile: boolean
  }) => React.ReactNode
  navbar: (args: { openMobileSidebar: () => void; collapsed: boolean }) => React.ReactNode
}

export function DashboardLayoutShell({ children, sidebar, navbar }: DashboardLayoutShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  const toggleSidebar = React.useCallback(() => {
    setSidebarCollapsed((current) => !current)
  }, [])

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="w-full px-0">
        {mobileSidebarOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close sidebar overlay"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[84vw] max-w-[300px] border-r border-border bg-card p-3">
              <div
                onClickCapture={(e) => {
                  const el = e.target as HTMLElement | null
                  // Capture runs before children: exclude controls that must keep the drawer mounted
                  // for one more tick (e.g. Log out) so their onClick still runs.
                  if (el?.closest?.('[data-no-mobile-sidebar-close]')) return
                  setMobileSidebarOpen(false)
                }}
              >
                {sidebar({
                  collapsed: false,
                  closeMobile: () => setMobileSidebarOpen(false),
                  toggleSidebar: () => setMobileSidebarOpen(false),
                  isMobile: true,
                })}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid min-h-screen gap-0 lg:grid-cols-[auto_1fr]">
          <aside
            className={`hidden border-r border-border bg-card transition-all lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto ${
              sidebarCollapsed ? "lg:w-[76px]" : "lg:w-[248px]"
            }`}
          >
            {sidebar({
              collapsed: sidebarCollapsed,
              closeMobile: () => setMobileSidebarOpen(false),
              toggleSidebar,
              isMobile: false,
            })}
          </aside>

          <div className="min-w-0">
            <div className="sticky top-0 z-30 border-b border-border bg-card px-3 py-2 sm:px-4 lg:px-5">
              {navbar({
                openMobileSidebar: () => setMobileSidebarOpen(true),
                collapsed: sidebarCollapsed,
              })}
            </div>

            <main className="min-w-0 space-y-3 p-3 sm:p-4 lg:p-5">{children}</main>
          </div>
        </div>
      </div>
    </div>
  )
}
