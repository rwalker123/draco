import { ServiceFactory } from './serviceFactory.js';
import prisma from '../lib/prisma.js';
import type { AdminDashboardSummaryType } from '@draco/shared-schemas';
import { AccountSettingsService } from './accountSettingsService.js';

export class AdminDashboardService {
  private readonly accountSettingsService: AccountSettingsService;

  constructor() {
    this.accountSettingsService = ServiceFactory.getAccountSettingsService();
  }
  async getDashboardSummary(accountId: bigint): Promise<AdminDashboardSummaryType> {
    const [accountMetrics, seasonMetrics, communityMetrics, contentMetrics] = await Promise.all([
      this.getAccountMetrics(accountId),
      this.getSeasonMetrics(accountId),
      this.getCommunityMetrics(accountId),
      this.getContentMetrics(accountId),
    ]);

    return {
      account: accountMetrics,
      season: seasonMetrics,
      community: communityMetrics,
      content: contentMetrics,
    };
  }

  private async getAccountMetrics(
    accountId: bigint,
  ): Promise<AdminDashboardSummaryType['account']> {
    const [userCount, sponsorCount, memberBusinessCount] = await Promise.all([
      prisma.contacts.count({ where: { creatoraccountid: accountId } }),
      prisma.sponsors.count({ where: { accountid: accountId } }),
      prisma.memberbusiness.count({
        where: {
          contacts: { creatoraccountid: accountId },
        },
      }),
    ]);

    return {
      userCount,
      recentCommunicationsCount: 0,
      socialPlatformsConnected: 0,
      sponsorCount,
      memberBusinessCount,
    };
  }

  private async getSeasonMetrics(accountId: bigint): Promise<AdminDashboardSummaryType['season']> {
    const seasonService = ServiceFactory.getSeasonService();
    const currentSeason = await seasonService.getCurrentSeason(accountId);

    const [fieldCount, umpireCount, upcomingWorkouts] = await Promise.all([
      prisma.availablefields.count({ where: { accountid: accountId } }),
      prisma.leagueumpires.count({ where: { accountid: accountId } }),
      prisma.workoutannouncement.count({
        where: {
          accountid: accountId,
          workoutdate: { gte: new Date() },
        },
      }),
    ]);

    return {
      currentSeasonName: currentSeason?.name ?? null,
      fieldCount,
      umpireCount,
      upcomingWorkouts,
    };
  }

  private async getCommunityMetrics(
    accountId: bigint,
  ): Promise<AdminDashboardSummaryType['community']> {
    const [specialAnnouncementsCount, accountSettings, hallOfFameMembersCount, pendingPhotosCount] =
      await Promise.all([
        prisma.leaguenews.count({
          where: { accountid: accountId, specialannounce: true },
        }),
        this.accountSettingsService.getAccountSettings(accountId),
        prisma.hof.count({ where: { accountid: accountId } }),
        prisma.photogallerysubmission.count({
          where: { accountid: accountId, status: 'Pending' },
        }),
      ]);

    const surveySetting = accountSettings.find(
      (setting) => setting.definition.key === 'ShowPlayerSurvey',
    );

    return {
      specialAnnouncementsCount,
      activePollsCount: 0,
      surveysEnabled: Boolean(surveySetting?.effectiveValue),
      hallOfFameMembersCount,
      pendingPhotosCount,
    };
  }

  private async getContentMetrics(
    accountId: bigint,
  ): Promise<AdminDashboardSummaryType['content']> {
    const [faqCount, handoutCount, infoMessageCount] = await Promise.all([
      prisma.leaguefaq.count({ where: { accountid: accountId } }),
      prisma.accounthandouts.count({ where: { accountid: accountId } }),
      prisma.accountwelcome.count({ where: { accountid: accountId } }),
    ]);

    return {
      faqCount,
      handoutCount,
      infoMessageCount,
    };
  }
}
