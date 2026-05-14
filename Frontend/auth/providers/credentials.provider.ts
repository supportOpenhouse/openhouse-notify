import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { UserStatus } from '@/auth/types'
import { MAX_FAILED_ATTEMPTS, LOCKOUT_DURATION_MS } from '@/auth/constants'

/**
 * Email + password credentials provider.
 * - Validates credentials against the DB.
 * - Enforces account lockout after MAX_FAILED_ATTEMPTS.
 * - Never used in auth.config.ts (not Edge-compatible due to bcrypt + Prisma).
 */
export const credentialsProvider = Credentials({
  name: 'Email & Password',
  credentials: {
    email: { label: 'Email', type: 'email', placeholder: 'you@company.com' },
    password: { label: 'Password', type: 'password' },
  },
  async authorize(credentials) {
    const email = credentials?.email as string | undefined
    const password = credentials?.password as string | undefined

    if (!email || !password) return null

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) return null

    // Status checks
    if (user.status === UserStatus.SUSPENDED) throw new Error('ACCOUNT_SUSPENDED')
    if (user.status === UserStatus.DEACTIVATED) throw new Error('ACCOUNT_DEACTIVATED')

    // Lockout check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('ACCOUNT_LOCKED')
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      const newFailedCount = user.failedLoginAttempts + 1
      const shouldLock = newFailedCount >= MAX_FAILED_ATTEMPTS

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedCount,
          ...(shouldLock && {
            lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
          }),
        },
      })

      throw new Error(shouldLock ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS')
    }

    // Reset on success
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    })

    // Return only the fields NextAuth's User type requires.
    // With database sessions, the session callback receives the full Prisma
    // user (including role/status) via the adapter on every session read.
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    }
  },
})
