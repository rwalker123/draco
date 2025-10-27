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
import { LeagueService } from './LeagueService.js';
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
  private static leagueService: LeagueService;
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
      this.statisticsService = new StatisticsService(
        prisma,
        battingRepository,
        pitchingRepository,
        leagueLeadersRepository,
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
      this.photoGalleryAdminService = new PhotoGalleryAdminService(repository, assetService);
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
}
