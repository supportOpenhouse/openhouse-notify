import { mockTemplates } from "@/lib/data/mock-templates"
import { NotificationTemplate, TemplateCategory } from "@/lib/types/template"
import { withSimulatedLatency } from "@/services/mock-api/delay"

export type TemplateListParams = {
  category?: TemplateCategory | ""
  search?: string
  favoritesOnly?: boolean
}

export async function getTemplatesService(params: TemplateListParams = {}): Promise<NotificationTemplate[]> {
  return withSimulatedLatency(
    () => {
      let filtered = mockTemplates.filter((t) => !t.isArchived)
      if (params.category) filtered = filtered.filter((t) => t.category === params.category)
      if (params.favoritesOnly) filtered = filtered.filter((t) => t.isFavorite)
      if (params.search) {
        const q = params.search.toLowerCase()
        filtered = filtered.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
      }
      return filtered
    },
    { minMs: 200, maxMs: 500 }
  )
}

export async function getTemplateByIdService(id: string): Promise<NotificationTemplate> {
  return withSimulatedLatency(
    () => {
      const tpl = mockTemplates.find((t) => t.id === id)
      if (!tpl) throw new Error(`Template ${id} not found`)
      return tpl
    },
    { minMs: 150, maxMs: 300 }
  )
}

export async function cloneTemplateService(id: string): Promise<NotificationTemplate> {
  return withSimulatedLatency(
    () => {
      const original = mockTemplates.find((t) => t.id === id)
      if (!original) throw new Error(`Template ${id} not found`)
      return {
        ...original,
        id: `TPL-${Date.now()}`,
        name: `${original.name} (Copy)`,
        isFavorite: false,
        usageCount: 0,
        lastUsedAt: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    },
    { minMs: 300, maxMs: 600 }
  )
}

export async function toggleFavoriteTemplateService(id: string, isFavorite: boolean): Promise<{ success: boolean }> {
  return withSimulatedLatency(() => ({ success: true }), { minMs: 100, maxMs: 300 })
}

export async function deleteTemplateService(id: string): Promise<{ success: boolean }> {
  return withSimulatedLatency(() => ({ success: true }), { minMs: 200, maxMs: 400 })
}
