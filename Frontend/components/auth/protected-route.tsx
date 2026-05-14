'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Role, UserStatus } from '@/auth/types'

type ProtectedRouteProps = {
  children: React.ReactNode
  allowedRoles?: Role[]
}

/**
 * Secondary client-side guard.
 * Primary protection is handled by root `proxy.ts` at the Edge.
 * This component adds role-level UX gating and account-status checks.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  React.useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.replace('/login')
      return
    }

    const userStatus = session?.user?.status as UserStatus | undefined
    if (userStatus === UserStatus.SUSPENDED || userStatus === UserStatus.DEACTIVATED) {
      router.replace(`/auth/error?error=${userStatus}`)
      return
    }

    const userRole = session?.user?.role as Role | undefined
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
      router.replace('/auth/error?error=INSUFFICIENT_ROLE')
    }
  }, [status, session, allowedRoles, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  const userRole = session?.user?.role as Role | undefined
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) return null

  return <>{children}</>
}
