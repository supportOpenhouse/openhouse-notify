import '@/lib/env/server'

import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { getLoginRequestMeta } from '@/lib/login-request-meta'
import { authConfig } from './auth.config'
import { SESSION_MAX_AGE_SECONDS } from './constants'
import { credentialsProvider } from './providers/credentials.provider'
import { signInCallback } from './callbacks'
import { jwtCallback } from './callbacks/jwt.callback'
import { sessionCallback } from './callbacks/session.callback'
import { Role } from './types'

/**
 * Full NextAuth config — Node.js only (not used in root `proxy.ts`).
 *
 * Session strategy: JWT (not database).
 *
 * Why JWT here even though we have a DB:
 *   Root `proxy.ts` runs in the Edge runtime and uses a separate NextAuth
 *   instance (authConfig, no Prisma adapter). Database session tokens are
 *   opaque random strings that can only be validated by querying the DB —
 *   Edge can't do that. JWT tokens are self-contained and verifiable with
 *   just AUTH_SECRET, so the proxy can validate them without any DB call.
 *
 *   The Prisma adapter is still used for:
 *     ✓ OAuth account linking (accounts table)
 *     ✓ User creation on first Google sign-in (users table)
 *     ✓ VerificationTokens
 *
 *   Role/status: refreshed on sign-in and periodically from the DB in the jwt
 *   callback (see JWT_CLAIMS_SYNC_INTERVAL_MS). Google access tokens are rotated
 *   using the refresh token stored in the encrypted JWT.
 */
export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,

  adapter: PrismaAdapter(prisma),

  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE_SECONDS,
  },

  providers: [...authConfig.providers, credentialsProvider],

  callbacks: {
    ...authConfig.callbacks,
    jwt: jwtCallback,
    session: sessionCallback,
    signIn: signInCallback,
  },

  events: {
    async signIn({ user, isNewUser }) {
      if (!user.id) return

      if (isNewUser) {
        await prisma.user
          .update({ where: { id: user.id }, data: { role: Role.VIEWER } })
          .catch(() => {})
      }

      const { ip, userAgent } = await getLoginRequestMeta()

      await prisma.user
        .update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            ...(ip !== undefined && ip !== '' ? { lastLoginIp: ip } : {}),
            ...(userAgent !== undefined && userAgent !== ''
              ? { lastLoginDevice: userAgent }
              : {}),
          },
        })
        .catch(() => {})
    },
  },

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-authjs.session-token'
          : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
})
