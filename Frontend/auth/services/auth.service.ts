import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { Role, UserStatus } from '@/auth/types'

const BCRYPT_ROUNDS = 12

/**
 * Create a new user with a hashed password (credentials sign-up).
 * Throws if email is already taken.
 */
export async function createUser(params: {
  name: string
  email: string
  password: string
  role?: Role
}) {
  const existing = await prisma.user.findUnique({ where: { email: params.email } })
  if (existing) throw new Error('EMAIL_ALREADY_EXISTS')

  const hashedPassword = await bcrypt.hash(params.password, BCRYPT_ROUNDS)

  return prisma.user.create({
    data: {
      name: params.name,
      email: params.email,
      password: hashedPassword,
      role: params.role ?? Role.VIEWER,
      status: UserStatus.ACTIVE,
    },
  })
}

/**
 * Update a user's role. Validates caller has sufficient rank.
 */
export async function updateUserRole(userId: string, newRole: Role) {
  return prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  })
}

/**
 * Suspend a user account.
 *
 * Deletes NextAuth **database** `Session` rows (used if you ever switch to database
 * sessions). The app currently uses **JWT sessions** (encrypted cookie): those are
 * not stored in `Session`, so suspension takes effect for JWT users after the next
 * JWT refresh (see throttled DB sync in the jwt callback) or when the cookie expires.
 */
export async function suspendUser(userId: string) {
  await prisma.session.deleteMany({ where: { userId } })
  return prisma.user.update({
    where: { id: userId },
    data: { status: UserStatus.SUSPENDED },
  })
}

/**
 * Reactivate a suspended or deactivated account.
 */
export async function reactivateUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      status: UserStatus.ACTIVE,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  })
}

/**
 * Deletes all NextAuth **database** `Session` rows for the user.
 * Does not by itself clear **JWT** cookies on browsers; pair with operational
 * logout or shorter `session.maxAge` if you need immediate JWT invalidation.
 */
export async function revokeAllSessions(userId: string) {
  return prisma.session.deleteMany({ where: { userId } })
}

/**
 * Revoke a single **database** session row by opaque session token (database strategy).
 * Ignores JWT-only sessions.
 */
export async function revokeSession(sessionToken: string) {
  return prisma.session.delete({ where: { sessionToken } }).catch(() => null)
}

/**
 * List all active sessions for a user.
 */
export async function getUserSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId, isRevoked: false, expires: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Write an audit log entry.
 */
export async function writeAuditLog(params: {
  userId?: string
  action: string
  resource?: string
  resourceId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}) {
  const { userId, metadata, ...rest } = params
  return prisma.auditLog
    .create({
      data: {
        ...rest,
        // JSON round-trip converts Record<string,unknown> to a plain
        // JSON-serialisable value that Prisma's Json field accepts
        ...(metadata !== undefined && {
          metadata: JSON.parse(JSON.stringify(metadata)),
        }),
        ...(userId ? { user: { connect: { id: userId } } } : {}),
      },
    })
    .catch(() => null)
}
