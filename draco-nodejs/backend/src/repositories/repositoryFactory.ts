import {
  IUserRepository,
  ITeamRepository,
  IAccountRepository,
  IContactRepository,
  IRoleRepository,
  ISeasonsRepository,
  ILeagueRepository,
  ILeagueFaqRepository,
  ICleanupRepository,
  IPollRepository,
  IPlayersWantedRepository,
  ITeamsWantedRepository,
  ISponsorRepository,
  IFieldRepository,
  IUmpireRepository,
  IWorkoutRepository,
  IEmailRepository,
  IEmailTemplateRepository,
  IEmailAttachmentRepository,
  IScheduleRepository,
  IMonitoringRepository,
  IPasswordResetTokenRepository,
  IManagerRepository,
  IBattingStatisticsRepository,
  IPitchingStatisticsRepository,
  ILeagueLeadersDisplayRepository,
  IRosterRepository,
  IHandoutRepository,
  IAdminAnalyticsRepository,
  IPhotoSubmissionRepository,
  IPhotoGalleryAdminRepository,
  IPhotoGalleryModerationRepository,
  IPhotoGalleryReadRepository,
  IMemberBusinessRepository,
  IHallOfFameRepository,
  IHofNominationRepository,
  IHofNominationSetupRepository,
  IStatsEntryRepository,
  IAnnouncementRepository,
  IPlayerSurveyRepository,
} from './interfaces/index.js';
import {
  PrismaUserRepository,
  PrismaTeamRepository,
  PrismaAccountRepository,
  PrismaContactRepository,
  PrismaRoleRepository,
  PrismaSeasonsRepository,
  PrismaLeagueRepository,
  PrismaLeagueFaqRepository,
  PrismaCleanupRepository,
  PrismaPollRepository,
  PrismaTeamsWantedRepository,
  PrismaSponsorRepository,
  PrismaFieldRepository,
  PrismaUmpireRepository,
  PrismaWorkoutRepository,
  PrismaEmailRepository,
  PrismaEmailTemplateRepository,
  PrismaPlayersWantedRepository,
  PrismaEmailAttachmentRepository,
  PrismaScheduleRepository,
  PrismaMonitoringRepository,
  PrismaPasswordResetTokenRepository,
  PrismaManagerRepository,
  PrismaBattingStatisticsRepository,
  PrismaPitchingStatisticsRepository,
  PrismaLeagueLeadersDisplayRepository,
  PrismaRosterRepository,
  PrismaHandoutRepository,
  PrismaAdminAnalyticsRepository,
  PrismaPhotoSubmissionRepository,
  PrismaPhotoGalleryRepository,
  PrismaMemberBusinessRepository,
  PrismaHallOfFameRepository,
  PrismaHofNominationRepository,
  PrismaHofNominationSetupRepository,
  PrismaStatsEntryRepository,
  PrismaAnnouncementRepository,
  PrismaPlayerSurveyRepository,
} from './implementations/index.js';

import prisma from '../lib/prisma.js';

/**
 * Factory functions to create repository instances
 * This provides a clean way to access repositories without direct Prisma dependencies
 */
export class RepositoryFactory {
  private static userRepository: IUserRepository;
  private static teamRepository: ITeamRepository;
  private static accountRepository: IAccountRepository;
  private static contactRepository: IContactRepository;
  private static roleRepository: IRoleRepository;
  private static seasonsRepository: ISeasonsRepository;
  private static leagueRepository: ILeagueRepository;
  private static leagueFaqRepository: ILeagueFaqRepository;
  private static cleanupRepository: ICleanupRepository;
  private static pollRepository: IPollRepository;
  private static playersWantedRepository: IPlayersWantedRepository;
  private static teamsWantedRepository: ITeamsWantedRepository;
  private static sponsorRepository: ISponsorRepository;
  private static fieldRepository: IFieldRepository;
  private static umpireRepository: IUmpireRepository;
  private static workoutRepository: IWorkoutRepository;
  private static emailRepository: IEmailRepository;
  private static emailTemplateRepository: IEmailTemplateRepository;
  private static emailAttachmentRepository: IEmailAttachmentRepository;
  private static scheduleRepository: IScheduleRepository;
  private static monitoringRepository: IMonitoringRepository;
  private static passwordResetTokenRepository: IPasswordResetTokenRepository;
  private static managerRepository: IManagerRepository;
  private static battingStatisticsRepository: IBattingStatisticsRepository;
  private static pitchingStatisticsRepository: IPitchingStatisticsRepository;
  private static leagueLeadersDisplayRepository: ILeagueLeadersDisplayRepository;
  private static rosterRepository: IRosterRepository;
  private static handoutRepository: IHandoutRepository;
  private static adminAnalyticsRepository: IAdminAnalyticsRepository;
  private static photoSubmissionRepository: IPhotoSubmissionRepository;
  private static photoGalleryRepository: PrismaPhotoGalleryRepository;
  private static memberBusinessRepository: IMemberBusinessRepository;
  private static hallOfFameRepository: IHallOfFameRepository;
  private static hofNominationRepository: IHofNominationRepository;
  private static hofNominationSetupRepository: IHofNominationSetupRepository;
  private static statsEntryRepository: IStatsEntryRepository;
  private static playerSurveyRepository: IPlayerSurveyRepository;
  private static announcementRepository: IAnnouncementRepository;

  static getLeagueRepository(): ILeagueRepository {
    if (!this.leagueRepository) {
      this.leagueRepository = new PrismaLeagueRepository(prisma);
    }
    return this.leagueRepository;
  }

  static getLeagueFaqRepository(): ILeagueFaqRepository {
    if (!this.leagueFaqRepository) {
      this.leagueFaqRepository = new PrismaLeagueFaqRepository(prisma);
    }
    return this.leagueFaqRepository;
  }

  static getUserRepository(): IUserRepository {
    if (!this.userRepository) {
      this.userRepository = new PrismaUserRepository(prisma);
    }
    return this.userRepository;
  }

  static getTeamRepository(): ITeamRepository {
    if (!this.teamRepository) {
      this.teamRepository = new PrismaTeamRepository(prisma);
    }
    return this.teamRepository;
  }

  static getRosterRepository(): IRosterRepository {
    if (!this.rosterRepository) {
      this.rosterRepository = new PrismaRosterRepository(prisma);
    }
    return this.rosterRepository;
  }

  static getHandoutRepository(): IHandoutRepository {
    if (!this.handoutRepository) {
      this.handoutRepository = new PrismaHandoutRepository(prisma);
    }
    return this.handoutRepository;
  }

  static getAdminAnalyticsRepository(): IAdminAnalyticsRepository {
    if (!this.adminAnalyticsRepository) {
      this.adminAnalyticsRepository = new PrismaAdminAnalyticsRepository(prisma);
    }
    return this.adminAnalyticsRepository;
  }

  static getPhotoSubmissionRepository(): IPhotoSubmissionRepository {
    if (!this.photoSubmissionRepository) {
      this.photoSubmissionRepository = new PrismaPhotoSubmissionRepository(prisma);
    }
    return this.photoSubmissionRepository;
  }

  private static ensurePhotoGalleryRepository(): PrismaPhotoGalleryRepository {
    if (!this.photoGalleryRepository) {
      this.photoGalleryRepository = new PrismaPhotoGalleryRepository(prisma);
    }
    return this.photoGalleryRepository;
  }

  static getPhotoGalleryReadRepository(): IPhotoGalleryReadRepository {
    return this.ensurePhotoGalleryRepository();
  }

  static getPhotoGalleryModerationRepository(): IPhotoGalleryModerationRepository {
    return this.ensurePhotoGalleryRepository();
  }

  static getPhotoGalleryAdminRepository(): IPhotoGalleryAdminRepository {
    return this.ensurePhotoGalleryRepository();
  }

  static getAnnouncementRepository(): IAnnouncementRepository {
    if (!this.announcementRepository) {
      this.announcementRepository = new PrismaAnnouncementRepository(prisma);
    }
    return this.announcementRepository;
  }

  static getAccountRepository(): IAccountRepository {
    if (!this.accountRepository) {
      this.accountRepository = new PrismaAccountRepository(prisma);
    }
    return this.accountRepository;
  }

  static getMemberBusinessRepository(): IMemberBusinessRepository {
    if (!this.memberBusinessRepository) {
      this.memberBusinessRepository = new PrismaMemberBusinessRepository(prisma);
    }
    return this.memberBusinessRepository;
  }

  static getPlayerSurveyRepository(): IPlayerSurveyRepository {
    if (!this.playerSurveyRepository) {
      this.playerSurveyRepository = new PrismaPlayerSurveyRepository(prisma);
    }
    return this.playerSurveyRepository;
  }

  static getStatsEntryRepository(): IStatsEntryRepository {
    if (!this.statsEntryRepository) {
      this.statsEntryRepository = new PrismaStatsEntryRepository(prisma);
    }
    return this.statsEntryRepository;
  }

  static getContactRepository(): IContactRepository {
    if (!this.contactRepository) {
      this.contactRepository = new PrismaContactRepository(prisma);
    }
    return this.contactRepository;
  }

  static getHallOfFameRepository(): IHallOfFameRepository {
    if (!this.hallOfFameRepository) {
      this.hallOfFameRepository = new PrismaHallOfFameRepository(prisma);
    }
    return this.hallOfFameRepository;
  }

  static getHofNominationRepository(): IHofNominationRepository {
    if (!this.hofNominationRepository) {
      this.hofNominationRepository = new PrismaHofNominationRepository(prisma);
    }
    return this.hofNominationRepository;
  }

  static getHofNominationSetupRepository(): IHofNominationSetupRepository {
    if (!this.hofNominationSetupRepository) {
      this.hofNominationSetupRepository = new PrismaHofNominationSetupRepository(prisma);
    }
    return this.hofNominationSetupRepository;
  }

  static getRoleRepository(): IRoleRepository {
    if (!this.roleRepository) {
      this.roleRepository = new PrismaRoleRepository(prisma);
    }
    return this.roleRepository;
  }

  static getSeasonsRepository(): ISeasonsRepository {
    if (!this.seasonsRepository) {
      this.seasonsRepository = new PrismaSeasonsRepository(prisma);
    }
    return this.seasonsRepository;
  }

  static getCleanupRepository(): ICleanupRepository {
    if (!this.cleanupRepository) {
      this.cleanupRepository = new PrismaCleanupRepository(prisma);
    }
    return this.cleanupRepository;
  }

  static getPollRepository(): IPollRepository {
    if (!this.pollRepository) {
      this.pollRepository = new PrismaPollRepository(prisma);
    }
    return this.pollRepository;
  }
  static getPlayersWantedRepository(): IPlayersWantedRepository {
    if (!this.playersWantedRepository) {
      this.playersWantedRepository = new PrismaPlayersWantedRepository(prisma);
    }
    return this.playersWantedRepository;
  }

  static getTeamsWantedRepository(): ITeamsWantedRepository {
    if (!this.teamsWantedRepository) {
      this.teamsWantedRepository = new PrismaTeamsWantedRepository(prisma);
    }
    return this.teamsWantedRepository;
  }

  static getSponsorRepository(): ISponsorRepository {
    if (!this.sponsorRepository) {
      this.sponsorRepository = new PrismaSponsorRepository(prisma);
    }
    return this.sponsorRepository;
  }

  static getFieldRepository(): IFieldRepository {
    if (!this.fieldRepository) {
      this.fieldRepository = new PrismaFieldRepository(prisma);
    }
    return this.fieldRepository;
  }

  static getUmpireRepository(): IUmpireRepository {
    if (!this.umpireRepository) {
      this.umpireRepository = new PrismaUmpireRepository(prisma);
    }
    return this.umpireRepository;
  }

  static getWorkoutRepository(): IWorkoutRepository {
    if (!this.workoutRepository) {
      this.workoutRepository = new PrismaWorkoutRepository(prisma);
    }
    return this.workoutRepository;
  }

  static getEmailRepository(): IEmailRepository {
    if (!this.emailRepository) {
      this.emailRepository = new PrismaEmailRepository(prisma);
    }
    return this.emailRepository;
  }

  static getEmailTemplateRepository(): IEmailTemplateRepository {
    if (!this.emailTemplateRepository) {
      this.emailTemplateRepository = new PrismaEmailTemplateRepository(prisma);
    }
    return this.emailTemplateRepository;
  }

  static getEmailAttachmentRepository(): IEmailAttachmentRepository {
    if (!this.emailAttachmentRepository) {
      this.emailAttachmentRepository = new PrismaEmailAttachmentRepository(prisma);
    }
    return this.emailAttachmentRepository;
  }

  static getScheduleRepository(): IScheduleRepository {
    if (!this.scheduleRepository) {
      this.scheduleRepository = new PrismaScheduleRepository(prisma);
    }
    return this.scheduleRepository;
  }

  static getMonitoringRepository(): IMonitoringRepository {
    if (!this.monitoringRepository) {
      this.monitoringRepository = new PrismaMonitoringRepository(prisma);
    }
    return this.monitoringRepository;
  }

  static getPasswordResetTokenRepository(): IPasswordResetTokenRepository {
    if (!this.passwordResetTokenRepository) {
      this.passwordResetTokenRepository = new PrismaPasswordResetTokenRepository(prisma);
    }

    return this.passwordResetTokenRepository;
  }

  static getManagerRepository(): IManagerRepository {
    if (!this.managerRepository) {
      this.managerRepository = new PrismaManagerRepository(prisma);
    }
    return this.managerRepository;
  }

  static getBattingStatisticsRepository(): IBattingStatisticsRepository {
    if (!this.battingStatisticsRepository) {
      this.battingStatisticsRepository = new PrismaBattingStatisticsRepository(prisma);
    }
    return this.battingStatisticsRepository;
  }

  static getPitchingStatisticsRepository(): IPitchingStatisticsRepository {
    if (!this.pitchingStatisticsRepository) {
      this.pitchingStatisticsRepository = new PrismaPitchingStatisticsRepository(prisma);
    }
    return this.pitchingStatisticsRepository;
  }

  static getLeagueLeadersDisplayRepository(): ILeagueLeadersDisplayRepository {
    if (!this.leagueLeadersDisplayRepository) {
      this.leagueLeadersDisplayRepository = new PrismaLeagueLeadersDisplayRepository(prisma);
    }
    return this.leagueLeadersDisplayRepository;
  }
}
