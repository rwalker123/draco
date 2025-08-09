import { RoleService } from '../services/roleService.js';
import { TeamService } from '../services/teamService.js';
import { RouteProtection } from '../middleware/routeProtection.js';
import { RoleMiddleware } from '../middleware/roleMiddleware.js';
import {
  IRoleService,
  IRoleQuery,
  IRoleVerification,
  IRoleManagement,
  IRoleMiddleware,
} from '../interfaces/roleInterfaces.js';
import prisma from './prisma.js';

/**
 * Service factory to provide service instances without direct Prisma dependencies
 * Note: This is a temporary measure during the transition to full dependency injection
 */
export class ServiceFactory {
  private static roleService: RoleService;
  private static teamService: TeamService;
  private static routeProtection: RouteProtection;
  private static roleMiddleware: RoleMiddleware;

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

  static getRoleMiddlewareClass(): RoleMiddleware {
    if (!this.roleMiddleware) {
      const roleService = this.getRoleMiddleware();
      this.roleMiddleware = new RoleMiddleware(roleService);
    }
    return this.roleMiddleware;
  }

  static getTeamService(): TeamService {
    if (!this.teamService) {
      this.teamService = new TeamService(prisma);
    }
    return this.teamService;
  }

  static getRouteProtection(): RouteProtection {
    if (!this.routeProtection) {
      const roleService = this.getRoleMiddleware();
      this.routeProtection = new RouteProtection(roleService, prisma);
    }
    return this.routeProtection;
  }
}
