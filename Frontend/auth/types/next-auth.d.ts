import { Role, UserStatus } from './index'

declare module 'next-auth' {
  interface Session {
    /** Set when Google refresh_token exchange fails — client should re-authenticate. */
    error?: 'RefreshAccessTokenError'
    user: {
      id: string
      name: string | null
      email: string
      image: string | null
      role: Role
      status: UserStatus
    }
  }

  interface User {
    role?: Role
    status?: UserStatus
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: Role
    status?: UserStatus
    /** Last time role/status were synced from the DB (ms since epoch). */
    claimsSyncedAt?: number
    /** Google (or other) OAuth access token — refreshed server-side while session is valid. */
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    oauthProvider?: 'google'
    error?: 'RefreshAccessTokenError'
  }
}

declare module '@auth/core/adapters' {
  interface AdapterUser {
    role: Role
    status: UserStatus
  }
}

export {}
