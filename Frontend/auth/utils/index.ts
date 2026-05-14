/**
 * Client-safe helpers (no `next/headers`, no `@/auth/auth`).
 * Safe to import from Client Components (e.g. login page).
 */
export { getAuthErrorMessage, parseSafeCallbackUrl, isAccountBlocked } from './client'
