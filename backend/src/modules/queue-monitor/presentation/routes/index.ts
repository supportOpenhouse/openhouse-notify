import { Router, Request, Response, NextFunction } from 'express';
import { requireSession } from '@middlewares/auth.middleware';
import { getCampaignsQueue, getFcmBatchQueue } from '@infrastructure/queue/app-queues';
import { sendSuccess } from '@utils/response.helper';

export const queueMonitorRouter = Router();

queueMonitorRouter.use(requireSession);

async function getQueueStats(name: string, queue: ReturnType<typeof getCampaignsQueue>) {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);
  return { name, waiting, active, completed, failed, delayed };
}

queueMonitorRouter.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [campaigns, fcmBatches] = await Promise.all([
      getQueueStats('campaigns', getCampaignsQueue()),
      getQueueStats('fcm-batches', getFcmBatchQueue()),
    ]);
    sendSuccess(res, { queues: [campaigns, fcmBatches] });
  } catch (err) {
    next(err);
  }
});

queueMonitorRouter.get(
  '/jobs',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queueName = (req.query.queue as string) ?? 'campaigns';
      const status = (req.query.status as string) ?? 'failed';
      const start = Number(req.query.start ?? 0);
      const end = Number(req.query.end ?? 49);

      const queue = queueName === 'fcm-batches' ? getFcmBatchQueue() : getCampaignsQueue();

      type JobState = 'completed' | 'failed' | 'active' | 'waiting' | 'delayed';
      const validStates: JobState[] = ['completed', 'failed', 'active', 'waiting', 'delayed'];
      const state: JobState = validStates.includes(status as JobState)
        ? (status as JobState)
        : 'failed';

      const jobs = await queue.getJobs([state], start, end);
      const data = jobs.map((j) => ({
        id: j.id,
        name: j.name,
        data: j.data,
        attemptsMade: j.attemptsMade,
        failedReason: j.failedReason,
        timestamp: j.timestamp,
        processedOn: j.processedOn,
        finishedOn: j.finishedOn,
      }));

      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },
);
