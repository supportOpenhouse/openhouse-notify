import { z } from "zod"
import { TITLE_MAX_CHARS, BODY_MAX_CHARS, SUBTITLE_MAX_CHARS, CTA_MAX_CHARS } from "@/lib/constants/campaign.constants"

export const campaignDetailsSchema = z.object({
  name: z
    .string()
    .min(3, "Campaign name must be at least 3 characters")
    .max(80, "Campaign name too long"),
  description: z.string().max(200, "Description too long").optional(),
  notificationType: z.enum(["promotional", "transactional", "triggered", "system"]),
  platform: z.enum(["all", "android", "ios"]),
  priority: z.enum(["low", "normal", "high"]),
  tags: z.array(z.string()).default([]),
})

export const campaignContentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(TITLE_MAX_CHARS, `Title must be under ${TITLE_MAX_CHARS} characters`),
  subtitle: z
    .string()
    .max(SUBTITLE_MAX_CHARS, `Subtitle must be under ${SUBTITLE_MAX_CHARS} characters`)
    .optional(),
  body: z
    .string()
    .min(10, "Message body must be at least 10 characters")
    .max(BODY_MAX_CHARS, `Body must be under ${BODY_MAX_CHARS} characters`),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  deepLinkUrl: z.string().optional().or(z.literal("")),
  /** Hex from Django format(int(home.id * 10000), 'x') — tap opens Property Details in app */
  propertyCode: z
    .string()
    .max(32, "Property code too long")
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || !String(val).trim() || /^[0-9a-fA-F]+$/.test(String(val).trim()),
      "Use hex only (e.g. 222e00) — same encoding as Openhouse property notifications",
    ),
  ctaLabel: z
    .string()
    .max(CTA_MAX_CHARS, `CTA label must be under ${CTA_MAX_CHARS} characters`)
    .optional(),
  silent: z.boolean().default(false),
  templateId: z.string().optional(),
})

export const campaignAudienceSchema = z.object({
  audienceType: z.enum(["csv_cp_ids", "manual", "all_users", "all_brokers", "city_brokers", "segment"]),
  segmentId: z.string().optional(),
  manualTokens: z.string().optional(),
  cpIdsRaw: z.string().optional(),
  selectedCities: z.array(z.string()).default([]),
})

export const campaignScheduleSchema = z
  .object({
    scheduleType: z.enum(["instant", "scheduled", "recurring", "triggered"]),
    scheduledAt: z.string().optional(),
    timezone: z.string().default("Asia/Kolkata"),
    expiresAt: z.string().optional(),
    recurring: z
      .object({
        frequency: z.enum(["daily", "weekly", "monthly", "custom"]),
        endAt: z.string().optional(),
        daysOfWeek: z.array(z.number().min(0).max(6)).default([]),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.scheduleType === "scheduled") {
        return !!data.scheduledAt
      }
      return true
    },
    { message: "Scheduled date/time is required for scheduled campaigns", path: ["scheduledAt"] }
  )

export const fullCampaignSchema = campaignDetailsSchema
  .merge(campaignContentSchema)
  .merge(campaignAudienceSchema)
  .merge(campaignScheduleSchema)

export type CampaignDetailsInput = z.infer<typeof campaignDetailsSchema>
export type CampaignContentInput = z.infer<typeof campaignContentSchema>
export type CampaignAudienceInput = z.infer<typeof campaignAudienceSchema>
export type CampaignScheduleInput = z.infer<typeof campaignScheduleSchema>
export type FullCampaignInput = z.infer<typeof fullCampaignSchema>
