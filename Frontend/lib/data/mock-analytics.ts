import { AnalyticsOverview, DeliveryFunnelData, PlatformBreakdown, HourlyHeatmapData, CampaignComparisonRow, TimeSeriesPoint } from "@/lib/types/analytics"

export const mockAnalyticsOverview: AnalyticsOverview = {
  totalSent: 48230,
  totalDelivered: 44564,
  totalOpened: 8709,
  totalClicked: 4823,
  totalFailed: 3666,
  deliveryRate: 92.4,
  openRate: 19.5,
  ctr: 55.4,
  failureRate: 7.6,
  periodStart: "2026-04-08T00:00:00.000Z",
  periodEnd: "2026-05-08T23:59:59.000Z",
  previousPeriodComparison: {
    totalSent: 44500,
    deliveryRate: 91.1,
    openRate: 18.3,
    ctr: 53.1,
  },
}

export const mockDeliveryFunnel: DeliveryFunnelData[] = [
  { stage: "Sent", count: 48230, rate: 100, color: "#6366f1" },
  { stage: "Delivered", count: 44564, rate: 92.4, color: "#8b5cf6" },
  { stage: "Opened", count: 8709, rate: 19.5, color: "#a78bfa" },
  { stage: "Clicked", count: 4823, rate: 55.4, color: "#c4b5fd" },
]

export const mockPlatformBreakdown: PlatformBreakdown[] = [
  { platform: "Android", sent: 32140, delivered: 29800, opened: 5820, clicked: 3210, failed: 2340, deliveryRate: 92.7, openRate: 19.5 },
  { platform: "iOS", sent: 16090, delivered: 14764, opened: 2889, clicked: 1613, failed: 1326, deliveryRate: 91.8, openRate: 19.6 },
]

export const mockDeliveryTimeSeries: TimeSeriesPoint[] = [
  { timestamp: "2026-04-08", value: 1200 },
  { timestamp: "2026-04-10", value: 850 },
  { timestamp: "2026-04-12", value: 2100 },
  { timestamp: "2026-04-14", value: 1650 },
  { timestamp: "2026-04-16", value: 3200 },
  { timestamp: "2026-04-18", value: 980 },
  { timestamp: "2026-04-20", value: 1400 },
  { timestamp: "2026-04-22", value: 4800 },
  { timestamp: "2026-04-24", value: 2300 },
  { timestamp: "2026-04-26", value: 1900 },
  { timestamp: "2026-04-28", value: 2700 },
  { timestamp: "2026-04-30", value: 3500 },
  { timestamp: "2026-05-02", value: 1800 },
  { timestamp: "2026-05-04", value: 15400 },
  { timestamp: "2026-05-05", value: 2100 },
  { timestamp: "2026-05-06", value: 2100 },
  { timestamp: "2026-05-07", value: 1560 },
  { timestamp: "2026-05-08", value: 860 },
]

export const mockOpenRateSeries: TimeSeriesPoint[] = mockDeliveryTimeSeries.map((p) => ({
  timestamp: p.timestamp,
  value: +(Math.random() * 10 + 15).toFixed(1),
}))

export const mockCtrSeries: TimeSeriesPoint[] = mockDeliveryTimeSeries.map((p) => ({
  timestamp: p.timestamp,
  value: +(Math.random() * 10 + 8).toFixed(1),
}))

export const mockHourlyHeatmap: HourlyHeatmapData[] = (() => {
  const data: HourlyHeatmapData[] = []
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const isMorning = hour >= 8 && hour <= 11
      const isEvening = hour >= 18 && hour <= 21
      const isWeekend = day === 0 || day === 6
      const baseRate = isMorning ? 24 : isEvening ? 22 : 12
      const weekendBoost = isWeekend ? 3 : 0
      data.push({
        dayOfWeek: day,
        hour,
        openRate: +(baseRate + weekendBoost + Math.random() * 4 - 2).toFixed(1),
        count: Math.floor(Math.random() * 400 + 100),
      })
    }
  }
  return data
})()

export const mockCampaignComparison: CampaignComparisonRow[] = [
  { campaignId: "CMP-1021", campaignName: "Noida Hot Leads Push", sent: 1104, deliveryRate: 92.0, openRate: 21.3, ctr: 14.7, failureRate: 8.0, sentAt: "2026-05-08T11:00:00.000Z" },
  { campaignId: "CMP-1023", campaignName: "Reactivation Batch 3", sent: 430, deliveryRate: 100.0, openRate: 19.5, ctr: 12.1, failureRate: 0.0, sentAt: "2026-05-07T08:30:00.000Z" },
  { campaignId: "CMP-1024", campaignName: "Mumbai Price Drop Alert", sent: 1890, deliveryRate: 90.0, openRate: 24.1, ctr: 18.3, failureRate: 10.0, sentAt: "2026-05-06T10:00:00.000Z" },
  { campaignId: "CMP-1025", campaignName: "App Update v2.4 Push", sent: 14280, deliveryRate: 92.7, openRate: 31.2, ctr: 8.9, failureRate: 7.3, sentAt: "2026-05-05T09:00:00.000Z" },
]
