'use client'

import * as React from 'react'

import { AdminHeader } from '@/components/layouts/admin/admin-header'
import { AdminSidebar } from '@/components/layouts/admin/admin-sidebar'
import { DashboardLayoutShell } from '@/components/layouts/dashboard-layout-shell'

/**
 * Admin area layout.
 * Authentication is enforced by root `proxy.ts` before this renders.
 * Role-level guards are applied per-page via requireRole() or ProtectedRoute.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayoutShell
      sidebar={({ collapsed, toggleSidebar, isMobile }) => (
        <AdminSidebar collapsed={collapsed} toggleSidebar={toggleSidebar} isMobile={isMobile} />
      )}
      navbar={({ openMobileSidebar }) => <AdminHeader openMobileSidebar={openMobileSidebar} />}
    >
      {children}
    </DashboardLayoutShell>
  )
}
