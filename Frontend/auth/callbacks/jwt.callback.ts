import type { Account, User } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import type { AdapterUser } from '@auth/core/adapters'
import { prisma } from '@/lib/prisma'
import { JWT_CLAIMS_SYNC_INTERVAL_MS } from '@/auth/constants'
import { refreshGoogleAccessTokenSingleFlight } from '@/auth/services/google-oauth-refresh'
import { Role, UserStatus } from '@/auth/types'

type JwtParams = {
  token: JWT
  user?: User | AdapterUser
  account?: Account | null
}

/**
 * Populates and maintains the JWT: app claims, Google OAuth rotation, and
 * throttled role/status sync from the database.
 */
export async function jwtCallback({ token, user, account }: JwtParams): Promise<JWT> {
  if (account?.provider === 'google') {
    token.oauthProvider = 'google'
    token.error = undefined
    if (account.access_token) {
      token.accessToken = account.access_token
    }
    if (account.refresh_token) {
      token.refreshToken = account.refresh_token
    }
    if (account.expires_at != null) {
      token.accessTokenExpires = account.expires_at * 1000
    } else if (account.expires_in != null) {
      token.accessTokenExpires = Date.now() + account.expires_in * 1000
    } else {
      token.accessTokenExpires = Date.now() + 3600 * 1000
    }
  }

  if (user) {
    const dbUser = user as AdapterUser & { role?: Role; status?: UserStatus }
    token.id = dbUser.id ?? token.sub ?? ''
    token.role = dbUser.role ?? Role.VIEWER
    token.status = dbUser.status ?? UserStatus.ACTIVE

    if (!dbUser.role && dbUser.id) {
      const fresh = await prisma.user
        .findUnique({
          where: { id: dbUser.id },
          select: { role: true, status: true },
        })
        .catch(() => null)

      if (fresh) {
        token.role = fresh.role as Role
        token.status = fresh.status as UserStatus
      }
    }
  }

  if (
    token.oauthProvider === 'google' &&
    typeof token.refreshToken === 'string' &&
    token.refreshToken.length > 0 &&
    token.error !== 'RefreshAccessTokenError'
  ) {
    const expiresAt = token.accessTokenExpires
    const stillValid =
      typeof expiresAt === 'number' && !Number.isNaN(expiresAt) && Date.now() < expiresAt

    if (!stillValid) {
      return refreshGoogleAccessTokenSingleFlight(token)
    }
  }

  const userId = typeof token.sub === 'string' ? token.sub : typeof token.id === 'string' ? token.id : undefined
  if (userId) {
    const last = typeof token.claimsSyncedAt === 'number' ? token.claimsSyncedAt : 0
    if (Date.now() - last > JWT_CLAIMS_SYNC_INTERVAL_MS) {
      const row = await prisma.user
        .findUnique({
          where: { id: userId },
          select: { role: true, status: true },
        })
        .catch(() => null)
      if (row) {
        token.role = row.role as Role
        token.status = row.status as UserStatus
      }
      token.claimsSyncedAt = Date.now()
    }
  }

  return token
}
