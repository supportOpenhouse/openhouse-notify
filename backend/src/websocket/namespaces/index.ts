export const SOCKET_NAMESPACES = {
  DEFAULT: '/',
  CAMPAIGNS: '/campaigns',
  ANALYTICS: '/analytics',
  NOTIFICATIONS: '/notifications',
  QUEUE_MONITOR: '/queue-monitor',
} as const;

export type SocketNamespace = (typeof SOCKET_NAMESPACES)[keyof typeof SOCKET_NAMESPACES];
