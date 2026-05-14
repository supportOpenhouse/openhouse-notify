import { apiClient } from "@/lib/api/client"
import { CampaignFlat, CampaignMetric } from "@/lib/types/notification"
import { PaginatedResponse, PaginationParams } from "@/lib/types/api"

// ─── Types ────────────────────────────────────────────────────────────────────

export const campaignMetrics: CampaignMetric[] = [
  { label: "Total Campaigns", value: "—", helper: "Last 30 days", trend: 0, trendLabel: "vs last month" },
  { label: "Notifications Sent", value: "—", helper: "Across all channels", trend: 0, trendLabel: "vs last month" },
  { label: "Delivery Rate", value: "—", helper: "FCM delivery success", trend: 0, trendLabel: "vs last month" },
  { label: "Avg. CTR", value: "—", helper: "Open or deep-link click", trend: 0, trendLabel: "vs last month" },
  { label: "Active Campaigns", value: "—", helper: "Scheduled or processing", trend: 0, trendLabel: "vs last month" },
  { label: "Failed Deliveries", value: "—", helper: "Requires attention", trend: 0, trendLabel: "vs last month" },
]

export async function getCampaignMetricsService(): Promise<CampaignMetric[]> {
  return campaignMetrics
}

export type CampaignListParams = PaginationParams & {
  status?: string
  search?: string
  sortBy?: keyof CampaignFlat
  sortOrder?: "asc" | "desc"
}

export async function getCampaignHistoryService(
  params: CampaignListParams = { page: 1, pageSize: 10 }
): Promise<PaginatedResponse<CampaignFlat>> {
  const { page = 1, pageSize = 10, status, search, sortBy = "createdAt", sortOrder = "desc" } = params

  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sortBy: String(sortBy),
    sortOrder,
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
  })

  const data = await apiClient.get<{
    items: CampaignFlat[]
    totalItems: number
    totalPages: number
    currentPage: number
    pageSize: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }>(`/campaigns?${qs}`)

  return {
    data,
    success: true,
    timestamp: new Date().toISOString(),
  }
}

export async function getCampaignByIdService(id: string): Promise<CampaignFlat> {
  return apiClient.get<CampaignFlat>(`/campaigns/${id}`)
}

export type CreateCampaignInput = {
  name: string
  title: string
  subtitle?: string
  body: string
  imageUrl?: string
  audienceType: string
  segmentId?: string
  /** Raw pasted FCM tokens (newline/comma separated) — used when audienceType = 'manual' */
  manualTokens?: string
  csvFile?: File | null
  scheduleType: string
  scheduledAt?: string
  timezone?: string
  platform: string
  priority: string
  notificationType: string
  deepLinkUrl?: string
  /** Hex property code — FCM data for PropertyDetails (Django encoding) */
  propertyCode?: string
  ctaLabel?: string
  tags?: string[]
  silent?: boolean
}

export async function createCampaignService(
  input: CreateCampaignInput
): Promise<{ success: boolean; campaignId: string; message: string }> {
  // ── Debug: what arrived at the service ─────────────────────────────────────
  console.log("📦 [createCampaignService] input received:", {
    name: input.name,
    title: input.title,
    audienceType: input.audienceType,
    propertyCode: input.propertyCode,           // ← is it here?
    propertyCodeTrimmed: input.propertyCode?.trim() || "(empty → won't be sent)",
    deepLinkUrl: input.deepLinkUrl || "(none)",
  })

  const formData = new FormData()

  // Append all scalar fields
  const fields: Array<keyof CreateCampaignInput> = [
    "name", "title", "body", "audienceType", "scheduleType",
    "platform", "priority", "notificationType",
  ]
  for (const key of fields) {
    const val = input[key]
    if (val !== undefined && val !== null) formData.append(key, String(val))
  }

  // Optional fields
  if (input.subtitle) formData.append("subtitle", input.subtitle)
  if (input.imageUrl) formData.append("imageUrl", input.imageUrl)
  if (input.deepLinkUrl) formData.append("deepLinkUrl", input.deepLinkUrl)
  if (input.propertyCode?.trim()) formData.append("propertyCode", input.propertyCode.trim().toLowerCase())
  if (input.ctaLabel) formData.append("ctaLabel", input.ctaLabel)
  if (input.scheduledAt) formData.append("scheduledAt", input.scheduledAt)
  if (input.timezone) formData.append("timezone", input.timezone)
  if (input.segmentId) formData.append("segmentId", input.segmentId)
  if (input.manualTokens) formData.append("manualTokens", input.manualTokens)
  if (input.silent !== undefined) formData.append("silent", String(input.silent))

  // CSV file attachment
  if (input.csvFile) {
    formData.append("csvFile", input.csvFile, input.csvFile.name)
  }

  // ── Debug: list everything that will actually be posted ────────────────────
  const formEntries: Record<string, string> = {}
  formData.forEach((val, key) => { formEntries[key] = typeof val === "string" ? val : `[File: ${(val as File).name}]` })
  console.log("📤 [createCampaignService] FormData being POSTed:", formEntries)

  const result = await apiClient.upload<{
    id: string
    name: string
    status: string
    totalCount: number
    message: string
  }>("/campaigns", formData)

  return {
    success: true,
    campaignId: result.id,
    message: result.message,
  }
}

export async function cancelCampaignService(campaignId: string): Promise<{ success: boolean }> {
  await apiClient.patch(`/campaigns/${campaignId}/cancel`, {})
  return { success: true }
}

export async function getQueueJobsService() {
  return apiClient.get<{ queues: unknown[] }>("/queue-monitor/stats")
}
