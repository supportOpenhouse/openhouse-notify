import { env } from './env';

export const appConfig = {
  name: env.APP_NAME,
  env: env.NODE_ENV,
  port: env.PORT,
  apiVersion: env.API_VERSION,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  cors: {
    origins: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
  },
} as const;
