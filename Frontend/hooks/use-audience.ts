"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getSegmentsService,
  getSegmentByIdService,
  estimateAudienceService,
  previewSegmentService,
  createSegmentService,
  deleteSegmentService,
} from "@/services/audience/audience-service"
import { ConditionGroup } from "@/lib/types/audience"

export const segmentKeys = {
  all: ["segments"] as const,
  lists: () => [...segmentKeys.all, "list"] as const,
  detail: (id: string) => [...segmentKeys.all, "detail", id] as const,
}

export function useSegments() {
  return useQuery({
    queryKey: segmentKeys.lists(),
    queryFn: getSegmentsService,
    staleTime: 120_000,
  })
}

export function useSegment(id: string) {
  return useQuery({
    queryKey: segmentKeys.detail(id),
    queryFn: () => getSegmentByIdService(id),
    enabled: !!id,
  })
}

export function useEstimateAudience() {
  return useMutation({ mutationFn: (cg: ConditionGroup) => estimateAudienceService(cg) })
}

export function usePreviewSegment() {
  return useMutation({ mutationFn: (cg: ConditionGroup) => previewSegmentService(cg) })
}

export function useCreateSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createSegmentService,
    onSuccess: () => qc.invalidateQueries({ queryKey: segmentKeys.all }),
  })
}

export function useDeleteSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSegmentService,
    onSuccess: () => qc.invalidateQueries({ queryKey: segmentKeys.all }),
  })
}
