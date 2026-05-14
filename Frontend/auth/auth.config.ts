import type { NextAuthConfig } from 'next-auth'
import { googleProvider } from './providers/google.provider'
import { AUTH_ROUTES, PROTECTED_PREFIXES } from './constants'
import { UserStatus } from './types'

/**
 * Edge-safe auth config — used by root `proxy.ts` (Next.js edge guard).
 * Must NOT import: bcrypt, prisma, or any Node.js-only module.
 * Only includes OAuth providers (Google). Credentials provider
 * is added in auth.ts which runs in Node.js only.
 */
export const authConfig = {
  providers: [googleProvider],

  // AUTH_SECRET must be set in .env.local (generate: npx auth secret)
  secret: process.env.AUTH_SECRET,

  pages: {
    signIn: AUTH_ROUTES.SIGN_IN,
    signOut: AUTH_ROUTES.SIGN_OUT,
    error: AUTH_ROUTES.ERROR,
  },

  callbacks: {
    /**
     * Runs in Edge runtime (via root `proxy.ts`). Controls route access.
     * - Redirects unauthenticated users from protected routes to login.
     * - Redirects authenticated users away from the login page.
     */
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user
      const pathname = nextUrl.pathname
      const accountStatus = session?.user?.status as UserStatus | undefined

      if (accountStatus === UserStatus.SUSPENDED) {
        const url = new URL(AUTH_ROUTES.ERROR, nextUrl)
        url.searchParams.set('error', 'ACCOUNT_SUSPENDED')
        return Response.redirect(url)
      }
      if (accountStatus === UserStatus.DEACTIVATED) {
        const url = new URL(AUTH_ROUTES.ERROR, nextUrl)
        url.searchParams.set('error', 'ACCOUNT_DEACTIVATED')
        return Response.redirect(url)
      }

      const isProtected = PROTECTED_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix),
      )
      const isLoginPage = pathname === AUTH_ROUTES.SIGN_IN

      if (isLoginPage && isLoggedIn) {
        return Response.redirect(new URL(AUTH_ROUTES.DEFAULT_REDIRECT, nextUrl))
      }
      if (isProtected && !isLoggedIn) {
        const loginUrl = new URL(AUTH_ROUTES.SIGN_IN, nextUrl)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return Response.redirect(loginUrl)
      }

      return true
    },
  },
} satisfies NextAuthConfig

export default authConfig
