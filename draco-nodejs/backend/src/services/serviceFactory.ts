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
} from '../interfaces/roleInterfaces.js';
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
import { EmailAttachmentService } from './emailAttachmentService.js';
import { WorkoutService } from './workoutService.js';

/**
 * Service factory to provide service instances without direct Prisma dependencies
 * Note: This is a temporary measure during the transition to full dependency injection
 */
export class ServiceFactory {
  private static roleService: RoleService;
  private static teamService: TeamService;
  private static playerClassifiedService: PlayerClassifiedService;
  private static cleanupService: ICleanupService;
  private static routeProtection: RouteProtection;
  private static rosterService: RosterService;
  private static contactService: ContactService;
  private static seasonManagerService: SeasonManagerService;
  private static registrationService: RegistrationService;
  private static authService: AuthService;
  private static contactDependencyService: ContactDependencyService;
  private static contactPhotoService: ContactPhotoService;
  private static statisticsService: StatisticsService;
  private static teamStatsService: TeamStatsService;
  private static teamManagerService: TeamManagerService;
  private static emailTemplateService: EmailTemplateService;
  private static emailAttachmentService: EmailAttachmentService;
  private static workoutService: WorkoutService;

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
      this.teamService = new TeamService(prisma);
    }
    return this.teamService;
  }

  static getPlayerClassifiedService(): PlayerClassifiedService {
    if (!this.playerClassifiedService) {
      this.playerClassifiedService = new PlayerClassifiedService(prisma);
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
      const roleService = this.getRoleMiddleware();
      this.routeProtection = new RouteProtection(roleService, prisma);
    }
    return this.routeProtection;
  }

  static getRosterService(): RosterService {
    if (!this.rosterService) {
      this.rosterService = new RosterService(prisma);
    }
    return this.rosterService;
  }

  static getContactService(): ContactService {
    if (!this.contactService) {
      this.contactService = new ContactService();
    }
    return this.contactService;
  }

  static getSeasonManagerService(): SeasonManagerService {
    if (!this.seasonManagerService) {
      this.seasonManagerService = new SeasonManagerService(prisma);
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
      this.contactPhotoService = new ContactPhotoService(prisma);
    }
    return this.contactPhotoService;
  }

  static getStatisticsService(): StatisticsService {
    if (!this.statisticsService) {
      this.statisticsService = new StatisticsService(prisma);
    }
    return this.statisticsService;
  }

  static getTeamStatsService(): TeamStatsService {
    if (!this.teamStatsService) {
      this.teamStatsService = new TeamStatsService(prisma);
    }
    return this.teamStatsService;
  }

  static getTeamManagerService(): TeamManagerService {
    if (!this.teamManagerService) {
      this.teamManagerService = new TeamManagerService(prisma);
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
}
