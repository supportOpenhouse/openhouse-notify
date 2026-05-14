import { Router } from 'express';
import { healthRouter } from './health.route';
import { meRouter } from './me.route';
import { devicesRouter } from './devices.route';
import { campaignsRouter } from '@modules/campaigns/presentation/routes';
import { queueMonitorRouter } from '@modules/queue-monitor/presentation/routes';

export const v1Router = Router();

// Public routes (no auth required)
v1Router.use('/', healthRouter);

// Authenticated routes
v1Router.use('/me', meRouter);
v1Router.use('/campaigns', campaignsRouter);
v1Router.use('/queue-monitor', queueMonitorRouter);
v1Router.use('/devices', devicesRouter);

// Module routes — uncomment as each module is implemented:
// v1Router.use('/notifications', notificationsRouter);
// v1Router.use('/audiences', audiencesRouter);
// v1Router.use('/templates', templatesRouter);
// v1Router.use('/analytics', analyticsRouter);
// v1Router.use('/users', usersRouter);
// v1Router.use('/devices', devicesRouter);
// v1Router.use('/fcm-tokens', fcmTokensRouter);
// v1Router.use('/settings', settingsRouter);
// v1Router.use('/test-notifications', testNotificationsRouter);
