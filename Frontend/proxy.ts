import NextAuth from 'next-auth'
import authConfig from '@/auth/auth.config'

/**
 * NextAuth session guard at the network edge.
 *
 * Root file is `proxy.ts` (Next.js 16+); the `middleware.ts` name is deprecated.
 * Same matcher and behavior as before.
 */
const { auth } = NextAuth(authConfig)
export default auth

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *  - _next/static  (static assets)
     *  - _next/image  (Next.js image optimizer)
     *  - favicon.ico
     *  - public image formats
     *  - /api/auth/*  (NextAuth route handlers — must be public)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/auth).*)',
  ],
}
