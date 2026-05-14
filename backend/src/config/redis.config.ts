import { env } from './env';

interface RedisConnectionOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  tls?: Record<string, never>;
}

function parseRedisUrl(url: string): RedisConnectionOptions {
  const u = new URL(url);
  const opts: RedisConnectionOptions = {
    host: u.hostname,
    port: Number(u.port) || 6379,
  };

  if (u.username) opts.username = u.username;
  if (u.password) opts.password = decodeURIComponent(u.password);

  const dbIndex = u.pathname.slice(1);
  if (dbIndex) opts.db = Number(dbIndex) || 0;

  // rediss:// protocol means TLS is required
  if (u.protocol === 'rediss:') opts.tls = {} as Record<string, never>;

  return opts;
}

export const redisConfig = {
  url: env.REDIS_URL,
  connection: parseRedisUrl(env.REDIS_URL),
};
