import { RoleService } from './roleService.js';
import { TeamService } from './teamService.js';
import { PlayerClassifiedService } from './player-classified/playerClassifiedService.js';
import { CleanupService } from './cleanupService.js';
import { RouteProtection } from '../middleware/routeProtection.js';
import { RosterService } from './rosterService.js';
import { ContactService } from './contactService.js';
import {
  IRoleService,
  IRoleQuery,
  IRoleVerification,
  IRoleManagement,
  IRoleMiddleware,
} from './interfaces/roleInterfaces.js';
import { ICleanupService } from '../interfaces/cleanupInterfaces.js';
import { cleanupConfig } from '../config/cleanup.js';
import prisma from '../lib/prisma.js';
import { SeasonManagerService } from './seasonManagerService.js';
import { RegistrationService } from './registrationService.js';
import { AuthService } from './authService.js';
import { ContactDependencyService } from './contactDependencyService.js';
import { ContactPhotoService } from './contactPhotoService.js';
import { StatisticsService } from './statisticsService.js';
import { TeamStatsService } from './teamStatsService.js';
import { TeamManagerService } from './teamManagerService.js';
import { EmailTemplateService } from './emailTemplateService.js';
import { AccountsService } from './accountsService.js';
import { EmailAttachmentService } from './emailAttachmentService.js';
import { EmailService } from './emailService.js';
import { WorkoutService } from './workoutService.js';
import { PlayerClassifiedAccessService } from './player-classified/PlayerClassifiedAccessService.js';
import { PlayerClassifiedEmailService } from './player-classified/PlayerClassifiedEmailService.js';
import { SponsorService } from './sponsorService.js';
import { PollService } from './pollService.js';
import { FieldService } from './fieldService.js';
import { UmpireService } from './umpireService.js';
import { ScheduleService } from './scheduleService.js';
import { SchedulerEngineService } from './schedulerEngineService.js';
import { LeagueService } from './LeagueService.js';
import { LeagueFaqService } from './LeagueFaqService.js';
import { MonitoringService } from './monitoringService.js';
import { UserService } from './userService.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { SeasonService } from './seasonService.js';
import { TurnstileService } from './turnstileService.js';
import { HandoutService } from './handoutService.js';
import { AdminAnalyticsService } from './adminAnalyticsService.js';
import { PhotoSubmissionService } from './photoSubmissionService.js';
import { PhotoGalleryService } from './photoGalleryService.js';
import { PhotoGalleryAdminService } from './photoGalleryAdminService.js';
import { PhotoGalleryApprovalService } from './photoGalleryApprovalService.js';
import { PhotoGalleryAssetService } from './photoGalleryAssetService.js';
import { PhotoSubmissionModerationService } from './photoSubmissionModerationService.js';
import { PhotoSubmissionAssetService } from './photoSubmissionAssetService.js';
import { PhotoSubmissionNotificationService } from './photoSubmissionNotificationService.js';
import { WorkoutRegistrationEmailService } from './workoutRegistrationEmailService.js';
import { MemberBusinessService } from './memberBusinessService.js';
import { HallOfFameService } from './hallOfFameService.js';
import { HofNominationService } from './hofNominationService.js';
import { HofSetupService } from './hofSetupService.js';
import { StatsEntryService } from './statsEntryService.js';
import { PlayerSurveyService } from './playerSurveyService.js';
import { AnnouncementService } from './announcementService.js';
import { AccountSettingsService } from './accountSettingsService.js';
import { SocialHubService } from './socialHubService.js';
import { socialIngestionConfig } from '../config/socialIngestion.js';
import { SocialIngestionService } from './socialIngestion/socialIngestionService.js';
import { TwitterConnector } from './socialIngestion/connectors/twitterConnector.js';
import { BlueskyConnector } from './socialIngestion/connectors/blueskyConnector.js';
import { YouTubeConnector } from './socialIngestion/connectors/youtubeConnector.js';
import { DiscordConnector } from './socialIngestion/connectors/discordConnector.js';
import { InstagramConnector } from './socialIngestion/connectors/instagramConnector.js';
import { DiscordIntegrationService } from './discordIntegrationService.js';
import { YouTubeIntegrationService } from './youtubeIntegrationService.js';
import { TwitterIntegrationService } from './twitterIntegrationService.js';
import { BlueskyIntegrationService } from './blueskyIntegrationService.js';
import { InstagramIntegrationService } from './instagramIntegrationService.js';
import { WelcomeMessageService } from './welcomeMessageService.js';

/**
 * Service factory to provide service instances without direct Prisma dependencies
 * Note: This is a temporary measure during the transition to full dependency injection
 */
export class ServiceFactory {
  private static roleService: RoleService;
  private static teamService: TeamService;
  private static playerClassifiedService: PlayerClassifiedService;
  private static playerClassifiedEmailService: PlayerClassifiedEmailService;
  private static accessService: PlayerClassifiedAccessService;
  private static cleanupService: ICleanupService;
  private static routeProtection: RouteProtection;
  private static rosterService: RosterService;
  private static contactService: ContactService;
  private static seasonService: SeasonService;
  private static seasonManagerService: SeasonManagerService;
  private static registrationService: RegistrationService;
  private static authService: AuthService;
  private static contactDependencyService: ContactDependencyService;
  private static contactPhotoService: ContactPhotoService;
  private static statisticsService: StatisticsService;
  private static teamStatsService: TeamStatsService;
  private static teamManagerService: TeamManagerService;
  private static emailService: EmailService;
  private static emailTemplateService: EmailTemplateService;
  private static emailAttachmentService: EmailAttachmentService;
  private static workoutService: WorkoutService;
  private static workoutRegistrationEmailService: WorkoutRegistrationEmailService;
  private static accountsService: AccountsService;
  private static sponsorService: SponsorService;
  private static memberBusinessService: MemberBusinessService;
  private static pollService: PollService;
  private static fieldService: FieldService;
  private static umpireService: UmpireService;
  private static scheduleService: ScheduleService;
  private static schedulerEngineService: SchedulerEngineService;
  private static leagueService: LeagueService;
  private static leagueFaqService: LeagueFaqService;
  private static monitoringService: MonitoringService;
  private static userService: UserService;
  private static turnstileService: TurnstileService;
  private static handoutService: HandoutService;
  private static adminAnalyticsService: AdminAnalyticsService;
  private static photoSubmissionService: PhotoSubmissionService;
  private static photoGalleryService: PhotoGalleryService;
  private static photoGalleryAdminService: PhotoGalleryAdminService;
  private static photoGalleryApprovalService: PhotoGalleryApprovalService;
  private static photoGalleryAssetService: PhotoGalleryAssetService;
  private static photoSubmissionModerationService: PhotoSubmissionModerationService;
  private static photoSubmissionAssetService: PhotoSubmissionAssetService;
  private static photoSubmissionNotificationService: PhotoSubmissionNotificationService;
  private static hallOfFameService: HallOfFameService;
  private static hofNominationService: HofNominationService;
  private static hofSetupService: HofSetupService;
  private static statsEntryService: StatsEntryService;
  private static playerSurveyService: PlayerSurveyService;
  private static announcementService: AnnouncementService;
  private static accountSettingsService: AccountSettingsService;
  private static socialHubService: SocialHubService;
  private static socialIngestionService: SocialIngestionService;
  private static discordIntegrationService: DiscordIntegrationService;
  private static youtubeIntegrationService: YouTubeIntegrationService;
  private static twitterIntegrationService: TwitterIntegrationService;
  private static blueskyIntegrationService: BlueskyIntegrationService;
  private static instagramIntegrationService: InstagramIntegrationService;
  private static welcomeMessageService: WelcomeMessageService;

  static getRoleService(): IRoleService {
    if (!this.roleService) {
      this.roleService = new RoleService();
    }
    return this.roleService;
  }

  static getRoleQuery(): IRoleQuery {
    return this.getRoleService();
  }

  static getRoleVerification(): IRoleVerification {
    return this.getRoleService();
  }

  static getRoleManagement(): IRoleManagement {
    return this.getRoleService();
  }

  static getRoleMiddleware(): IRoleMiddleware {
    return this.getRoleService();
  }

  static getTeamService(): TeamService {
    if (!this.teamService) {
      this.teamService = new TeamService();
    }
    return this.teamService;
  }

  static getPlayerClassifiedService(): PlayerClassifiedService {
    if (!this.playerClassifiedService) {
      this.playerClassifiedService = new PlayerClassifiedService();
    }
    return this.playerClassifiedService;
  }

  static getCleanupService(): ICleanupService {
    if (!this.cleanupService) {
      this.cleanupService = new CleanupService(cleanupConfig);
    }
    return this.cleanupService;
  }

  static getRouteProtection(): RouteProtection {
    if (!this.routeProtection) {
      this.routeProtection = new RouteProtection();
    }
    return this.routeProtection;
  }

  static getRosterService(): RosterService {
    if (!this.rosterService) {
      const rosterRepository = RepositoryFactory.getRosterRepository();
      const teamRepository = RepositoryFactory.getTeamRepository();
      const contactRepository = RepositoryFactory.getContactRepository();
      this.rosterService = new RosterService(rosterRepository, teamRepository, contactRepository);
    }
    return this.rosterService;
  }

  static getContactService(): ContactService {
    if (!this.contactService) {
      this.contactService = new ContactService();
    }
    return this.contactService;
  }

  static getSeasonService(): SeasonService {
    if (!this.seasonService) {
      this.seasonService = new SeasonService();
    }
    return this.seasonService;
  }

  static getSeasonManagerService(): SeasonManagerService {
    if (!this.seasonManagerService) {
      const managerRepository = RepositoryFactory.getManagerRepository();
      this.seasonManagerService = new SeasonManagerService(managerRepository);
    }
    return this.seasonManagerService;
  }

  static getRegistrationService(): RegistrationService {
    if (!this.registrationService) {
      this.registrationService = new RegistrationService();
    }
    return this.registrationService;
  }

  static getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = new AuthService();
    }
    return this.authService;
  }

  static getContactDependencyService(): ContactDependencyService {
    if (!this.contactDependencyService) {
      this.contactDependencyService = new ContactDependencyService(prisma);
    }
    return this.contactDependencyService;
  }

  static getContactPhotoService(): ContactPhotoService {
    if (!this.contactPhotoService) {
      this.contactPhotoService = new ContactPhotoService();
    }
    return this.contactPhotoService;
  }

  static getStatisticsService(): StatisticsService {
    if (!this.statisticsService) {
      const battingRepository = RepositoryFactory.getBattingStatisticsRepository();
      const pitchingRepository = RepositoryFactory.getPitchingStatisticsRepository();
      const leagueLeadersRepository = RepositoryFactory.getLeagueLeadersDisplayRepository();
      const contactRepository = RepositoryFactory.getContactRepository();
      this.statisticsService = new StatisticsService(
        prisma,
        battingRepository,
        pitchingRepository,
        leagueLeadersRepository,
        contactRepository,
      );
    }
    return this.statisticsService;
  }

  static getTeamStatsService(): TeamStatsService {
    if (!this.teamStatsService) {
      this.teamStatsService = new TeamStatsService();
    }
    return this.teamStatsService;
  }

  static getAccountsService(): AccountsService {
    if (!this.accountsService) {
      this.accountsService = new AccountsService();
    }
    return this.accountsService;
  }

  static getSponsorService(): SponsorService {
    if (!this.sponsorService) {
      this.sponsorService = new SponsorService();
    }
    return this.sponsorService;
  }

  static getMemberBusinessService(): MemberBusinessService {
    if (!this.memberBusinessService) {
      this.memberBusinessService = new MemberBusinessService();
    }
    return this.memberBusinessService;
  }

  static getTeamManagerService(): TeamManagerService {
    if (!this.teamManagerService) {
      const managerRepository = RepositoryFactory.getManagerRepository();
      this.teamManagerService = new TeamManagerService(managerRepository);
    }
    return this.teamManagerService;
  }

  static getEmailTemplateService(): EmailTemplateService {
    if (!this.emailTemplateService) {
      this.emailTemplateService = new EmailTemplateService();
    }
    return this.emailTemplateService;
  }

  static getEmailAttachmentService(): EmailAttachmentService {
    if (!this.emailAttachmentService) {
      this.emailAttachmentService = new EmailAttachmentService();
    }
    return this.emailAttachmentService;
  }

  static getWorkoutService(): WorkoutService {
    if (!this.workoutService) {
      this.workoutService = new WorkoutService();
    }
    return this.workoutService;
  }

  static getWorkoutRegistrationEmailService(): WorkoutRegistrationEmailService {
    if (!this.workoutRegistrationEmailService) {
      this.workoutRegistrationEmailService = new WorkoutRegistrationEmailService();
    }
    return this.workoutRegistrationEmailService;
  }
  static getPlayerClassifiedEmailService(): PlayerClassifiedEmailService {
    if (!this.playerClassifiedEmailService) {
      this.playerClassifiedEmailService = new PlayerClassifiedEmailService();
    }
    return this.playerClassifiedEmailService;
  }
  static getPlayerClassifiedAccessService(): PlayerClassifiedAccessService {
    if (!this.accessService) {
      this.accessService = new PlayerClassifiedAccessService();
    }
    return this.accessService;
  }

  static getPollService(): PollService {
    if (!this.pollService) {
      this.pollService = new PollService();
    }
    return this.pollService;
  }

  static getFieldService(): FieldService {
    if (!this.fieldService) {
      this.fieldService = new FieldService();
    }
    return this.fieldService;
  }

  static getUmpireService(): UmpireService {
    if (!this.umpireService) {
      this.umpireService = new UmpireService();
    }
    return this.umpireService;
  }

  static getLeagueService(): LeagueService {
    if (!this.leagueService) {
      this.leagueService = new LeagueService();
    }
    return this.leagueService;
  }

  static getLeagueFaqService(): LeagueFaqService {
    if (!this.leagueFaqService) {
      this.leagueFaqService = new LeagueFaqService();
    }
    return this.leagueFaqService;
  }

  static getEmailService(): EmailService {
    if (!this.emailService) {
      this.emailService = new EmailService();
    }
    return this.emailService;
  }

  static getScheduleService(): ScheduleService {
    if (!this.scheduleService) {
      this.scheduleService = new ScheduleService();
    }
    return this.scheduleService;
  }

  static getSchedulerEngineService(): SchedulerEngineService {
    if (!this.schedulerEngineService) {
      this.schedulerEngineService = new SchedulerEngineService();
    }

    return this.schedulerEngineService;
  }

  static getMonitoringService(): MonitoringService {
    if (!this.monitoringService) {
      this.monitoringService = new MonitoringService();
    }
    return this.monitoringService;
  }

  static getAdminAnalyticsService(): AdminAnalyticsService {
    if (!this.adminAnalyticsService) {
      const monitoringService = this.getMonitoringService();
      this.adminAnalyticsService = new AdminAnalyticsService(monitoringService);
    }

    return this.adminAnalyticsService;
  }

  static getPhotoSubmissionService(): PhotoSubmissionService {
    if (!this.photoSubmissionService) {
      const repository = RepositoryFactory.getPhotoSubmissionRepository();
      this.photoSubmissionService = new PhotoSubmissionService(repository);
    }

    return this.photoSubmissionService;
  }

  static getPhotoGalleryService(): PhotoGalleryService {
    if (!this.photoGalleryService) {
      this.photoGalleryService = new PhotoGalleryService();
    }

    return this.photoGalleryService;
  }

  static getAccountSettingsService(): AccountSettingsService {
    if (!this.accountSettingsService) {
      this.accountSettingsService = new AccountSettingsService();
    }

    return this.accountSettingsService;
  }

  static getDiscordIntegrationService(): DiscordIntegrationService {
    if (!this.discordIntegrationService) {
      this.discordIntegrationService = new DiscordIntegrationService();
    }

    return this.discordIntegrationService;
  }

  static getYouTubeIntegrationService(): YouTubeIntegrationService {
    if (!this.youtubeIntegrationService) {
      this.youtubeIntegrationService = new YouTubeIntegrationService();
    }

    return this.youtubeIntegrationService;
  }

  static getTwitterIntegrationService(): TwitterIntegrationService {
    if (!this.twitterIntegrationService) {
      this.twitterIntegrationService = new TwitterIntegrationService();
    }

    return this.twitterIntegrationService;
  }

  static getBlueskyIntegrationService(): BlueskyIntegrationService {
    if (!this.blueskyIntegrationService) {
      this.blueskyIntegrationService = new BlueskyIntegrationService();
    }

    return this.blueskyIntegrationService;
  }

  static getInstagramIntegrationService(): InstagramIntegrationService {
    if (!this.instagramIntegrationService) {
      this.instagramIntegrationService = new InstagramIntegrationService();
    }

    return this.instagramIntegrationService;
  }

  static getWelcomeMessageService(): WelcomeMessageService {
    if (!this.welcomeMessageService) {
      const welcomeMessageRepository = RepositoryFactory.getWelcomeMessageRepository();
      const teamRepository = RepositoryFactory.getTeamRepository();
      this.welcomeMessageService = new WelcomeMessageService(
        welcomeMessageRepository,
        teamRepository,
      );
    }

    return this.welcomeMessageService;
  }

  static getSocialHubService(): SocialHubService {
    if (!this.socialHubService) {
      this.socialHubService = new SocialHubService(
        undefined,
        undefined,
        this.getDiscordIntegrationService(),
      );
    }

    return this.socialHubService;
  }

  static getSocialIngestionService(): SocialIngestionService {
    if (!this.socialIngestionService) {
      const connectors = [];
      const socialContentRepository = RepositoryFactory.getSocialContentRepository();
      const discordIntegrationService = this.getDiscordIntegrationService();
      const twitterIntegrationService = this.getTwitterIntegrationService();
      const blueskyIntegrationService = this.getBlueskyIntegrationService();
      const instagramIntegrationService = this.getInstagramIntegrationService();

      if (socialIngestionConfig.twitter.enabled) {
        const staticTargets = socialIngestionConfig.twitter.targets.map((target) => ({
          ...target,
          bearerToken: socialIngestionConfig.twitter.bearerToken,
        }));

        const targetsProvider = async () => {
          const dbTargets = await twitterIntegrationService.listIngestionTargets();
          return [...dbTargets, ...staticTargets].filter((target) => Boolean(target.bearerToken));
        };

        connectors.push(
          new TwitterConnector(socialContentRepository, {
            maxResults: socialIngestionConfig.twitter.maxResults,
            targetsProvider,
            intervalMs: socialIngestionConfig.twitter.intervalMs,
            enabled: socialIngestionConfig.twitter.enabled,
          }),
        );
      }

      if (socialIngestionConfig.bluesky.enabled) {
        const staticTargets = socialIngestionConfig.bluesky.targets;
        const targetsProvider = async () => {
          const dbTargets = await blueskyIntegrationService.listIngestionTargets();
          return [...dbTargets, ...staticTargets];
        };

        connectors.push(
          new BlueskyConnector(socialContentRepository, blueskyIntegrationService, {
            maxResults: socialIngestionConfig.bluesky.maxResults,
            targetsProvider,
            intervalMs: socialIngestionConfig.bluesky.intervalMs,
            enabled: socialIngestionConfig.bluesky.enabled,
          }),
        );
      }

      if (socialIngestionConfig.youtube.enabled) {
        const youtubeIntegrationService = this.getYouTubeIntegrationService();
        const targetsProvider = async () => {
          const dbTargets = await youtubeIntegrationService.listIngestionTargets();
          return dbTargets;
        };

        connectors.push(
          new YouTubeConnector(socialContentRepository, {
            apiKey: socialIngestionConfig.youtube.apiKey,
            targets: socialIngestionConfig.youtube.targets,
            targetsProvider,
            intervalMs: socialIngestionConfig.youtube.intervalMs,
            enabled:
              socialIngestionConfig.youtube.enabled &&
              Boolean(socialIngestionConfig.youtube.apiKey),
          }),
        );
      }

      if (socialIngestionConfig.discord.enabled) {
        const targetsProvider = async () => {
          const dbTargets = await discordIntegrationService.getChannelIngestionTargets();
          return [...dbTargets, ...socialIngestionConfig.discord.targets];
        };
        connectors.push(
          new DiscordConnector(socialContentRepository, {
            botToken: socialIngestionConfig.discord.botToken,
            limit: socialIngestionConfig.discord.limit,
            targetsProvider,
            intervalMs: socialIngestionConfig.discord.intervalMs,
            enabled:
              socialIngestionConfig.discord.enabled &&
              Boolean(socialIngestionConfig.discord.botToken),
          }),
        );
      }

      if (socialIngestionConfig.instagram.enabled) {
        const targetsProvider = async () => {
          const dbTargets = await instagramIntegrationService.listIngestionTargets();

          const staticTargets = await Promise.all(
            socialIngestionConfig.instagram.targets.map(async (target) => {
              if (!socialIngestionConfig.instagram.accessToken) {
                return null;
              }

              const album = await instagramIntegrationService.ensureInstagramAlbum(target.accountId);
              return {
                ...target,
                albumId: album.id,
                accessToken: socialIngestionConfig.instagram.accessToken,
              };
            }),
          );

          return [
            ...dbTargets,
            ...staticTargets.filter(
              (target): target is NonNullable<(typeof staticTargets)[number]> => Boolean(target),
            ),
          ];
        };

        connectors.push(
          new InstagramConnector(instagramIntegrationService, {
            maxResults: socialIngestionConfig.instagram.maxResults,
            targetsProvider,
            intervalMs: socialIngestionConfig.instagram.intervalMs,
            enabled: socialIngestionConfig.instagram.enabled,
          }),
        );
      }

      this.socialIngestionService = new SocialIngestionService(connectors);
    }

    return this.socialIngestionService;
  }

  static getPhotoGalleryAssetService(): PhotoGalleryAssetService {
    if (!this.photoGalleryAssetService) {
      this.photoGalleryAssetService = new PhotoGalleryAssetService();
    }

    return this.photoGalleryAssetService;
  }

  static getPhotoGalleryApprovalService(): PhotoGalleryApprovalService {
    if (!this.photoGalleryApprovalService) {
      this.photoGalleryApprovalService = new PhotoGalleryApprovalService();
    }

    return this.photoGalleryApprovalService;
  }

  static getPhotoGalleryAdminService(): PhotoGalleryAdminService {
    if (!this.photoGalleryAdminService) {
      const repository = RepositoryFactory.getPhotoGalleryAdminRepository();
      const assetService = this.getPhotoGalleryAssetService();
      const instagramIntegrationService = this.getInstagramIntegrationService();
      this.photoGalleryAdminService = new PhotoGalleryAdminService(
        repository,
        assetService,
        instagramIntegrationService,
      );
    }

    return this.photoGalleryAdminService;
  }

  static getPhotoSubmissionNotificationService(): PhotoSubmissionNotificationService {
    if (!this.photoSubmissionNotificationService) {
      this.photoSubmissionNotificationService = new PhotoSubmissionNotificationService();
    }

    return this.photoSubmissionNotificationService;
  }

  static getPhotoSubmissionModerationService(): PhotoSubmissionModerationService {
    if (!this.photoSubmissionModerationService) {
      this.photoSubmissionModerationService = new PhotoSubmissionModerationService();
    }

    return this.photoSubmissionModerationService;
  }

  static getPhotoSubmissionAssetService(): PhotoSubmissionAssetService {
    if (!this.photoSubmissionAssetService) {
      this.photoSubmissionAssetService = new PhotoSubmissionAssetService();
    }

    return this.photoSubmissionAssetService;
  }

  static getHallOfFameService(): HallOfFameService {
    if (!this.hallOfFameService) {
      this.hallOfFameService = new HallOfFameService();
    }

    return this.hallOfFameService;
  }

  static getHofNominationService(): HofNominationService {
    if (!this.hofNominationService) {
      this.hofNominationService = new HofNominationService();
    }

    return this.hofNominationService;
  }

  static getStatsEntryService(): StatsEntryService {
    if (!this.statsEntryService) {
      const statsEntryRepository = RepositoryFactory.getStatsEntryRepository();
      const rosterRepository = RepositoryFactory.getRosterRepository();
      const teamService = this.getTeamService();
      this.statsEntryService = new StatsEntryService(
        statsEntryRepository,
        rosterRepository,
        teamService,
      );
    }

    return this.statsEntryService;
  }

  static getHofSetupService(): HofSetupService {
    if (!this.hofSetupService) {
      this.hofSetupService = new HofSetupService();
    }

    return this.hofSetupService;
  }

  static getUserService(): UserService {
    if (!this.userService) {
      this.userService = new UserService({
        emailService: this.getEmailService(),
      });
    }

    return this.userService;
  }

  static getTurnstileService(): TurnstileService {
    if (!this.turnstileService) {
      this.turnstileService = new TurnstileService();
    }

    return this.turnstileService;
  }

  static getHandoutService(): HandoutService {
    if (!this.handoutService) {
      this.handoutService = new HandoutService();
    }

    return this.handoutService;
  }

  static getPlayerSurveyService(): PlayerSurveyService {
    if (!this.playerSurveyService) {
      this.playerSurveyService = new PlayerSurveyService();
    }

    return this.playerSurveyService;
  }

  static getAnnouncementService(): AnnouncementService {
    if (!this.announcementService) {
      const announcementRepository = RepositoryFactory.getAnnouncementRepository();
      const teamRepository = RepositoryFactory.getTeamRepository();
      this.announcementService = new AnnouncementService(announcementRepository, teamRepository);
    }

    return this.announcementService;
  }
}
