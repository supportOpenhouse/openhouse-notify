import { Role, Resource, Action } from '@/auth/types'

// ============================================================
// ROLE → PERMISSION MATRIX
// Each role gets explicit permissions per resource.
// ============================================================

const ALL_ACTIONS = Object.values(Action)
const READ_ONLY: Action[] = [Action.READ, Action.VIEW]

export const ROLE_PERMISSIONS: Record<Role, Partial<Record<Resource, Action[]>>> = {
  [Role.SUPER_ADMIN]: {
    [Resource.CAMPAIGNS]: ALL_ACTIONS,
    [Resource.TEMPLATES]: ALL_ACTIONS,
    [Resource.ANALYTICS]: ALL_ACTIONS,
    [Resource.AUDIENCES]: ALL_ACTIONS,
    [Resource.SETTINGS]: ALL_ACTIONS,
    [Resource.USERS]: ALL_ACTIONS,
    [Resource.QUEUE_MONITOR]: ALL_ACTIONS,
    [Resource.TEST_NOTIFICATIONS]: ALL_ACTIONS,
  },

  [Role.ADMIN]: {
    [Resource.CAMPAIGNS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.APPROVE, Action.CANCEL, Action.VIEW],
    [Resource.TEMPLATES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.VIEW],
    [Resource.ANALYTICS]: [Action.READ, Action.VIEW, Action.EXPORT],
    [Resource.AUDIENCES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.VIEW],
    [Resource.SETTINGS]: [Action.READ, Action.UPDATE, Action.VIEW],
    [Resource.USERS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.VIEW],
    [Resource.QUEUE_MONITOR]: [Action.READ, Action.VIEW, Action.RETRY, Action.CANCEL],
    [Resource.TEST_NOTIFICATIONS]: [Action.CREATE, Action.READ, Action.VIEW],
  },

  [Role.MARKETING_MANAGER]: {
    [Resource.CAMPAIGNS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.APPROVE, Action.CANCEL, Action.VIEW],
    [Resource.TEMPLATES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.VIEW],
    [Resource.ANALYTICS]: [Action.READ, Action.VIEW, Action.EXPORT],
    [Resource.AUDIENCES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.VIEW],
    [Resource.SETTINGS]: READ_ONLY,
    [Resource.USERS]: READ_ONLY,
    [Resource.QUEUE_MONITOR]: READ_ONLY,
    [Resource.TEST_NOTIFICATIONS]: [Action.CREATE, Action.READ, Action.VIEW],
  },

  [Role.MARKETING_EXECUTIVE]: {
    [Resource.CAMPAIGNS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.VIEW],
    [Resource.TEMPLATES]: READ_ONLY,
    [Resource.ANALYTICS]: READ_ONLY,
    [Resource.AUDIENCES]: READ_ONLY,
    [Resource.SETTINGS]: [],
    [Resource.USERS]: [],
    [Resource.QUEUE_MONITOR]: [],
    [Resource.TEST_NOTIFICATIONS]: [Action.CREATE, Action.READ, Action.VIEW],
  },

  [Role.ANALYST]: {
    [Resource.CAMPAIGNS]: READ_ONLY,
    [Resource.TEMPLATES]: READ_ONLY,
    [Resource.ANALYTICS]: [Action.READ, Action.VIEW, Action.EXPORT],
    [Resource.AUDIENCES]: READ_ONLY,
    [Resource.SETTINGS]: [],
    [Resource.USERS]: [],
    [Resource.QUEUE_MONITOR]: READ_ONLY,
    [Resource.TEST_NOTIFICATIONS]: [],
  },

  [Role.VIEWER]: {
    [Resource.CAMPAIGNS]: [Action.READ],
    [Resource.TEMPLATES]: [Action.READ],
    [Resource.ANALYTICS]: [Action.READ, Action.VIEW],
    [Resource.AUDIENCES]: [Action.READ],
    [Resource.SETTINGS]: [],
    [Resource.USERS]: [],
    [Resource.QUEUE_MONITOR]: [],
    [Resource.TEST_NOTIFICATIONS]: [],
  },
}

// Route-level role access matrix
export const ROUTE_ROLE_MAP: Record<string, Role[]> = {
  '/admin': Object.values(Role),
  '/admin/campaigns': [Role.SUPER_ADMIN, Role.ADMIN, Role.MARKETING_MANAGER, Role.MARKETING_EXECUTIVE],
  '/admin/templates': [Role.SUPER_ADMIN, Role.ADMIN, Role.MARKETING_MANAGER],
  '/admin/analytics': [Role.SUPER_ADMIN, Role.ADMIN, Role.MARKETING_MANAGER, Role.MARKETING_EXECUTIVE, Role.ANALYST],
  '/admin/audience': [Role.SUPER_ADMIN, Role.ADMIN, Role.MARKETING_MANAGER],
  '/admin/settings': [Role.SUPER_ADMIN, Role.ADMIN],
  '/admin/queue': [Role.SUPER_ADMIN, Role.ADMIN],
  '/admin/test-notifications': [Role.SUPER_ADMIN, Role.ADMIN, Role.MARKETING_MANAGER, Role.MARKETING_EXECUTIVE],
}

// ============================================================
// PERMISSION HELPERS
// ============================================================

export function hasPermission(role: Role, resource: Resource, action: Action): boolean {
  const permissions = ROLE_PERMISSIONS[role]?.[resource] ?? []
  return permissions.includes(action)
}

export function getPermissions(role: Role, resource: Resource): Action[] {
  return ROLE_PERMISSIONS[role]?.[resource] ?? []
}

export function canAccessRoute(role: Role, pathname: string): boolean {
  // Find the most specific matching route
  const matchingRoute = Object.keys(ROUTE_ROLE_MAP)
    .filter((route) => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length)[0]

  if (!matchingRoute) return true // No restriction defined
  return ROUTE_ROLE_MAP[matchingRoute]?.includes(role) ?? false
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 6,
  [Role.ADMIN]: 5,
  [Role.MARKETING_MANAGER]: 4,
  [Role.MARKETING_EXECUTIVE]: 3,
  [Role.ANALYST]: 2,
  [Role.VIEWER]: 1,
}

export function hasHigherOrEqualRole(userRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole]
}
