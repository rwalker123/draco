import { PrismaClient } from '#prisma/client';
import {
  dbAdminAccountEmailActivity,
  dbAdminAccountStorageUsage,
  dbAdminEmailSummary,
} from '../types/index.js';
import { IAdminAnalyticsRepository } from '../interfaces/IAdminAnalyticsRepository.js';

export class PrismaAdminAnalyticsRepository implements IAdminAnalyticsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getTotalAccountCount(): Promise<number> {
    return this.prisma.accounts.count();
  }

  async getAccountStorageUsage(): Promise<dbAdminAccountStorageUsage[]> {
    const attachments = await this.prisma.email_attachments.findMany({
      select: {
        file_size: true,
        email: {
          select: {
            account_id: true,
            accounts: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const usageMap = new Map<bigint, dbAdminAccountStorageUsage>();

    attachments.forEach((attachment) => {
      const accountId = attachment.email.account_id;
      const accountName = attachment.email.accounts?.name ?? 'Unknown account';
      const existing = usageMap.get(accountId);
      const fileSize = attachment.file_size ?? BigInt(0);

      if (existing) {
        existing.attachmentBytes += fileSize;
        existing.attachmentCount += 1;
      } else {
        usageMap.set(accountId, {
          accountId,
          accountName,
          attachmentBytes: fileSize,
          attachmentCount: 1,
        });
      }
    });

    return Array.from(usageMap.values()).sort((a, b) => {
      const aBytes = Number(a.attachmentBytes);
      const bBytes = Number(b.attachmentBytes);
      return bBytes - aBytes;
    });
  }

  async getEmailSummary(): Promise<dbAdminEmailSummary> {
    const summary = await this.prisma.emails.aggregate({
      _count: { _all: true },
      _sum: {
        total_recipients: true,
        successful_deliveries: true,
        failed_deliveries: true,
        bounce_count: true,
        open_count: true,
        click_count: true,
      },
    });

    return {
      totalEmails: summary._count._all ?? 0,
      totalRecipients: summary._sum.total_recipients ?? 0,
      successfulDeliveries: summary._sum.successful_deliveries ?? 0,
      failedDeliveries: summary._sum.failed_deliveries ?? 0,
      bounceCount: summary._sum.bounce_count ?? 0,
      openCount: summary._sum.open_count ?? 0,
      clickCount: summary._sum.click_count ?? 0,
    };
  }

  async getAccountEmailActivity(): Promise<dbAdminAccountEmailActivity[]> {
    const grouped = await this.prisma.emails.groupBy({
      by: ['account_id'],
      _count: { _all: true },
      _sum: {
        total_recipients: true,
        successful_deliveries: true,
        failed_deliveries: true,
        bounce_count: true,
        open_count: true,
        click_count: true,
      },
      _max: {
        sent_at: true,
      },
    });

    if (grouped.length === 0) {
      return [];
    }

    const accountIds = grouped.map((item) => item.account_id);
    const accounts = await this.prisma.accounts.findMany({
      where: { id: { in: accountIds } },
      select: {
        id: true,
        name: true,
      },
    });

    const accountNameMap = new Map<bigint, string>();
    accounts.forEach((account) => {
      accountNameMap.set(account.id, account.name);
    });

    return grouped
      .map<dbAdminAccountEmailActivity>((row) => {
        const accountName = accountNameMap.get(row.account_id) ?? 'Unknown account';

        return {
          accountId: row.account_id,
          accountName,
          emailCount: row._count._all ?? 0,
          totalRecipients: row._sum.total_recipients ?? 0,
          successfulDeliveries: row._sum.successful_deliveries ?? 0,
          failedDeliveries: row._sum.failed_deliveries ?? 0,
          bounceCount: row._sum.bounce_count ?? 0,
          openCount: row._sum.open_count ?? 0,
          clickCount: row._sum.click_count ?? 0,
          lastSentAt: row._max.sent_at ?? null,
        };
      })
      .sort((a, b) => b.totalRecipients - a.totalRecipients);
  }
}
