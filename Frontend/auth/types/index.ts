export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MARKETING_MANAGER = 'MARKETING_MANAGER',
  MARKETING_EXECUTIVE = 'MARKETING_EXECUTIVE',
  ANALYST = 'ANALYST',
  VIEWER = 'VIEWER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum Resource {
  CAMPAIGNS = 'campaigns',
  TEMPLATES = 'templates',
  ANALYTICS = 'analytics',
  AUDIENCES = 'audiences',
  SETTINGS = 'settings',
  USERS = 'users',
  QUEUE_MONITOR = 'queue_monitor',
  TEST_NOTIFICATIONS = 'test_notifications',
}

export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  RETRY = 'retry',
  CANCEL = 'cancel',
  EXPORT = 'export',
  VIEW = 'view',
}

export interface AuthUser {
  id: string
  name: string | null
  email: string
  image: string | null
  role: Role
  status: UserStatus
}
