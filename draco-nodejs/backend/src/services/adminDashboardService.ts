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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      userCount,
      sponsorCount,
      memberBusinessCount,
      recentCommunicationsCount,
      discordSettings,
      twitterCreds,
      facebookCreds,
      blueskyCreds,
    ] = await Promise.all([
      prisma.contacts.count({ where: { creatoraccountid: accountId } }),
      prisma.sponsors.count({ where: { accountid: accountId } }),
      prisma.memberbusiness.count({
        where: {
          contacts: { creatoraccountid: accountId },
        },
      }),
      prisma.emails.count({
        where: {
          account_id: accountId,
          sent_at: { gte: thirtyDaysAgo },
        },
      }),
      prisma.accountdiscordsettings.findUnique({ where: { accountid: accountId } }),
      prisma.accounttwittercredentials.findUnique({ where: { accountid: accountId } }),
      prisma.accountfacebookcredentials.findUnique({ where: { accountid: accountId } }),
      prisma.accountblueskycredentials.findUnique({ where: { accountid: accountId } }),
    ]);

    let socialPlatformsConnected = 0;
    if (discordSettings?.guildid) socialPlatformsConnected++;
    if (twitterCreds?.useraccesstoken) socialPlatformsConnected++;
    if (facebookCreds?.useraccesstoken) socialPlatformsConnected++;
    if (blueskyCreds) socialPlatformsConnected++;

    return {
      userCount,
      recentCommunicationsCount,
      socialPlatformsConnected,
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
    const [
      specialAnnouncementsCount,
      activePollsCount,
      accountSettings,
      hallOfFameMembersCount,
      pendingPhotosCount,
    ] = await Promise.all([
      prisma.leaguenews.count({
        where: { accountid: accountId, specialannounce: true },
      }),
      prisma.votequestion.count({
        where: { accountid: accountId, active: true },
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
      activePollsCount,
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
      prisma.accountwelcome.count({
        where: {
          accountid: accountId,
          OR: [{ teamid: null }, { teamid: BigInt(0) }],
        },
      }),
    ]);

    return {
      faqCount,
      handoutCount,
      infoMessageCount,
    };
  }
}
