import { MonitoringService } from './monitoringService.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import {
  dbAdminAccountEmailActivity,
  dbAdminAccountStorageUsage,
  dbAdminEmailSummary,
} from '../repositories/types/dbTypes.js';
import type {
  MonitoringHealthResponse,
  MonitoringPerformanceResponse,
} from '../responseFormatters/MonitoringResponseFormatter.js';

export interface AdminAnalyticsSummary {
  generatedAt: string;
  accounts: {
    total: number;
    withEmailActivity: number;
    topStorageAccounts: AdminAccountStorageMetric[];
  };
  storage: {
    totalAttachmentBytes: number;
    totalAttachments: number;
    byAccount: AdminAccountStorageMetric[];
  };
  email: {
    totalEmails: number;
    totalRecipients: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    bounceCount: number;
    openCount: number;
    clickCount: number;
    deliverySuccessRate: number;
    bounceRate: number;
    openRate: number;
    clickRate: number;
    perAccount: AdminAccountEmailMetric[];
  };
  monitoring: {
    health: Awaited<ReturnType<MonitoringService['getHealthOverview']>>['body'];
    performance: Awaited<ReturnType<MonitoringService['getPerformanceMetrics']>>;
  };
}

export interface AdminAccountStorageMetric {
  accountId: string;
  accountName: string;
  attachmentBytes: number;
  attachmentCount: number;
}

export interface AdminAccountEmailMetric {
  accountId: string;
  accountName: string;
  emailCount: number;
  totalRecipients: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  bounceCount: number;
  openCount: number;
  clickCount: number;
  lastSentAt: string | null;
  deliverySuccessRate: number;
  openRate: number;
  clickRate: number;
}

export class AdminAnalyticsService {
  private readonly monitoringService: MonitoringService;
  private readonly adminAnalyticsRepository = RepositoryFactory.getAdminAnalyticsRepository();

  constructor(monitoringService?: MonitoringService) {
    this.monitoringService = monitoringService ?? new MonitoringService();
  }

  async getSummary(): Promise<AdminAnalyticsSummary> {
    const [totalAccounts, storageUsage, emailSummary, accountEmailActivity, health, performance] =
      await Promise.all([
        this.adminAnalyticsRepository.getTotalAccountCount(),
        this.adminAnalyticsRepository.getAccountStorageUsage(),
        this.adminAnalyticsRepository.getEmailSummary(),
        this.adminAnalyticsRepository.getAccountEmailActivity(),
        this.monitoringService.getHealthOverview(),
        this.monitoringService.getPerformanceMetrics(15),
      ]);

    const storageMetrics = this.buildStorageMetrics(storageUsage);
    const emailMetrics = this.buildEmailMetrics(emailSummary, accountEmailActivity);

    const normalizedHealth = this.normalizeHealthResponse(health.body);
    const normalizedPerformance = this.normalizePerformanceResponse(performance);

    return {
      generatedAt: new Date().toISOString(),
      accounts: {
        total: totalAccounts,
        withEmailActivity: emailMetrics.perAccount.length,
        topStorageAccounts: storageMetrics.byAccount.slice(0, 5),
      },
      storage: storageMetrics,
      email: emailMetrics,
      monitoring: {
        health: normalizedHealth,
        performance: normalizedPerformance,
      },
    };
  }

  private buildStorageMetrics(
    storageUsage: dbAdminAccountStorageUsage[],
  ): AdminAnalyticsSummary['storage'] {
    const byAccount = storageUsage.map<AdminAccountStorageMetric>((usage) => ({
      accountId: usage.accountId.toString(),
      accountName: usage.accountName,
      attachmentBytes: Number(usage.attachmentBytes ?? BigInt(0)),
      attachmentCount: usage.attachmentCount,
    }));

    const totals = byAccount.reduce(
      (accumulator, item) => {
        return {
          totalBytes: accumulator.totalBytes + item.attachmentBytes,
          totalAttachments: accumulator.totalAttachments + item.attachmentCount,
        };
      },
      { totalBytes: 0, totalAttachments: 0 },
    );

    return {
      totalAttachmentBytes: totals.totalBytes,
      totalAttachments: totals.totalAttachments,
      byAccount,
    };
  }

  private buildEmailMetrics(
    emailSummary: dbAdminEmailSummary,
    accountEmailActivity: dbAdminAccountEmailActivity[],
  ): AdminAnalyticsSummary['email'] {
    const perAccount = accountEmailActivity.map<AdminAccountEmailMetric>((row) => {
      const deliverySuccessRate = this.calculateRate(row.successfulDeliveries, row.totalRecipients);
      const openRate = this.calculateRate(row.openCount, row.totalRecipients);
      const clickRate = this.calculateRate(row.clickCount, row.totalRecipients);

      return {
        accountId: row.accountId.toString(),
        accountName: row.accountName,
        emailCount: row.emailCount,
        totalRecipients: row.totalRecipients,
        successfulDeliveries: row.successfulDeliveries,
        failedDeliveries: row.failedDeliveries,
        bounceCount: row.bounceCount,
        openCount: row.openCount,
        clickCount: row.clickCount,
        lastSentAt: row.lastSentAt ? row.lastSentAt.toISOString() : null,
        deliverySuccessRate,
        openRate,
        clickRate,
      };
    });

    const deliverySuccessRate = this.calculateRate(
      emailSummary.successfulDeliveries,
      emailSummary.totalRecipients,
    );
    const bounceRate = this.calculateRate(emailSummary.bounceCount, emailSummary.totalRecipients);
    const openRate = this.calculateRate(emailSummary.openCount, emailSummary.totalRecipients);
    const clickRate = this.calculateRate(emailSummary.clickCount, emailSummary.totalRecipients);

    return {
      totalEmails: emailSummary.totalEmails,
      totalRecipients: emailSummary.totalRecipients,
      successfulDeliveries: emailSummary.successfulDeliveries,
      failedDeliveries: emailSummary.failedDeliveries,
      bounceCount: emailSummary.bounceCount,
      openCount: emailSummary.openCount,
      clickCount: emailSummary.clickCount,
      deliverySuccessRate,
      bounceRate,
      openRate,
      clickRate,
      perAccount,
    };
  }

  private calculateRate(numerator: number, denominator: number): number {
    if (!denominator) {
      return 0;
    }

    return Number(((numerator / denominator) * 100).toFixed(2));
  }

  private normalizeHealthResponse(response: MonitoringHealthResponse): MonitoringHealthResponse {
    const queryPatterns =
      response.performance.queries.queryPatterns instanceof Map
        ? Object.fromEntries(response.performance.queries.queryPatterns)
        : response.performance.queries.queryPatterns;

    return {
      ...response,
      performance: {
        ...response.performance,
        queries: {
          ...response.performance.queries,
          queryPatterns,
        },
      },
    };
  }

  private normalizePerformanceResponse(
    performance: MonitoringPerformanceResponse,
  ): MonitoringPerformanceResponse {
    const queryPatterns =
      performance.queryPatterns instanceof Map
        ? Object.fromEntries(performance.queryPatterns)
        : performance.queryPatterns;

    return {
      ...performance,
      slowQueries: performance.slowQueries.map((query) => ({
        ...query,
        timestamp:
          typeof query.timestamp === 'string'
            ? query.timestamp
            : new Date(query.timestamp).toISOString(),
      })),
      queryPatterns,
    };
  }
}
