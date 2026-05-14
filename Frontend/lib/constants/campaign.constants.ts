import {
  CampaignStatus,
  NotificationType,
  Platform,
  NotificationPriority,
  CampaignScheduleType,
  AudienceType,
} from "@/lib/types/notification"

export const CAMPAIGN_STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "info" }
> = {
  [CampaignStatus.Draft]:      { label: "Draft",      variant: "secondary"    },
  [CampaignStatus.Scheduled]:  { label: "Scheduled",  variant: "warning"      },
  [CampaignStatus.Running]:    { label: "Running",    variant: "info"         },
  [CampaignStatus.Paused]:     { label: "Paused",     variant: "warning"      },
  [CampaignStatus.Completed]:  { label: "Completed",  variant: "success"      },
  [CampaignStatus.Cancelled]:  { label: "Cancelled",  variant: "secondary"    },
  [CampaignStatus.Failed]:     { label: "Failed",     variant: "destructive"  },
}

export const NOTIFICATION_TYPE_OPTIONS = [
  { label: "Promotional", value: NotificationType.Promotional },
  { label: "Transactional", value: NotificationType.Transactional },
  { label: "Triggered", value: NotificationType.Triggered },
  { label: "System", value: NotificationType.System },
]

export const PLATFORM_OPTIONS = [
  { label: "All Platforms", value: Platform.All },
  { label: "Android", value: Platform.Android },
  { label: "iOS", value: Platform.iOS },
]

export const PRIORITY_OPTIONS = [
  { label: "Low", value: NotificationPriority.Low },
  { label: "Normal", value: NotificationPriority.Normal },
  { label: "High", value: NotificationPriority.High },
]

export const SCHEDULE_TYPE_OPTIONS = [
  { label: "Send Now", value: CampaignScheduleType.Instant, description: "Dispatch immediately after creation" },
  { label: "Scheduled", value: CampaignScheduleType.Scheduled, description: "Send at a specific date and time" },
  { label: "Recurring", value: CampaignScheduleType.Recurring, description: "Repeat on a defined cadence" },
  { label: "Triggered", value: CampaignScheduleType.Triggered, description: "Fire on a backend event" },
]

export const AUDIENCE_TYPE_OPTIONS = [
  { label: "CSV Upload (CP IDs)", value: AudienceType.CsvCpIds },
  { label: "All Brokers", value: AudienceType.AllBrokers },
  { label: "City Brokers", value: AudienceType.CityBrokers },
  { label: "Saved Segment", value: AudienceType.Segment },
  { label: "Manual Selection", value: AudienceType.Manual },
]

export const TITLE_MAX_CHARS = 65
export const SUBTITLE_MAX_CHARS = 40
export const BODY_MAX_CHARS = 240
export const CTA_MAX_CHARS = 30

export const DEFAULT_TTL_HOURS = 24
export const MAX_RETRY_ATTEMPTS = 3
export const DEFAULT_BATCH_SIZE = 500

export const TIMEZONE_OPTIONS = [
  { label: "Asia/Kolkata (IST)", value: "Asia/Kolkata" },
  { label: "UTC", value: "UTC" },
  { label: "America/New_York (EST)", value: "America/New_York" },
  { label: "America/Los_Angeles (PST)", value: "America/Los_Angeles" },
  { label: "Europe/London (GMT)", value: "Europe/London" },
]

export const CITY_OPTIONS = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Noida",
  "Gurgaon",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
]

export const BROKER_TYPE_OPTIONS = [
  { label: "Individual", value: "individual" },
  { label: "Agency", value: "agency" },
  { label: "Builder", value: "builder" },
]

export const ENGAGEMENT_LEVEL_OPTIONS = [
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
  { label: "Inactive", value: "inactive" },
]

export const CAMPAIGN_BUILDER_STEPS = [
  { id: "details", label: "Details", description: "Name, type & priority" },
  { id: "content", label: "Content", description: "Notification payload" },
  { id: "audience", label: "Audience", description: "Who receives this" },
  { id: "schedule", label: "Schedule", description: "When to deliver" },
  { id: "review", label: "Review", description: "Confirm & launch" },
]
