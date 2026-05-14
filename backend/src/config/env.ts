import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // App
  NODE_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(4000),
  APP_NAME: z.string().default('notification-platform'),
  API_VERSION: z.string().default('v1'),

  // Database (NeonDB)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_URL_UNPOOLED: z.string().min(1, 'DATABASE_URL_UNPOOLED is required'),

  // Redis (cloud URL — redis:// or rediss:// for TLS)
  REDIS_URL: z.string().url('REDIS_URL must be a valid redis:// or rediss:// URL'),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // NextAuth — must match notificationPanel AUTH_SECRET (decode JWE session cookie)
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required to validate session cookies'),

  /**
   * When false, only the session cookie is accepted (browser flows).
   * When true, `Authorization: Bearer <session-jwe>` is also accepted (server-to-server).
   * Bearer tokens are replayable until expiry — disable on public-facing APIs if unused.
   */
  AUTH_ALLOW_SESSION_BEARER: z
    .string()
    .optional()
    .default('true')
    .transform((v) => !['false', '0', 'no'].includes(v.toLowerCase())),

  /**
   * Path to the service account JSON file (absolute or relative to process cwd).
   * When set, Firebase uses application default credentials from this file.
   */
  GOOGLE_APPLICATION_CREDENTIALS: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),

  /** Firebase / GCP project id (same as in service account JSON). */
  FIREBASE_PROJECT_ID: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),

  /** Service account client_email from JSON. */
  FIREBASE_CLIENT_EMAIL: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),

  /**
   * PEM private key from JSON, with literal `\n` newlines in a single .env line.
   * Only used when GOOGLE_APPLICATION_CREDENTIALS is not set.
   */
  FIREBASE_PRIVATE_KEY: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),

  // Logging
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
    .default('info'),
});

export type EnvConfig = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env: EnvConfig = parsed.data;
