import { z } from 'zod'

/**
 * Validates server-only auth env at module load.
 * Edge/middleware must not import this file.
 */
const serverAuthEnvSchema = z.object({
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required (generate: npx auth secret)'),
})

const parsed = serverAuthEnvSchema.safeParse(process.env)

if (!parsed.success) {
  const msg = parsed.error.flatten().fieldErrors
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Invalid auth environment: ${JSON.stringify(msg)}`)
  }
  console.warn('[env] Auth environment validation failed:', msg)
}

export const serverAuthEnv = {
  AUTH_SECRET: parsed.success ? parsed.data.AUTH_SECRET : (process.env.AUTH_SECRET ?? ''),
}
