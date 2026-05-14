export type TemplateCategory =
  | "promotional"
  | "transactional"
  | "reengagement"
  | "announcement"
  | "reminder"
  | "welcome"
  | "alert"

export type TemplateVariable = {
  key: string
  label: string
  description: string
  defaultValue?: string
  required: boolean
  type: "string" | "number" | "date" | "url"
}

export type TemplateVersion = {
  version: number
  title: string
  subtitle?: string
  body: string
  imageUrl?: string
  ctaLabel?: string
  updatedBy: string
  updatedAt: string
  changeNote?: string
}

export type NotificationTemplate = {
  id: string
  name: string
  description: string
  category: TemplateCategory
  title: string
  subtitle?: string
  body: string
  imageUrl?: string
  iconUrl?: string
  ctaLabel?: string
  deepLinkUrl?: string
  variables: TemplateVariable[]
  versions: TemplateVersion[]
  currentVersion: number
  isFavorite: boolean
  isArchived: boolean
  tags: string[]
  usageCount: number
  lastUsedAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type TemplateUsageStat = {
  templateId: string
  month: string
  usageCount: number
  deliveryRate: number
  openRate: number
  ctr: number
}
