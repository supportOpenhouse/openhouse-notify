export const SOCKET_EVENTS = {
  // Lifecycle
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  // Notifications
  NOTIFICATION_SENT: 'notification:sent',
  NOTIFICATION_DELIVERED: 'notification:delivered',
  NOTIFICATION_FAILED: 'notification:failed',

  // Campaigns
  CAMPAIGN_STARTED: 'campaign:started',
  CAMPAIGN_COMPLETED: 'campaign:completed',
  CAMPAIGN_PAUSED: 'campaign:paused',
  CAMPAIGN_STATS_UPDATED: 'campaign:stats:updated',

  // Queue monitoring
  QUEUE_JOB_ADDED: 'queue:job:added',
  QUEUE_JOB_COMPLETED: 'queue:job:completed',
  QUEUE_JOB_FAILED: 'queue:job:failed',
  QUEUE_JOB_RETRYING: 'queue:job:retrying',

  // Analytics
  ANALYTICS_UPDATED: 'analytics:updated',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
