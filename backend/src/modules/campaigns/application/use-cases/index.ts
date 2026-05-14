import { CampaignStatus, NotificationChannel } from '@prisma/client';
import { prisma } from '@infrastructure/database';
import { getCampaignsQueue } from '@infrastructure/queue/app-queues';
import { parseFcmTokensBuffer, parseFcmTokensCsv } from '@utils/csv-tokens';
import { CAMPAIGN_JOB_NAMES } from '@queue/jobs/campaign.jobs';
import { logger } from '@infrastructure/logger';
import { getTopicForAudience, TOPIC_AUDIENCE_TYPES } from '@config/topics';
import { CreateCampaignDto, ListCampaignsDto } from '../../dto';
import { AppError } from '@shared/errors';
import { getPropertyCodeFromMetadata } from '@utils/campaign-metadata';

// ─── Create Campaign ──────────────────────────────────────────────────────────

export interface CreateCampaignResult {
  id: string;
  name: string;
  status: string;
  totalCount: number;
  message: string;
}

export async function createCampaignUseCase(
  dto: CreateCampaignDto,
  /** Raw CSV file buffer uploaded by the client. Required when audienceType = 'csv_tokens' | 'csv_cp_ids'. */
  csvBuffer?: Buffer,
): Promise<CreateCampaignResult> {
  // 1. Determine delivery mode: topic broadcast OR token multicast
  const fcmTopic = getTopicForAudience(dto.audienceType);
  const isTopicCampaign = TOPIC_AUDIENCE_TYPES.has(dto.audienceType);

  let tokens: string[] = [];

  if (!isTopicCampaign) {
    if (dto.audienceType === 'csv_tokens' || dto.audienceType === 'csv_cp_ids') {
      if (!csvBuffer || csvBuffer.length === 0) {
        throw new AppError('CSV file is required for csv_tokens audience', 400, true, 'CSV_REQUIRED');
      }
      tokens = parseFcmTokensBuffer(csvBuffer);
      if (tokens.length === 0) {
        throw new AppError(
          'No valid FCM tokens found in CSV. Each token must be ≥20 characters.',
          400,
          true,
          'CSV_EMPTY',
        );
      }
    } else if (dto.audienceType === 'manual') {
      if (!dto.manualTokens || dto.manualTokens.trim().length === 0) {
        throw new AppError('Please provide at least one FCM token', 400, true, 'TOKENS_REQUIRED');
      }
      tokens = parseFcmTokensCsv(dto.manualTokens);
      if (tokens.length === 0) {
        throw new AppError(
          'No valid FCM tokens found. Each token must be ≥20 characters.',
          400,
          true,
          'TOKENS_EMPTY',
        );
      }
    }
  }

  // 2. Derive initial status
  const initialStatus = (() => {
    if (dto.scheduleType === 'scheduled') return CampaignStatus.SCHEDULED;
    if (isTopicCampaign) return CampaignStatus.RUNNING;      // topic dispatch is immediate
    if (tokens.length > 0) return CampaignStatus.RUNNING;    // token dispatch is immediate
    return CampaignStatus.DRAFT;
  })();

  // 3. Create campaign row
  const campaign = await prisma.campaign.create({
    data: {
      name: dto.name,
      description: dto.description,
      title: dto.title,
      body: dto.body,
      imageUrl: dto.imageUrl || null,
      deepLinkUrl: dto.deepLinkUrl || null,
      ctaLabel: dto.ctaLabel || null,
      silent: dto.silent ?? false,
      channel: NotificationChannel.PUSH,
      audienceType: dto.audienceType,
      fcmTopic: fcmTopic ?? null,
      platform: dto.platform,
      priority: dto.priority,
      notificationType: dto.notificationType,
      totalCount: isTopicCampaign ? 0 : tokens.length, // topic count unknown until Firebase reports
      status: initialStatus,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      metadata: {
        scheduleType: dto.scheduleType,
        timezone: dto.timezone,
        ...(dto.propertyCode ? { propertyCode: dto.propertyCode } : {}),
      },
    },
  });

  // 4. Insert per-token recipients (only for token-based campaigns)
  if (!isTopicCampaign && tokens.length > 0) {
    const CHUNK = 1000;
    for (let i = 0; i < tokens.length; i += CHUNK) {
      const chunk = tokens.slice(i, i + CHUNK);
      await prisma.campaignRecipient.createMany({
        data: chunk.map((token) => ({ campaignId: campaign.id, token })),
        skipDuplicates: true,
      });
    }
  }

  // 5. Enqueue dispatch job for instant campaigns
  const shouldDispatch =
    dto.scheduleType === 'instant' && (isTopicCampaign || tokens.length > 0);

  if (shouldDispatch) {
    const queue = getCampaignsQueue();
    await queue.add(
      CAMPAIGN_JOB_NAMES.DISPATCH,
      { campaignId: campaign.id },
      { jobId: `dispatch-${campaign.id}` },
    );
    logger.info(`[createCampaign] Campaign ${campaign.id} enqueued for dispatch`);
  }

  const recipientDescription = isTopicCampaign
    ? `topic "${fcmTopic}"`
    : `${tokens.length} recipients`;

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    totalCount: campaign.totalCount,
    message: shouldDispatch
      ? `Campaign "${campaign.name}" created and queued for ${recipientDescription}.`
      : `Campaign "${campaign.name}" saved.`,
  };
}

// ─── List Campaigns ───────────────────────────────────────────────────────────

export async function listCampaignsUseCase(dto: ListCampaignsDto) {
  const { page, pageSize, status, search, sortBy, sortOrder } = dto;

  const where = {
    ...(status ? { status: status as CampaignStatus } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { title: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [totalItems, items] = await Promise.all([
    prisma.campaign.count({ where }),
    prisma.campaign.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        channel: true,
        title: true,
        body: true,
        audienceType: true,
        platform: true,
        priority: true,
        notificationType: true,
        totalCount: true,
        sentCount: true,
        failedCount: true,
        scheduledAt: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    items,
    totalItems,
    totalPages,
    currentPage: page,
    pageSize,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

// ─── Get Campaign by ID ───────────────────────────────────────────────────────

export async function getCampaignByIdUseCase(id: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      channel: true,
      title: true,
      body: true,
      imageUrl: true,
      deepLinkUrl: true,
      ctaLabel: true,
      silent: true,
      audienceType: true,
      platform: true,
      priority: true,
      notificationType: true,
      totalCount: true,
      sentCount: true,
      failedCount: true,
      scheduledAt: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
      metadata: true,
    },
  });

  if (!campaign) {
    throw new AppError(`Campaign ${id} not found`, 404, true, 'CAMPAIGN_NOT_FOUND');
  }

  const propertyCode = getPropertyCodeFromMetadata(campaign.metadata);
  return { ...campaign, propertyCode: propertyCode ?? null };
}

// ─── Cancel Campaign ──────────────────────────────────────────────────────────

export async function cancelCampaignUseCase(id: string): Promise<void> {
  const campaign = await prisma.campaign.findUnique({ where: { id } });

  if (!campaign) {
    throw new AppError(`Campaign ${id} not found`, 404, true, 'CAMPAIGN_NOT_FOUND');
  }

  const cancellable: CampaignStatus[] = [
    CampaignStatus.DRAFT,
    CampaignStatus.SCHEDULED,
    CampaignStatus.RUNNING,
  ];

  if (!cancellable.includes(campaign.status)) {
    throw new AppError(
      `Campaign cannot be cancelled in status ${campaign.status}`,
      409,
      true,
      'CAMPAIGN_NOT_CANCELLABLE',
    );
  }

  await prisma.campaign.update({
    where: { id },
    data: { status: CampaignStatus.CANCELLED },
  });
}
