"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAppSelector } from "@/store/hooks"
import {
  getCampaignMetricsService,
  getCampaignHistoryService,
  getCampaignByIdService,
  createCampaignService,
  cancelCampaignService,
  getQueueJobsService,
  type CreateCampaignInput,
} from "@/services/notification/notification-campaign-service"
import { CampaignFlat, CampaignStatus } from "@/lib/types/notification"

export const campaignKeys = {
  all: ["campaigns"] as const,
  metrics: () => [...campaignKeys.all, "metrics"] as const,
  lists: () => [...campaignKeys.all, "list"] as const,
  list: (params: object) => [...campaignKeys.lists(), params] as const,
  details: () => [...campaignKeys.all, "detail"] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
}

export function useCampaignMetrics() {
  return useQuery({
    queryKey: campaignKeys.metrics(),
    queryFn: getCampaignMetricsService,
    staleTime: 60_000,
  })
}

export function useCampaignHistory() {
  const filters = useAppSelector((s) => s.campaigns.filters)
  return useQuery({
    queryKey: campaignKeys.list(filters),
    queryFn: () =>
      getCampaignHistoryService({
        page: filters.page,
        pageSize: filters.pageSize,
        status: filters.status || undefined,
        search: filters.search || undefined,
        sortBy: (filters.sortBy as keyof CampaignFlat) || undefined,
        sortOrder: filters.sortOrder,
      }),
    placeholderData: (prev) => prev,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const items = query.state.data?.data?.items
      if (!items?.length) return false
      const hasInFlight = items.some(
        (c) => c.status === CampaignStatus.Running || c.status === CampaignStatus.Scheduled,
      )
      return hasInFlight ? 4_000 : false
    },
  })
}

export function useCampaignDetail(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => getCampaignByIdService(id),
    enabled: !!id,
  })
}

export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCampaignInput) => createCampaignService(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: campaignKeys.all })
    },
  })
}

export function useCancelCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelCampaignService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: campaignKeys.all })
    },
  })
}

export function useQueueStats() {
  return useQuery({
    queryKey: ["queue-stats"],
    queryFn: getQueueJobsService,
    refetchInterval: 5000,
  })
}
