import { redisConfig } from './redis.config';

export const queueConfig = {
  // BullMQ creates its own Redis connections from these options.
  // maxRetriesPerRequest: null is required by BullMQ.
  connection: {
    ...redisConfig.connection,
    maxRetriesPerRequest: null as null,
    enableReadyCheck: false,
  },
  defaultJobOptions: {
    removeOnComplete: { count: 1000, age: 24 * 3600 },
    removeOnFail: { count: 5000 },
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 1000,
    },
  },
};
