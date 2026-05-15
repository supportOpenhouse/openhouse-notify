import { env } from './env';

/** Origins always permitted (HTTP CORS + Socket.IO), in addition to `CORS_ORIGINS`. */
const ALWAYS_ALLOWED_CORS_ORIGINS = ['https://openhouse-notify-e7jw.vercel.app'] as const;

function buildCorsOrigins(envOrigins: string): string[] {
  const fromEnv = envOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return [...new Set([...ALWAYS_ALLOWED_CORS_ORIGINS, ...fromEnv])];
}

export const appConfig = {
  name: env.APP_NAME,
  env: env.NODE_ENV,
  port: env.PORT,
  apiVersion: env.API_VERSION,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  cors: {
    origins: buildCorsOrigins(env.CORS_ORIGINS),
  },
} as const;
