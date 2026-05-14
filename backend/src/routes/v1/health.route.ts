import { Router, Request, Response } from 'express';
import { prisma } from '@infrastructure/database';
import { redisClient } from '@infrastructure/redis';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response) => {
  const checks = await runHealthChecks();
  const isHealthy = Object.values(checks).every((c) => c.status === 'ok');

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data: {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    },
  });
});

async function runHealthChecks(): Promise<
  Record<string, { status: string; latencyMs?: number }>
> {
  const results: Record<string, { status: string; latencyMs?: number }> = {};

  // Database
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    results.database = { status: 'ok', latencyMs: Date.now() - start };
  } catch {
    results.database = { status: 'error' };
  }

  // Redis
  try {
    const start = Date.now();
    await redisClient.ping();
    results.redis = { status: 'ok', latencyMs: Date.now() - start };
  } catch {
    results.redis = { status: 'error' };
  }

  return results;
}
