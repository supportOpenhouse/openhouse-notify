/**
 * Remove campaigns from Postgres and linked notification rows.
 *
 * By default only targets finished campaigns (COMPLETED, FAILED, CANCELLED).
 * Use --all to remove every campaign regardless of status (still destructive).
 *
 * BullMQ jobs in Redis are not touched; clear the campaigns queue manually if needed.
 *
 * Usage (from backend/):
 *   npm run db:clean-campaigns                           # dry-run: counts only
 *   npm run db:clean-campaigns -- --execute            # delete finished campaigns
 *   npm run db:clean-campaigns -- --execute --older-than-days=30
 *   npm run db:clean-campaigns -- --execute --all      # delete ALL campaigns
 */
/* eslint-disable no-console -- CLI script */
import 'dotenv/config';
import { PrismaClient, CampaignStatus, type Prisma } from '@prisma/client';

const FINISHED_STATUSES: CampaignStatus[] = [
  CampaignStatus.COMPLETED,
  CampaignStatus.FAILED,
  CampaignStatus.CANCELLED,
];

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL },
  },
});

function parseArgs() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(`
clean-old-campaigns — remove campaigns (and their notification rows) from the DB.

Options:
  --execute              Perform deletes (without this, dry-run only).
  --all                  Match every campaign status (not only finished).
  --older-than-days=N    Only rows with updatedAt older than N days (applies to matched campaigns).

Examples:
  npm run db:clean-campaigns
  npm run db:clean-campaigns -- --execute
  npm run db:clean-campaigns -- --execute --older-than-days=90
  npm run db:clean-campaigns -- --execute --all
`);
    process.exit(0);
  }

  const execute = argv.includes('--execute');
  const all = argv.includes('--all');
  let olderThanDays: number | undefined;
  for (const a of argv) {
    if (a.startsWith('--older-than-days=')) {
      const n = Number(a.slice('--older-than-days='.length));
      if (!Number.isFinite(n) || n < 0) {
        console.error('Invalid --older-than-days value');
        process.exit(1);
      }
      olderThanDays = n;
    }
  }
  return { execute, all, olderThanDays };
}

function buildWhere(opts: {
  all: boolean;
  olderThanDays?: number;
}): Prisma.CampaignWhereInput {
  const ageFilter =
    opts.olderThanDays !== undefined
      ? {
          updatedAt: {
            lt: new Date(Date.now() - opts.olderThanDays * 24 * 60 * 60 * 1000),
          },
        }
      : {};

  if (opts.all) {
    return ageFilter;
  }

  return {
    status: { in: FINISHED_STATUSES },
    ...ageFilter,
  };
}

async function main() {
  const { execute, all, olderThanDays } = parseArgs();
  const where = buildWhere({ all, olderThanDays });

  const [total, totalNotifications, preview] = await Promise.all([
    prisma.campaign.count({ where }),
    prisma.notification.count({ where: { campaign: where } }),
    prisma.campaign.findMany({
      where,
      select: { id: true, name: true, status: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    }),
  ]);

  console.log(
    `\nMatched campaigns: ${total}` +
      (all ? ' (--all statuses)' : ` (statuses: ${FINISHED_STATUSES.join(', ')})`) +
      (olderThanDays !== undefined ? ` | updatedAt older than ${olderThanDays}d` : ''),
  );
  console.log(`Linked notifications (rows with campaignId in matched set): ${totalNotifications}`);
  if (preview.length > 0) {
    console.log('\nSample (up to 20, newest updatedAt first):');
    for (const c of preview) {
      console.log(`  - ${c.id} | ${c.status} | ${c.name.slice(0, 60)}${c.name.length > 60 ? '…' : ''} | ${c.updatedAt.toISOString()}`);
    }
    if (total > preview.length) {
      console.log(`  … and ${total - preview.length} more`);
    }
  }

  if (!execute) {
    console.log('\nDry run only. Re-run with --execute to delete.\n');
    return;
  }

  if (total === 0) {
    console.log('\nNothing to delete.\n');
    return;
  }

  const [notifResult, campaignResult] = await prisma.$transaction([
    prisma.notification.deleteMany({ where: { campaign: where } }),
    prisma.campaign.deleteMany({ where }),
  ]);
  const deletedNotifications = notifResult.count;
  const deletedCampaigns = campaignResult.count;

  console.log(
    `\nDone. Deleted ${deletedCampaigns} campaign(s) and ${deletedNotifications} notification row(s). ` +
      `CampaignRecipient rows removed via ON DELETE CASCADE.\n`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
