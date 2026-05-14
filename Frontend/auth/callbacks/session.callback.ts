import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import { Role, UserStatus } from '@/auth/types'

type SessionParams = {
  session: Session
  token: JWT
}

/**
 * Maps the JWT into the client-visible session (JWT strategy).
 */
export async function sessionCallback({ session, token }: SessionParams): Promise<Session> {
  const t = token as JWT & { id?: string; role?: Role; status?: UserStatus }
  return {
    ...session,
    error: t.error,
    user: {
      ...session.user,
      id: t.id ?? t.sub ?? '',
      role: t.role ?? Role.VIEWER,
      status: t.status ?? UserStatus.ACTIVE,
    },
  }
}
