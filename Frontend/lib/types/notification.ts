// ─── Enums ────────────────────────────────────────────────────────────────────

// Values must match the Prisma CampaignStatus enum returned by the API (UPPERCASE)
export enum CampaignStatus {
  Draft = "DRAFT",
  Scheduled = "SCHEDULED",
  Running = "RUNNING",
  Paused = "PAUSED",
  Completed = "COMPLETED",
  Cancelled = "CANCELLED",
  Failed = "FAILED",
}

export enum NotificationType {
  Promotional = "promotional",
  Transactional = "transactional",
  Triggered = "triggered",
  System = "system",
}

export enum CampaignScheduleType {
  Instant = "instant",
  Scheduled = "scheduled",
  Recurring = "recurring",
  Triggered = "triggered",
}

export enum NotificationPriority {
  Low = "low",
  Normal = "normal",
  High = "high",
}

export enum AudienceType {
  CsvCpIds = "csv_cp_ids",
  AllBrokers = "all_brokers",
  CityBrokers = "city_brokers",
  Segment = "segment",
  Manual = "manual",
}

export enum Platform {
  Android = "android",
  iOS = "ios",
  All = "all",
}

export enum RecurringFrequency {
  Daily = "daily",
  Weekly = "weekly",
  Monthly = "monthly",
  Custom = "custom",
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

export type CampaignTag = string

export type DeepLink = {
  url: string
  fallbackUrl?: string
}

export type CampaignSchedule = {
  type: CampaignScheduleType
  scheduledAt?: string
  timezone?: string
  recurring?: {
    frequency: RecurringFrequency
    endAt?: string
    daysOfWeek?: number[]
  }
  expiresAt?: string
}

export type NotificationPayload = {
  title: string
  subtitle?: string
  body: string
  imageUrl?: string
  iconUrl?: string
  deepLink?: DeepLink
  ctaLabel?: string
  data?: Record<string, string>
  silent?: boolean
  ttl?: number
  badge?: number
}

export type CampaignAudience = {
  type: AudienceType
  segmentId?: string
  cpIds?: string[]
  csvFileName?: string
  estimatedSize?: number
  filters?: Record<string, unknown>
}

export type Campaign = {
  id: string
  name: string
  description?: string
  status: CampaignStatus
  type: NotificationType
  platform: Platform
  priority: NotificationPriority
  payload: NotificationPayload
  audience: CampaignAudience
  schedule: CampaignSchedule
  templateId?: string
  tags: CampaignTag[]
  createdBy: string
  createdAt: string
  updatedAt: string
  sentAt?: string
  stats: CampaignStats
}

export type CampaignStats = {
  totalRecipients: number
  sent: number
  delivered: number
  opened: number
  clicked: number
  failed: number
  bounced: number
  retried: number
  deliveryRate: number
  openRate: number
  ctr: number
  failureRate: number
}

// ─── Flat shape returned by GET /campaigns ────────────────────────────────────
// Field names mirror the Prisma Campaign model exactly.

export type CampaignFlat = {
  id: string
  name: string
  description?: string | null
  title: string
  body: string
  imageUrl?: string | null
  audienceType: string
  scheduledAt?: string | null
  totalCount: number
  sentCount: number
  failedCount: number
  status: CampaignStatus
  notificationType: string
  platform: string
  priority: string
  channel: string
  createdAt: string
  updatedAt: string
  startedAt?: string | null
  completedAt?: string | null
}

// ─── KPI / Metrics ────────────────────────────────────────────────────────────

export type CampaignMetric = {
  label: string
  value: string
  helper: string
  trend?: number
  trendLabel?: string
}

export type DashboardKpi = {
  id: string
  label: string
  value: number
  displayValue: string
  unit?: string
  trend: number
  trendLabel: string
  helper: string
  icon: string
}

// ─── Audience preview ─────────────────────────────────────────────────────────

export type CampaignPreview = {
  totalRows: number
  uniqueCpIds: number
  matchedBrokers: number
  activeTokens: number
  invalidCpIds: string[]
}

export type AudienceEstimate = {
  estimatedSize: number
  reachableTokens: number
  breakdown: { label: string; value: number }[]
}

// ─── Retry ────────────────────────────────────────────────────────────────────

export type RetryRecord = {
  id: string
  campaignId: string
  recipientId: string
  fcmToken: string
  attemptNumber: number
  failureReason: string
  nextRetryAt?: string
  status: "pending" | "retrying" | "succeeded" | "exhausted"
  createdAt: string
}

// ─── Delivery report ─────────────────────────────────────────────────────────

export type DeliveryReport = {
  campaignId: string
  recipientId: string
  status: "sent" | "delivered" | "opened" | "clicked" | "failed" | "bounced"
  platform: Platform
  timestamp: string
  errorCode?: string
  errorMessage?: string
}
