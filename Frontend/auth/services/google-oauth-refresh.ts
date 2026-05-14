import type { JWT } from 'next-auth/jwt'

export type GoogleOAuthJwt = JWT & {
  accessToken?: string
  refreshToken?: string
  accessTokenExpires?: number
  oauthProvider?: 'google'
  error?: 'RefreshAccessTokenError'
}

function stripEnvQuotes(value: string | undefined): string | undefined {
  if (!value) return undefined
  const t = value.trim()
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1)
  }
  return t
}

/**
 * Exchanges a Google refresh_token for a new access_token (and optional rotated refresh_token).
 * @see https://next-auth.js.org/v3/tutorials/refresh-token-rotation
 */
export async function refreshGoogleAccessToken(token: GoogleOAuthJwt): Promise<GoogleOAuthJwt> {
  try {
    const clientId = stripEnvQuotes(process.env.GOOGLE_CLIENT_ID)
    const clientSecret = stripEnvQuotes(process.env.GOOGLE_CLIENT_SECRET)
    const refreshToken = token.refreshToken

    if (!clientId || !clientSecret || !refreshToken) {
      return { ...token, error: 'RefreshAccessTokenError' }
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    const refreshed = (await response.json()) as {
      access_token?: string
      expires_in?: number
      refresh_token?: string
      error?: string
    }

    if (!response.ok) {
      throw new Error(refreshed.error ?? 'google_token_refresh_failed')
    }

    if (!refreshed.access_token) {
      throw new Error('google_token_refresh_missing_access_token')
    }

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
      refreshToken: refreshed.refresh_token ?? refreshToken,
      error: undefined,
    }
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' }
  }
}

const refreshInflight = new Map<string, Promise<GoogleOAuthJwt>>()

/**
 * Deduplicates concurrent Google token refreshes for the same user (jwt sub/id).
 */
export function refreshGoogleAccessTokenSingleFlight(token: GoogleOAuthJwt): Promise<GoogleOAuthJwt> {
  const key = (token.sub ?? token.id ?? '').trim()
  if (!key) {
    return refreshGoogleAccessToken(token)
  }
  const existing = refreshInflight.get(key)
  if (existing) return existing
  const pending = refreshGoogleAccessToken(token).finally(() => {
    refreshInflight.delete(key)
  })
  refreshInflight.set(key, pending)
  return pending
}
