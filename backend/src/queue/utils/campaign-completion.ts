import { CampaignStatus, NotificationStatus } from '@prisma/client';
import { prisma } from '@infrastructure/database';
import { logger } from '@infrastructure/logger';

/**
 * Checks whether all recipients for a campaign have been processed.
 * If none are PENDING or QUEUED, marks the campaign as COMPLETED (or FAILED
 * if every recipient failed).
 *
 * Designed to be called at the end of every fcm-batch job.
 */
export async function checkCampaignCompletion(campaignId: string): Promise<void> {
  const pendingCount = await prisma.campaignRecipient.count({
    where: {
      campaignId,
      status: { in: [NotificationStatus.PENDING, NotificationStatus.QUEUED] },
    },
  });

  if (pendingCount > 0) return;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true, sentCount: true, failedCount: true, totalCount: true },
  });

  if (!campaign || campaign.status !== CampaignStatus.RUNNING) return;

  const newStatus =
    campaign.sentCount === 0 ? CampaignStatus.FAILED : CampaignStatus.COMPLETED;

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: newStatus, completedAt: new Date() },
  });

  logger.info(
    `[campaign-completion] Campaign ${campaignId} → ${newStatus} ` +
      `(sent: ${campaign.sentCount}, failed: ${campaign.failedCount})`,
  );
}
