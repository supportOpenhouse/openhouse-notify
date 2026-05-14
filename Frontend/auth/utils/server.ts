import { auth } from '@/auth/auth'
import { Role } from '@/auth/types'
import { ROLE_HIERARCHY } from '@/auth/permissions'

/**
 * Get the current session server-side.
 * Returns null if unauthenticated.
 */
export async function getSession() {
  return auth()
}

/**
 * Get the current user server-side. Returns null if unauthenticated.
 */
export async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}

/**
 * Check if the current user has at least the given role rank.
 */
export async function hasMinRole(minRole: Role): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.role) return false
  return ROLE_HIERARCHY[session.user.role as Role] >= ROLE_HIERARCHY[minRole]
}
