import { redirect } from 'next/navigation'
import { auth } from '@/auth/auth'
import { Role, UserStatus, Resource, Action } from '@/auth/types'
import { hasPermission, canAccessRoute } from '@/auth/permissions'
import { AUTH_ROUTES } from '@/auth/constants'

// ============================================================
// SERVER-SIDE GUARDS (Server Components / Route Handlers)
// ============================================================

/**
 * Requires an authenticated session. Redirects to login if not.
 * Use at the top of Server Components or Server Actions.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect(AUTH_ROUTES.SIGN_IN)
  }
  if (session.user.status === UserStatus.SUSPENDED) {
    redirect(`${AUTH_ROUTES.ERROR}?error=ACCOUNT_SUSPENDED`)
  }
  if (session.user.status === UserStatus.DEACTIVATED) {
    redirect(`${AUTH_ROUTES.ERROR}?error=ACCOUNT_DEACTIVATED`)
  }
  return session
}

/**
 * Requires the user to have at least one of the specified roles.
 */
export async function requireRole(allowedRoles: Role[]) {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.user.role as Role)) {
    redirect(`${AUTH_ROUTES.ERROR}?error=INSUFFICIENT_ROLE`)
  }
  return session
}

/**
 * Requires permission for a specific resource + action.
 */
export async function requirePermission(resource: Resource, action: Action) {
  const session = await requireAuth()
  const role = session.user.role as Role
  if (!hasPermission(role, resource, action)) {
    redirect(`${AUTH_ROUTES.ERROR}?error=INSUFFICIENT_PERMISSIONS`)
  }
  return session
}

/**
 * Requires SUPER_ADMIN or ADMIN role.
 */
export async function requireAdmin() {
  return requireRole([Role.SUPER_ADMIN, Role.ADMIN])
}

/**
 * Requires SUPER_ADMIN role only.
 */
export async function requireSuperAdmin() {
  return requireRole([Role.SUPER_ADMIN])
}

// ============================================================
// CLIENT-SIDE GUARD HELPERS (use with useSession)
// ============================================================

export function checkPermission(role: Role, resource: Resource, action: Action): boolean {
  return hasPermission(role, resource, action)
}

export function checkRole(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole)
}

export function checkRouteAccess(role: Role, pathname: string): boolean {
  return canAccessRoute(role, pathname)
}
