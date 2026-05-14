import { Queue, Worker, QueueEvents, Processor, WorkerOptions } from 'bullmq';
import { queueConfig } from '@config/queue.config';
import { logger } from '@infrastructure/logger';

export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
  CAMPAIGNS: 'campaigns',
  FCM_BATCHES: 'fcm-batches',
  ANALYTICS: 'analytics',
  DEVICE_SYNC: 'device-sync',
  RETRY: 'retry',
  SCHEDULED: 'scheduled',
  TEST_NOTIFICATIONS: 'test-notifications',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export function createQueue(name: QueueName): Queue {
  const queue = new Queue(name, {
    connection: queueConfig.connection,
    defaultJobOptions: queueConfig.defaultJobOptions,
  });

  queue.on('error', (err) => {
    logger.error(`Queue [${name}] error`, { err });
  });

  logger.info(`Queue [${name}] initialized`);
  return queue;
}

export function createWorker(
  name: QueueName,
  processor: Processor,
  options?: Omit<WorkerOptions, 'connection'>,
): Worker {
  const worker = new Worker(name, processor, {
    connection: queueConfig.connection,
    ...options,
  });

  worker.on('completed', (job) => {
    logger.debug(`Queue [${name}] job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Queue [${name}] job ${job?.id} failed`, { err });
  });

  worker.on('error', (err) => {
    logger.error(`Queue [${name}] worker error`, { err });
  });

  logger.info(`Worker [${name}] initialized`);
  return worker;
}

export function createQueueEvents(name: QueueName): QueueEvents {
  return new QueueEvents(name, { connection: queueConfig.connection });
}
