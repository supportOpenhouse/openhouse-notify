"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getQueueJobsService,
  getQueueStatsService,
  getQueueMetricsService,
  retryJobService,
  cancelJobService,
} from "@/services/queue/queue-service"

export const queueKeys = {
  all: ["queue"] as const,
  jobs: () => [...queueKeys.all, "jobs"] as const,
  stats: () => [...queueKeys.all, "stats"] as const,
  metrics: () => [...queueKeys.all, "metrics"] as const,
}

export function useQueueJobs() {
  return useQuery({
    queryKey: queueKeys.jobs(),
    queryFn: getQueueJobsService,
    refetchInterval: 5000,
    staleTime: 3000,
  })
}

export function useQueueStats() {
  return useQuery({
    queryKey: queueKeys.stats(),
    queryFn: getQueueStatsService,
    refetchInterval: 3000,
    staleTime: 2000,
  })
}

export function useQueueMetrics() {
  return useQuery({
    queryKey: queueKeys.metrics(),
    queryFn: getQueueMetricsService,
    staleTime: 10_000,
  })
}

export function useRetryJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: retryJobService,
    onSuccess: () => qc.invalidateQueries({ queryKey: queueKeys.all }),
  })
}

export function useCancelJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: cancelJobService,
    onSuccess: () => qc.invalidateQueries({ queryKey: queueKeys.all }),
  })
}
