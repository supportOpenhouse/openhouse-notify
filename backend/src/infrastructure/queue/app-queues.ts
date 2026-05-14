/**
 * Lazily-initialised singleton Queue instances shared across the process.
 * Import these instead of calling `createQueue` ad-hoc so every part of the
 * codebase talks to the same BullMQ queue object.
 */
import { Queue } from 'bullmq';
import { queueConfig } from '@config/queue.config';
import { QUEUE_NAMES } from './bullmq.setup';
import { logger } from '@infrastructure/logger';

let _campaignsQueue: Queue | null = null;
let _fcmBatchQueue: Queue | null = null;

function makeQueue(name: string): Queue {
  const q = new Queue(name, {
    connection: queueConfig.connection,
    defaultJobOptions: queueConfig.defaultJobOptions,
  });
  q.on('error', (err) => logger.error(`Queue [${name}] error`, { err }));
  logger.info(`Queue [${name}] initialised`);
  return q;
}

export function getCampaignsQueue(): Queue {
  if (!_campaignsQueue) _campaignsQueue = makeQueue(QUEUE_NAMES.CAMPAIGNS);
  return _campaignsQueue;
}

export function getFcmBatchQueue(): Queue {
  if (!_fcmBatchQueue) _fcmBatchQueue = makeQueue(QUEUE_NAMES.FCM_BATCHES);
  return _fcmBatchQueue;
}

/** Graceful shutdown — call in SIGTERM handler. */
export async function closeAppQueues(): Promise<void> {
  await Promise.all([_campaignsQueue?.close(), _fcmBatchQueue?.close()]);
}
