import http from 'http';
import { Application } from 'express';
import { appConfig } from '@config/index';
import { logger } from '@infrastructure/logger';
import { connectDatabase, disconnectDatabase } from '@infrastructure/database';
import { connectRedis, disconnectRedis } from '@infrastructure/redis';

export class HttpServer {
  private server: http.Server | null = null;

  constructor(private readonly app: Application) {}

  async start(): Promise<void> {
    await connectDatabase();
    logger.info('Database connected');

    await connectRedis();
    logger.info('Redis connected');

    this.server = http.createServer(this.app);

    return new Promise((resolve) => {
      this.server!.listen(appConfig.port, () => {
        logger.info(
          `[${appConfig.name}] Server running on port ${appConfig.port} in ${appConfig.env} mode`,
        );
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.server) return;

    return new Promise((resolve, reject) => {
      this.server!.close(async (err) => {
        if (err) return reject(err);
        await disconnectDatabase();
        await disconnectRedis();
        logger.info('Server stopped gracefully');
        resolve();
      });
    });
  }

  getHttpServer(): http.Server | null {
    return this.server;
  }
}
