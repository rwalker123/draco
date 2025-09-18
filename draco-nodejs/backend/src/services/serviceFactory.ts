import { RoleService } from './roleService.js';
import { TeamService } from './teamService.js';
import { PlayerClassifiedService } from './player-classified/playerClassifiedService.js';
import { CleanupService } from './cleanupService.js';
import { ContactSecurityService } from './core/ContactSecurityService.js';
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

/**
 * Service factory to provide service instances without direct Prisma dependencies
 * Note: This is a temporary measure during the transition to full dependency injection
 */
export class ServiceFactory {
  private static roleService: RoleService;
  private static teamService: TeamService;
  private static playerClassifiedService: PlayerClassifiedService;
  private static cleanupService: ICleanupService;
  private static contactSecurityService: ContactSecurityService;
  private static routeProtection: RouteProtection;
  private static rosterService: RosterService;
  private static contactService: ContactService;

  static getRoleService(): IRoleService {
    if (!this.roleService) {
      this.roleService = new RoleService(prisma);
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
      this.cleanupService = new CleanupService(prisma, cleanupConfig);
    }
    return this.cleanupService;
  }

  static getContactSecurityService(): ContactSecurityService {
    if (!this.contactSecurityService) {
      this.contactSecurityService = new ContactSecurityService(prisma);
    }
    return this.contactSecurityService;
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
      this.contactService = new ContactService(prisma);
    }
    return this.contactService;
  }
}
