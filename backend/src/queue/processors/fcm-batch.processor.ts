import { Job } from 'bullmq';
import { NotificationStatus } from '@prisma/client';
import { prisma } from '@infrastructure/database';
import { sendFcmBatch } from '@providers/fcm.send';
import { logger } from '@infrastructure/logger';
import { checkCampaignCompletion } from '@queue/utils/campaign-completion';
import { FcmBatchJobData } from '@queue/jobs/campaign.jobs';

/**
 * Sends one FCM multicast batch and updates recipient statuses + campaign counters.
 */
export async function fcmBatchProcessor(job: Job<FcmBatchJobData>): Promise<void> {
  const {
    campaignId,
    tokens,
    batchIndex,
    title,
    body,
    imageUrl,
    deepLinkUrl,
    propertyCode,
    notificationId,
    data,
  } = job.data;

  logger.info(
    `[fcm:batch] Campaign ${campaignId} batch ${batchIndex}: sending ${tokens.length} tokens | ` +
    `propertyCode=${propertyCode ?? '(none)'} | notificationId=${notificationId ?? '(none — killed-state nav may break)'}`,
  );

  const result = await sendFcmBatch({
    tokens,
    title,
    body,
    imageUrl,
    deepLinkUrl,
    propertyCode,
    notificationId,
    data,
  });

  const now = new Date();
  const successTokens: string[] = [];
  const failedEntries: Array<{ token: string; errorMsg: string }> = [];

  result.responses.forEach((resp, idx) => {
    if (resp.success) {
      successTokens.push(tokens[idx]);
    } else {
      failedEntries.push({
        token: tokens[idx],
        errorMsg: resp.errorMessage ?? 'FCM delivery failed',
      });
    }
  });

  // Batch-update sent tokens
  if (successTokens.length > 0) {
    await prisma.campaignRecipient.updateMany({
      where: { campaignId, token: { in: successTokens } },
      data: { status: NotificationStatus.SENT, sentAt: now },
    });
  }

  // Update failed tokens individually (to capture per-token error message)
  for (const { token, errorMsg } of failedEntries) {
    await prisma.campaignRecipient.updateMany({
      where: { campaignId, token },
      data: { status: NotificationStatus.FAILED, failedAt: now, errorMsg },
    });
  }

  // Update campaign counters atomically
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      sentCount: { increment: successTokens.length },
      failedCount: { increment: failedEntries.length },
    },
  });

  logger.info(
    `[fcm:batch] Campaign ${campaignId} batch ${batchIndex}: ` +
      `${successTokens.length} sent, ${failedEntries.length} failed`,
  );

  // Check if all batches for this campaign are done
  await checkCampaignCompletion(campaignId);
}
