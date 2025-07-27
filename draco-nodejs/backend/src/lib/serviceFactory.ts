import { RoleService } from '../services/roleService';
import { TeamService } from '../services/teamService';
import { RouteProtection } from '../middleware/routeProtection';
import prisma from './prisma';

/**
 * Service factory to provide service instances without direct Prisma dependencies
 * Note: This is a temporary measure during the transition to full dependency injection
 */
export class ServiceFactory {
  private static roleService: RoleService;
  private static teamService: TeamService;
  private static routeProtection: RouteProtection;

  static getRoleService(): RoleService {
    if (!this.roleService) {
      this.roleService = new RoleService(prisma);
    }
    return this.roleService;
  }

  static getTeamService(): TeamService {
    if (!this.teamService) {
      this.teamService = new TeamService(prisma);
    }
    return this.teamService;
  }

  static getRouteProtection(): RouteProtection {
    if (!this.routeProtection) {
      const roleService = this.getRoleService();
      this.routeProtection = new RouteProtection(roleService, prisma);
    }
    return this.routeProtection;
  }
}
