import Google from 'next-auth/providers/google'

/**
 * Google OAuth provider.
 * - `prompt: 'consent'` forces the consent screen every time (needed for refresh tokens).
 * - `access_type: 'offline'` requests a refresh token.
 * Authorized redirect URI to register in Google Cloud Console:
 *   {AUTH_URL}/api/auth/callback/google
 */
export const googleProvider = Google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  // Allows linking a Google sign-in to an existing user record created via seed/admin.
  // Safe for internal platforms where we control account creation and Google verifies emails.
  allowDangerousEmailAccountLinking: true,
  authorization: {
    params: {
      prompt: 'consent',
      access_type: 'offline',
      response_type: 'code',
    },
  },
})
