import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().max(200).optional(),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  imageUrl: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined))
    .pipe(z.string().url().optional()),
  deepLinkUrl: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  /** Hex property code (same as Django send_property_notification). FCM: type, propertyId, url */
  propertyCode: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim().toLowerCase() : undefined))
    .pipe(
      z
        .string()
        .regex(/^[0-9a-f]+$/, 'propertyCode must be hex (e.g. 21dea0 from Django)')
        .max(32)
        .optional(),
    ),
  ctaLabel: z
    .string()
    .max(40)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  silent: z
    .union([z.boolean(), z.string().transform((v) => v === 'true')])
    .optional()
    .default(false),
  audienceType: z
    .enum(['csv_tokens', 'csv_cp_ids', 'manual', 'all_users', 'all_brokers', 'city_brokers', 'segment'])
    .default('manual'),
  /** Raw newline/comma-separated FCM tokens — used when audienceType = 'manual'. */
  manualTokens: z.string().optional(),
  segmentId: z.string().optional(),
  platform: z.enum(['all', 'android', 'ios']).default('all'),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  notificationType: z
    .enum(['promotional', 'transactional', 'triggered', 'system'])
    .default('promotional'),
  scheduleType: z.enum(['instant', 'scheduled', 'recurring']).default('instant'),
  // Empty string → treat as absent (multer sends "" for unfilled optional fields)
  scheduledAt: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  timezone: z.string().default('Asia/Kolkata'),
});

export type CreateCampaignDto = z.infer<typeof createCampaignSchema>;

export const listCampaignsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(['DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED', 'FAILED'])
    .optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'name', 'status', 'scheduledAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListCampaignsDto = z.infer<typeof listCampaignsSchema>;
