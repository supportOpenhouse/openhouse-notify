import { createApp } from './index';
import { HttpServer } from './server';
import { logger } from '@infrastructure/logger';
import { tryInitFirebaseAdmin } from '@providers/firebase.admin';
import { startWorkers } from '@workers/index';

export async function bootstrap(): Promise<HttpServer> {
  tryInitFirebaseAdmin();

  const app = createApp();
  const server = new HttpServer(app);

  await server.start();

  // Start BullMQ workers in the same process — no separate `npm run worker:dev` needed.
  const workers = startWorkers();

  setupGracefulShutdown(server, workers.close);

  return server;
}

function setupGracefulShutdown(server: HttpServer, closeWorkers: () => Promise<void>): void {
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    try {
      await Promise.all([server.stop(), closeWorkers()]);
      process.exit(0);
    } catch (err) {
      logger.error('Error during graceful shutdown', { err });
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { err });
    void shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
    void shutdown('unhandledRejection');
  });
}
