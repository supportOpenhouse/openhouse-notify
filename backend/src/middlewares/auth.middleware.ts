import { Request, Response, NextFunction } from 'express';
import { decode } from '@auth/core/jwt';
import { env } from '@config/env';
import { UnauthorizedError, ForbiddenError } from '@shared/errors';

/**
 * Session transport threat model:
 * - Cookie: httpOnly session cookie from the Next.js app (preferred for browsers).
 * - Bearer: raw JWE string — replayable until `exp`; never log the token or full decoded payload
 *   (OAuth refresh material may exist inside the JWT). Disable via AUTH_ALLOW_SESSION_BEARER=false
 *   if your deployment does not need machine-to-machine session forwarding.
 */

// Must match the cookie names in notificationPanel/auth/auth.ts
const SESSION_COOKIE_DEV = 'authjs.session-token';
const SESSION_COOKIE_PROD = '__Secure-authjs.session-token';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
      userRole: string;
      userEmail: string;
    }
  }
}

type NextAuthJWT = {
  id?: string;
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
  status?: string;
  exp?: number;
  iat?: number;
};

/**
 * Validates the NextAuth JWT cookie sent by the Next.js frontend.
 *
 * NextAuth v5 with JWT strategy stores the session as an encrypted JWE
 * (JSON Web Encryption) cookie. We decode it using the shared AUTH_SECRET —
 * no database lookup required, works entirely in memory.
 *
 * The frontend must send requests with:
 *   fetch('/api/v1/...', { credentials: 'include' })   // cookie forwarded
 * OR:
 *   Authorization: Bearer <rawJwtString>               // server-to-server
 */
export async function requireSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const secret = env.AUTH_SECRET;

    const rawToken = extractRawToken(req);
    if (!rawToken) {
      throw new UnauthorizedError('No session token provided', 'MISSING_SESSION');
    }

    // @auth/core/jwt decode — handles the HKDF key derivation and JWE decryption
    const payload = (await decode({
      token: rawToken,
      secret,
      salt:
        process.env.NODE_ENV === 'production'
          ? '__Secure-authjs.session-token'
          : 'authjs.session-token',
    })) as NextAuthJWT | null;

    if (!payload) {
      throw new UnauthorizedError('Invalid or expired session', 'INVALID_SESSION');
    }

    // Check expiry (exp is Unix timestamp in seconds)
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedError('Session expired', 'SESSION_EXPIRED');
    }

    const status = payload.status;
    if (status === 'SUSPENDED') {
      throw new ForbiddenError('Account suspended', 'ACCOUNT_SUSPENDED');
    }
    if (status === 'DEACTIVATED') {
      throw new ForbiddenError('Account deactivated', 'ACCOUNT_DEACTIVATED');
    }

    req.userId = payload.id ?? payload.sub ?? '';
    req.userRole = payload.role ?? 'VIEWER';
    req.userEmail = payload.email ?? '';

    next();
  } catch (err) {
    next(err);
  }
}

function extractRawToken(req: Request): string | null {
  const cookieName =
    process.env.NODE_ENV === 'production' ? SESSION_COOKIE_PROD : SESSION_COOKIE_DEV;

  const cookieToken = parseCookie(req.headers.cookie ?? '', cookieName);
  if (cookieToken) return cookieToken;

  if (!env.AUTH_ALLOW_SESSION_BEARER) {
    return null;
  }

  const authHeader = req.headers.authorization ?? '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim() || null;
  }

  return null;
}

function parseCookie(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key?.trim() === name) {
      return decodeURIComponent(rest.join('=').trim()) || null;
    }
  }
  return null;
}
