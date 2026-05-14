import { Job } from 'bullmq';
import { CampaignStatus } from '@prisma/client';
import { prisma } from '@infrastructure/database';
import { getFcmBatchQueue } from '@infrastructure/queue/app-queues';
import { logger } from '@infrastructure/logger';
import { sendFcmTopic } from '@providers/fcm.send';
import { asMetadataRecord, getPropertyCodeFromMetadata } from '@utils/campaign-metadata';
import {
  CampaignDispatchJobData,
  FcmBatchJobData,
  CAMPAIGN_JOB_NAMES,
} from '@queue/jobs/campaign.jobs';

const FCM_BATCH_SIZE = 500;

/**
 * Handles a campaign:dispatch job.
 *
 * - Topic campaigns (all_users, all_brokers, etc.):
 *     Sends a single FCM topic message → Firebase fans out to all subscribers.
 *     Completes in one call, no fcm:batch jobs needed.
 *
 * - Token campaigns (csv, manual, segment):
 *     Paginates CampaignRecipient rows and fans out fcm:batch jobs (500 tokens each).
 */
export async function campaignDispatchProcessor(
  job: Job<CampaignDispatchJobData>,
): Promise<void> {
  const { campaignId } = job.data;

  logger.info(`[campaign:dispatch] Starting campaign ${campaignId}`);

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    select: {
      id: true,
      title: true,
      body: true,
      imageUrl: true,
      deepLinkUrl: true,
      metadata: true,
      fcmTopic: true,
      status: true,
    },
  });

  const propertyCode = getPropertyCodeFromMetadata(campaign.metadata);

  logger.info(
    `[campaign:dispatch] Campaign ${campaignId} | ` +
    `propertyCode=${propertyCode ?? '(none — notification will NOT deep-link to PropertyScreen)'} | ` +
    `topic=${campaign.fcmTopic ?? '(token-based)'} | ` +
    `notificationId=${campaignId} (campaignId used as notificationId for killed-state nav timing)`,
  );

  logger.info('[campaign:dispatch] Full FCM payload preview:', {
    campaignId,
    title: campaign.title,
    body: campaign.body,
    imageUrl: campaign.imageUrl ?? '(none)',
    deepLinkUrl: campaign.deepLinkUrl ?? '(none)',
    propertyCode: propertyCode ?? '(none)',
    notificationId: campaignId,
    dataBlock: {
      ...(propertyCode ? {
        type: 'property',
        propertyId: propertyCode,
        url: `/property/${propertyCode}`,
      } : {}),
      notificationId: campaignId,
    },
  });

  if (campaign.status === CampaignStatus.CANCELLED) {
    logger.warn(`[campaign:dispatch] Campaign ${campaignId} cancelled — skipping`);
    return;
  }

  // Record startedAt (status already RUNNING, set by the API on creation)
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { startedAt: new Date() },
  });

  // ── Topic broadcast path ────────────────────────────────────────────────────
  if (campaign.fcmTopic) {
    logger.info(
      `[campaign:dispatch] Campaign ${campaignId}: sending to topic "${campaign.fcmTopic}"`,
    );
    try {
      const { messageId } = await sendFcmTopic({
        topic: campaign.fcmTopic,
        title: campaign.title,
        body: campaign.body,
        imageUrl: campaign.imageUrl ?? undefined,
        deepLinkUrl: campaign.deepLinkUrl ?? undefined,
        propertyCode: propertyCode ?? undefined,
        // Use campaignId as notificationId — mirrors Django's notification.id.
        // The app calls updateNotificationStatus() when notificationId is present,
        // creating the HTTP timing buffer needed for killed-state navigation.
        notificationId: campaignId,
      });

      const prevMeta = asMetadataRecord(campaign.metadata);
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: CampaignStatus.COMPLETED,
          completedAt: new Date(),
          sentCount: 1, // represents 1 successful topic message (Firebase fans it out)
          metadata: { ...prevMeta, messageId, deliveryMode: 'topic' },
        },
      });

      logger.info(
        `[campaign:dispatch] Campaign ${campaignId} → COMPLETED via topic (messageId: ${messageId})`,
      );
    } catch (err) {
      logger.error(`[campaign:dispatch] Topic send failed for campaign ${campaignId}`, { err });
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: CampaignStatus.FAILED, completedAt: new Date() },
      });
    }
    return;
  }

  // ── Token multicast path ────────────────────────────────────────────────────
  const PAGE_SIZE = 5000;
  let cursor: string | undefined;
  const allTokenBatches: string[][] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rows = await prisma.campaignRecipient.findMany({
      where: { campaignId, status: 'PENDING' },
      select: { id: true, token: true },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    });

    if (rows.length === 0) break;
    cursor = rows[rows.length - 1].id;

    for (let i = 0; i < rows.length; i += FCM_BATCH_SIZE) {
      allTokenBatches.push(rows.slice(i, i + FCM_BATCH_SIZE).map((r) => r.token));
    }

    if (rows.length < PAGE_SIZE) break;
  }

  const totalBatches = allTokenBatches.length;

  if (totalBatches === 0) {
    logger.warn(`[campaign:dispatch] Campaign ${campaignId} has no recipients — marking completed`);
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.COMPLETED, completedAt: new Date() },
    });
    return;
  }

  const fcmBatchQueue = getFcmBatchQueue();

  const jobs = allTokenBatches.map((tokens, idx) => {
    const data: FcmBatchJobData = {
      campaignId,
      tokens,
      batchIndex: idx,
      totalBatches,
      title: campaign.title,
      body: campaign.body,
      imageUrl: campaign.imageUrl ?? undefined,
      deepLinkUrl: campaign.deepLinkUrl ?? undefined,
      propertyCode: propertyCode ?? undefined,
      // Use campaignId as notificationId — mirrors Django's notification.id.
      // The app calls updateNotificationStatus() when notificationId is present,
      // creating the HTTP timing buffer needed for killed-state navigation.
      notificationId: campaignId,
    };
    return {
      name: CAMPAIGN_JOB_NAMES.FCM_BATCH,
      data,
      opts: { jobId: `fcm-batch-${campaignId}-${idx}` },
    };
  });

  await fcmBatchQueue.addBulk(jobs);

  logger.info(
    `[campaign:dispatch] Campaign ${campaignId}: enqueued ${totalBatches} FCM batch jobs | ` +
    `propertyCode=${propertyCode ?? '(none)'} | notificationId=${campaignId}`,
  );
}
