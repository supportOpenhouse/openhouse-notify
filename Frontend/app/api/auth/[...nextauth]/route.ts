import { handlers } from '@/auth/auth'

/**
 * NextAuth v5 catch-all route handler.
 * Handles: GET  /api/auth/session
 *           GET  /api/auth/providers
 *           GET  /api/auth/csrf
 *           GET  /api/auth/callback/:provider
 *           POST /api/auth/signin/:provider
 *           POST /api/auth/signout
 */
export const { GET, POST } = handlers
