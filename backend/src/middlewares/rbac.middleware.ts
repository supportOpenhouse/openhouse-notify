import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '@shared/errors';

// Mirror the Role enum from the frontend auth/types
// (both read from the same DB column)
export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MARKETING_MANAGER: 'MARKETING_MANAGER',
  MARKETING_EXECUTIVE: 'MARKETING_EXECUTIVE',
  ANALYST: 'ANALYST',
  VIEWER: 'VIEWER',
} as const;

export type RoleValue = (typeof Role)[keyof typeof Role];

const ROLE_RANK: Record<RoleValue, number> = {
  SUPER_ADMIN: 6,
  ADMIN: 5,
  MARKETING_MANAGER: 4,
  MARKETING_EXECUTIVE: 3,
  ANALYST: 2,
  VIEWER: 1,
};

/**
 * Requires the caller to have at least one of the specified roles.
 * Must be used after requireSession().
 *
 * @example
 * router.delete('/campaigns/:id', requireSession, requireRole(['ADMIN', 'SUPER_ADMIN']), handler)
 */
export function requireRole(allowedRoles: RoleValue[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userRole = req.userRole as RoleValue | undefined;

    if (!userRole) {
      return next(new ForbiddenError('No role on session', 'NO_ROLE'));
    }

    if (!allowedRoles.includes(userRole)) {
      return next(
        new ForbiddenError(
          `Role '${userRole}' is not permitted for this resource. Required: ${allowedRoles.join(', ')}`,
          'INSUFFICIENT_ROLE',
        ),
      );
    }

    next();
  };
}

/**
 * Requires the caller's role rank to be at or above the given minimum role.
 * SUPER_ADMIN (6) > ADMIN (5) > MARKETING_MANAGER (4) > ...
 *
 * @example
 * router.get('/settings', requireSession, requireMinRole('ADMIN'), handler)
 */
export function requireMinRole(minRole: RoleValue) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userRole = req.userRole as RoleValue | undefined;

    if (!userRole) {
      return next(new ForbiddenError('No role on session', 'NO_ROLE'));
    }

    const userRank = ROLE_RANK[userRole] ?? 0;
    const minRank = ROLE_RANK[minRole] ?? 0;

    if (userRank < minRank) {
      return next(
        new ForbiddenError(
          `Role '${userRole}' does not meet minimum required role '${minRole}'`,
          'INSUFFICIENT_ROLE',
        ),
      );
    }

    next();
  };
}
