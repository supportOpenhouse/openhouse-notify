import Redis from 'ioredis';
import { redisConfig } from '@config/redis.config';
import { logger } from '@infrastructure/logger';

// ioredis accepts a full URL string as the first argument.
// The URL protocol determines TLS: redis:// = plain, rediss:// = TLS.
export const redisClient = new Redis(redisConfig.url, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableReadyCheck: true,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redisClient.on('connect', () => logger.info('Redis: connecting...'));
redisClient.on('ready', () => logger.info('Redis: ready'));
redisClient.on('error', (err) => logger.error('Redis: error', { err }));
redisClient.on('close', () => logger.warn('Redis: connection closed'));
redisClient.on('reconnecting', () => logger.info('Redis: reconnecting...'));

export async function connectRedis(): Promise<void> {
  await redisClient.connect();
}

export async function disconnectRedis(): Promise<void> {
  await redisClient.quit();
}
