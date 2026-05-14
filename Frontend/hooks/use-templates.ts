"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getTemplatesService,
  getTemplateByIdService,
  cloneTemplateService,
  toggleFavoriteTemplateService,
  deleteTemplateService,
  type TemplateListParams,
} from "@/services/templates/template-service"

export const templateKeys = {
  all: ["templates"] as const,
  lists: () => [...templateKeys.all, "list"] as const,
  list: (params: TemplateListParams) => [...templateKeys.lists(), params] as const,
  detail: (id: string) => [...templateKeys.all, "detail", id] as const,
}

export function useTemplates(params: TemplateListParams = {}) {
  return useQuery({
    queryKey: templateKeys.list(params),
    queryFn: () => getTemplatesService(params),
    staleTime: 120_000,
  })
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => getTemplateByIdService(id),
    enabled: !!id,
  })
}

export function useCloneTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: cloneTemplateService,
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.all }),
  })
}

export function useToggleFavoriteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      toggleFavoriteTemplateService(id, isFavorite),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.all }),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTemplateService,
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.all }),
  })
}
