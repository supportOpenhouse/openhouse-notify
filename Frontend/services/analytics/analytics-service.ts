import {
  mockAnalyticsOverview,
  mockDeliveryFunnel,
  mockPlatformBreakdown,
  mockDeliveryTimeSeries,
  mockOpenRateSeries,
  mockCtrSeries,
  mockHourlyHeatmap,
  mockCampaignComparison,
} from "@/lib/data/mock-analytics"
import { AnalyticsFilter, AnalyticsOverview } from "@/lib/types/analytics"
import { withSimulatedLatency } from "@/services/mock-api/delay"

export async function getAnalyticsOverviewService(_filter?: Partial<AnalyticsFilter>): Promise<AnalyticsOverview> {
  return withSimulatedLatency(() => mockAnalyticsOverview, { minMs: 300, maxMs: 700 })
}

export async function getDeliveryFunnelService(_filter?: Partial<AnalyticsFilter>) {
  return withSimulatedLatency(() => mockDeliveryFunnel, { minMs: 200, maxMs: 500 })
}

export async function getPlatformBreakdownService(_filter?: Partial<AnalyticsFilter>) {
  return withSimulatedLatency(() => mockPlatformBreakdown, { minMs: 200, maxMs: 500 })
}

export async function getDeliveryTimeSeriesService(_filter?: Partial<AnalyticsFilter>) {
  return withSimulatedLatency(() => mockDeliveryTimeSeries, { minMs: 250, maxMs: 600 })
}

export async function getOpenRateTimeSeriesService(_filter?: Partial<AnalyticsFilter>) {
  return withSimulatedLatency(() => mockOpenRateSeries, { minMs: 250, maxMs: 600 })
}

export async function getCtrTimeSeriesService(_filter?: Partial<AnalyticsFilter>) {
  return withSimulatedLatency(() => mockCtrSeries, { minMs: 250, maxMs: 600 })
}

export async function getHourlyHeatmapService() {
  return withSimulatedLatency(() => mockHourlyHeatmap, { minMs: 300, maxMs: 700 })
}

export async function getCampaignComparisonService() {
  return withSimulatedLatency(() => mockCampaignComparison, { minMs: 200, maxMs: 500 })
}
