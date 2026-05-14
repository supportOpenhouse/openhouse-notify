import { headers } from 'next/headers'

const MAX_DEVICE_STRING = 512

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}

/**
 * Best-effort IP + User-Agent from the incoming Auth.js route request.
 * IP may be missing on localhost; prefer trusting `x-forwarded-for` behind a reverse proxy.
 */
export async function getLoginRequestMeta(): Promise<{
  ip: string | undefined
  userAgent: string | undefined
}> {
  try {
    const h = await headers()
    const forwarded = h.get('x-forwarded-for')
    const ip =
      forwarded?.split(',')[0]?.trim() ||
      h.get('x-real-ip') ||
      h.get('cf-connecting-ip') ||
      undefined
    const rawUa = h.get('user-agent') || undefined
    const userAgent = rawUa ? truncate(rawUa, MAX_DEVICE_STRING) : undefined
    return { ip, userAgent }
  } catch {
    return { ip: undefined, userAgent: undefined }
  }
}
