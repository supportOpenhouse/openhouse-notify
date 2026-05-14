export const AUTH_ROUTES = {
  SIGN_IN: '/login',
  SIGN_OUT: '/login',
  ERROR: '/auth/error',
  DEFAULT_REDIRECT: '/admin',
} as const

export const PROTECTED_PREFIXES = ['/admin'] as const

export const PUBLIC_ROUTES = [
  '/login',
  '/auth/error',
  '/api/auth',
] as const

// Account lockout config
export const MAX_FAILED_ATTEMPTS = 5
export const LOCKOUT_DURATION_MS = 30 * 60 * 1000 // 30 minutes

// Session config (JWT maxAge — single source of truth for NextAuth)
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60 // 30 days

/** How often the jwt callback re-reads role/status from the DB to reduce stale claims. */
export const JWT_CLAIMS_SYNC_INTERVAL_MS = 60 * 1000 // 1 minute
