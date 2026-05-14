import { UserStatus } from '@/auth/types'

/**
 * Check if an account is blocked from signing in.
 */
export function isAccountBlocked(status: UserStatus): boolean {
  return status === UserStatus.SUSPENDED || status === UserStatus.DEACTIVATED
}

/**
 * Map a NextAuth error code to a human-readable message.
 */
export function getAuthErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    ACCOUNT_SUSPENDED: 'Your account has been suspended. Contact an administrator.',
    ACCOUNT_DEACTIVATED: 'Your account has been deactivated.',
    ACCOUNT_LOCKED: 'Account temporarily locked due to too many failed attempts. Try again in 30 minutes.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    INSUFFICIENT_ROLE: 'You do not have permission to access this area.',
    INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action.',
    OAuthAccountNotLinked: 'This email is already registered with a different sign-in method.',
    OAuthCallbackError: 'Google sign-in failed. Please try again.',
    default: 'An unexpected error occurred. Please try again.',
  }
  return messages[error] ?? messages.default
}

/**
 * Parse a callbackUrl from search params safely.
 * Only allows relative paths (prevents open redirect).
 */
export function parseSafeCallbackUrl(callbackUrl: string | null | undefined): string {
  if (!callbackUrl) return '/admin'
  try {
    const url = new URL(callbackUrl, 'http://localhost')
    return url.pathname + url.search
  } catch {
    return '/admin'
  }
}
