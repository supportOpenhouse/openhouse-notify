import type { User } from 'next-auth'
import type { AdapterUser } from '@auth/core/adapters'
import { UserStatus } from '@/auth/types'

/**
 * Controls whether sign-in is permitted.
 * Return true to allow, a URL string to redirect, or false to deny.
 */
export async function signInCallback({
  user,
}: {
  user: User | AdapterUser
}): Promise<boolean | string> {
  if (!user.email) return false

  const status = (user as AdapterUser & { status?: UserStatus }).status
  if (status === UserStatus.SUSPENDED) {
    return '/auth/error?error=ACCOUNT_SUSPENDED'
  }
  if (status === UserStatus.DEACTIVATED) {
    return '/auth/error?error=ACCOUNT_DEACTIVATED'
  }

  return true
}
