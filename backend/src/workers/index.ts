/**
 * Worker process entry point — two usage modes:
 *
 * 1. Standalone (legacy):  npm run worker:dev
 *    Starts workers as a separate process. Still works if you need to scale
 *    workers independently of the API server.
 *
 * 2. Embedded (default):   imported by bootstrap.ts
 *    Workers run in the same process as the API server so a single
 *    `npm run dev` / `npm start` is all you need.
 */
import { Worker } from 'bullmq';
import { logger } from '@infrastructure/logger';
import { createWorker, QUEUE_NAMES } from '@infrastructure/queue';
import { tryInitFirebaseAdmin } from '@providers/firebase.admin';
import { campaignDispatchProcessor } from '@queue/processors/campaign-dispatch.processor';
import { fcmBatchProcessor } from '@queue/processors/fcm-batch.processor';

export interface StartedWorkers {
  campaignWorker: Worker;
  fcmBatchWorker: Worker;
  close: () => Promise<void>;
}

/**
 * Initialise Firebase + BullMQ workers and return a handle to close them.
 * Called by bootstrap.ts so workers share the same process as the HTTP server.
 */
export function startWorkers(): StartedWorkers {
  tryInitFirebaseAdmin();

  const campaignWorker = createWorker(QUEUE_NAMES.CAMPAIGNS, campaignDispatchProcessor, {
    concurrency: 5,
  });

  const fcmBatchWorker = createWorker(QUEUE_NAMES.FCM_BATCHES, fcmBatchProcessor, {
    concurrency: 10,
    limiter: {
      max: 20,
      duration: 1000,
    },
  });

  logger.info('[workers] Campaign + FCM-batch workers started in-process');

  const close = async () => {
    logger.info('[workers] Closing workers gracefully...');
    await Promise.all([campaignWorker.close(), fcmBatchWorker.close()]);
    logger.info('[workers] Workers closed');
  };

  return { campaignWorker, fcmBatchWorker, close };
}

// ── Standalone mode ───────────────────────────────────────────────────────────
// Only runs when this file is the entry-point (npm run worker:dev).
// When imported by bootstrap.ts the block below is skipped.
if (require.main === module) {
  const workers = startWorkers();

  async function shutdown(signal: string) {
    logger.info(`[workers] Received ${signal} — shutting down`);
    await workers.close();
    process.exit(0);
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}
