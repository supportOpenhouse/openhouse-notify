/**
 * Device registration & topic subscription endpoints.
 *
 * Mobile app calls these on login / startup:
 *   POST /api/v1/devices/register          — save FCM token + subscribe to default topics
 *   POST /api/v1/devices/subscribe-topic   — subscribe token to a specific topic
 *   DELETE /api/v1/devices/unsubscribe-topic — unsubscribe token from a topic
 */
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getFirebaseMessaging } from '@providers/firebase.admin';
import { AUDIENCE_TOPIC_MAP } from '@config/topics';
import { logger } from '@infrastructure/logger';

export const devicesRouter = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const subscribeSchema = z.object({
  token: z.string().min(20, 'Invalid FCM token'),
  topic: z.string().min(1).refine(
    (t) => Object.values(AUDIENCE_TOPIC_MAP).includes(t),
    (t) => ({ message: `Unknown topic "${t}". Valid topics: ${Object.values(AUDIENCE_TOPIC_MAP).join(', ')}` }),
  ),
});

const registerSchema = z.object({
  token: z.string().min(20, 'Invalid FCM token'),
  platform: z.enum(['android', 'ios', 'web']).optional(),
});

// ─── POST /register ───────────────────────────────────────────────────────────

devicesRouter.post(
  '/register',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, platform } = registerSchema.parse(req.body);
      const messaging = getFirebaseMessaging();

      // Subscribe to the universal "all-users" topic on registration
      const topicsToSubscribe = [AUDIENCE_TOPIC_MAP.all_users];
      if (platform === 'android' && AUDIENCE_TOPIC_MAP.android_users) {
        topicsToSubscribe.push(AUDIENCE_TOPIC_MAP.android_users);
      }
      if (platform === 'ios' && AUDIENCE_TOPIC_MAP.ios_users) {
        topicsToSubscribe.push(AUDIENCE_TOPIC_MAP.ios_users);
      }

      await Promise.all(
        topicsToSubscribe.map((topic) => messaging.subscribeToTopic([token], topic)),
      );

      logger.info(`[devices] Registered token, subscribed to topics: ${topicsToSubscribe.join(', ')}`);

      res.status(200).json({
        success: true,
        message: 'Token registered and subscribed to default topics',
        subscribedTopics: topicsToSubscribe,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /subscribe-topic ────────────────────────────────────────────────────

devicesRouter.post(
  '/subscribe-topic',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, topic } = subscribeSchema.parse(req.body);
      const messaging = getFirebaseMessaging();

      const response = await messaging.subscribeToTopic([token], topic);

      if (response.failureCount > 0) {
        const error = response.errors[0]?.error?.message ?? 'Unknown error';
        res.status(400).json({ success: false, message: `Subscription failed: ${error}` });
        return;
      }

      logger.info(`[devices] Token subscribed to topic "${topic}"`);
      res.status(200).json({ success: true, message: `Subscribed to topic "${topic}"` });
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /unsubscribe-topic ────────────────────────────────────────────────

devicesRouter.delete(
  '/unsubscribe-topic',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, topic } = subscribeSchema.parse(req.body);
      const messaging = getFirebaseMessaging();

      const response = await messaging.unsubscribeFromTopic([token], topic);

      if (response.failureCount > 0) {
        const error = response.errors[0]?.error?.message ?? 'Unknown error';
        res.status(400).json({ success: false, message: `Unsubscribe failed: ${error}` });
        return;
      }

      logger.info(`[devices] Token unsubscribed from topic "${topic}"`);
      res.status(200).json({ success: true, message: `Unsubscribed from topic "${topic}"` });
    } catch (err) {
      next(err);
    }
  },
);
