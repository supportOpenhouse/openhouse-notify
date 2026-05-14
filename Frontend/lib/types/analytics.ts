export type DateRange = {
  from: string
  to: string
}

export type AnalyticsGranularity = "hourly" | "daily" | "weekly" | "monthly"

export type TimeSeriesPoint = {
  timestamp: string
  value: number
  label?: string
}

export type AnalyticsOverview = {
  totalSent: number
  totalDelivered: number
  totalOpened: number
  totalClicked: number
  totalFailed: number
  deliveryRate: number
  openRate: number
  ctr: number
  failureRate: number
  periodStart: string
  periodEnd: string
  previousPeriodComparison: {
    totalSent: number
    deliveryRate: number
    openRate: number
    ctr: number
  }
}

export type DeliveryFunnelData = {
  stage: string
  count: number
  rate: number
  color: string
}

export type PlatformBreakdown = {
  platform: string
  sent: number
  delivered: number
  opened: number
  clicked: number
  failed: number
  deliveryRate: number
  openRate: number
}

export type HourlyHeatmapData = {
  dayOfWeek: number
  hour: number
  openRate: number
  count: number
}

export type CampaignComparisonRow = {
  campaignId: string
  campaignName: string
  sent: number
  deliveryRate: number
  openRate: number
  ctr: number
  failureRate: number
  sentAt: string
}

export type AnalyticsFilter = {
  dateRange: DateRange
  platform: string[]
  campaignType: string[]
  segmentId?: string
  granularity: AnalyticsGranularity
}
