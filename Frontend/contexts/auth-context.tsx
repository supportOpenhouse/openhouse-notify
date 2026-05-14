'use client'

import * as React from 'react'
import { useSession, signOut, signIn } from 'next-auth/react'
import { Role, UserStatus, Resource, Action } from '@/auth/types'
import { hasPermission } from '@/auth/permissions'

type AuthContextValue = {
  isHydrated: boolean
  isAuthenticated: boolean
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    role: Role
    status: UserStatus
  } | null
  userName: string | null
  userEmail: string | null
  userRole: Role | null
  userStatus: UserStatus | null
  sessionError: string | undefined
  logoutUser: () => void
  can: (resource: Resource, action: Action) => boolean
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const reauthTriggeredRef = React.useRef(false)

  React.useEffect(() => {
    if (session?.error !== 'RefreshAccessTokenError') {
      reauthTriggeredRef.current = false
      return
    }
    if (reauthTriggeredRef.current) return
    reauthTriggeredRef.current = true
    const callbackUrl =
      typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/'
    void signIn('google', { callbackUrl })
  }, [session?.error])

  const sessionUser = session?.user ?? null
  const userRole = (sessionUser?.role as Role) ?? null

  const logoutUser = React.useCallback(() => {
    signOut({ callbackUrl: '/login' })
  }, [])

  const can = React.useCallback(
    (resource: Resource, action: Action): boolean => {
      if (!userRole) return false
      return hasPermission(userRole, resource, action)
    },
    [userRole],
  )

  const value = React.useMemo((): AuthContextValue => {
    return {
      isHydrated: status !== 'loading',
      isAuthenticated: status === 'authenticated',
      user: sessionUser
        ? {
            id: sessionUser.id,
            name: sessionUser.name ?? null,
            email: sessionUser.email,
            image: sessionUser.image ?? null,
            role: sessionUser.role as Role,
            status: sessionUser.status as UserStatus,
          }
        : null,
      userName: sessionUser?.name ?? null,
      userEmail: sessionUser?.email ?? null,
      userRole,
      userStatus: (sessionUser?.status as UserStatus) ?? null,
      sessionError: session?.error,
      logoutUser,
      can,
    }
  }, [session, status, sessionUser, userRole, logoutUser, can])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthContextProvider')
  }
  return ctx
}
