"use client"

import { useQuery } from "@tanstack/react-query"
import { useAppSelector } from "@/store/hooks"
import {
  getAnalyticsOverviewService,
  getDeliveryFunnelService,
  getPlatformBreakdownService,
  getDeliveryTimeSeriesService,
  getOpenRateTimeSeriesService,
  getCtrTimeSeriesService,
  getHourlyHeatmapService,
  getCampaignComparisonService,
} from "@/services/analytics/analytics-service"

export const analyticsKeys = {
  all: ["analytics"] as const,
  overview: (filter: object) => [...analyticsKeys.all, "overview", filter] as const,
  funnel: (filter: object) => [...analyticsKeys.all, "funnel", filter] as const,
  platform: (filter: object) => [...analyticsKeys.all, "platform", filter] as const,
  deliverySeries: (filter: object) => [...analyticsKeys.all, "delivery-series", filter] as const,
  openRateSeries: (filter: object) => [...analyticsKeys.all, "open-rate-series", filter] as const,
  ctrSeries: (filter: object) => [...analyticsKeys.all, "ctr-series", filter] as const,
  heatmap: () => [...analyticsKeys.all, "heatmap"] as const,
  comparison: () => [...analyticsKeys.all, "comparison"] as const,
}

export function useAnalyticsFilter() {
  return useAppSelector((s) => s.analytics.filter)
}

export function useAnalyticsOverview() {
  const filter = useAnalyticsFilter()
  return useQuery({
    queryKey: analyticsKeys.overview(filter),
    queryFn: () => getAnalyticsOverviewService(filter),
    staleTime: 60_000,
  })
}

export function useDeliveryFunnel() {
  const filter = useAnalyticsFilter()
  return useQuery({
    queryKey: analyticsKeys.funnel(filter),
    queryFn: () => getDeliveryFunnelService(filter),
    staleTime: 60_000,
  })
}

export function usePlatformBreakdown() {
  const filter = useAnalyticsFilter()
  return useQuery({
    queryKey: analyticsKeys.platform(filter),
    queryFn: () => getPlatformBreakdownService(filter),
    staleTime: 60_000,
  })
}

export function useDeliveryTimeSeries() {
  const filter = useAnalyticsFilter()
  return useQuery({
    queryKey: analyticsKeys.deliverySeries(filter),
    queryFn: () => getDeliveryTimeSeriesService(filter),
    staleTime: 60_000,
  })
}

export function useOpenRateTimeSeries() {
  const filter = useAnalyticsFilter()
  return useQuery({
    queryKey: analyticsKeys.openRateSeries(filter),
    queryFn: () => getOpenRateTimeSeriesService(filter),
    staleTime: 60_000,
  })
}

export function useCtrTimeSeries() {
  const filter = useAnalyticsFilter()
  return useQuery({
    queryKey: analyticsKeys.ctrSeries(filter),
    queryFn: () => getCtrTimeSeriesService(filter),
    staleTime: 60_000,
  })
}

export function useHourlyHeatmap() {
  return useQuery({
    queryKey: analyticsKeys.heatmap(),
    queryFn: getHourlyHeatmapService,
    staleTime: 300_000,
  })
}

export function useCampaignComparison() {
  return useQuery({
    queryKey: analyticsKeys.comparison(),
    queryFn: getCampaignComparisonService,
    staleTime: 60_000,
  })
}
