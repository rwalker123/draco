// Role Service for Draco Sports Manager
// Handles all role-related operations including contact roles and global roles

import { PrismaClient } from '@prisma/client';
import { ContactRole, UserRoles, RoleCheckResult, RoleContext, RoleType } from '../types/roles.js';
import {
  ROLE_IDS,
  ROLE_PERMISSIONS_BY_ID,
  validateRoleAssignment,
  hasRoleOrHigher,
} from '../config/roles.js';
import { IRoleService } from '../interfaces/roleInterfaces.js';
import { ServiceFactory } from '../lib/serviceFactory.js';

export class RoleService implements IRoleService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get all roles for a user (both global and contact roles)
   */
  async getUserRoles(userId: string, accountId?: bigint): Promise<UserRoles> {
    try {
      // Get global roles from aspnetuserroles
      const globalRoles = await this.getGlobalRoles(userId);

      // Get contact roles if accountId is provided
      const contactRoles = accountId ? await this.getContactRoles(userId, accountId) : [];

      return {
        globalRoles,
        contactRoles,
      };
    } catch (error) {
      console.error('Error getting user roles:', error);
      throw error;
    }
  }

  /**
   * Get global roles for a user from aspnetuserroles table
   */
  async getGlobalRoles(userId: string): Promise<string[]> {
    try {
      const userRoles = await this.prisma.aspnetuserroles.findMany({
        where: { userid: userId },
        select: {
          roleid: true,
        },
      });

      return userRoles.map((ur) => ur.roleid);
    } catch (error) {
      console.error('Error getting global roles:', error);
      throw error;
    }
  }

  /**
   * Get contact roles for a user in a specific account
   */
  async getContactRoles(userId: string, accountId: bigint): Promise<ContactRole[]> {
    try {
      // First get the contact ID for this user in this account
      const contact = await this.prisma.contacts.findFirst({
        where: {
          userid: userId,
          creatoraccountid: accountId,
        },
        select: { id: true },
      });

      if (!contact) {
        return [];
      }

      // Get contact roles for this contact in this account
      const contactRoles = await this.prisma.contactroles.findMany({
        where: {
          contactid: contact.id,
          accountid: accountId,
        },
      });

      return contactRoles.map((cr) => ({
        id: cr.id,
        contactId: cr.contactid,
        roleId: cr.roleid,
        roleData: cr.roledata,
        accountId: cr.accountid,
      }));
    } catch (error) {
      console.error('Error getting contact roles:', error);
      throw error;
    }
  }

  /**
   * Check if a user has a specific role in a context
   */
  async hasRole(userId: string, roleId: string, context: RoleContext): Promise<RoleCheckResult> {
    try {
      const userRoles = await this.getUserRoles(userId, context.accountId);

      // Check global roles first
      if (userRoles.globalRoles.includes(roleId)) {
        return {
          hasRole: true,
          roleLevel: 'global',
          context,
        };
      }

      // Check contact roles
      for (const contactRole of userRoles.contactRoles) {
        if (contactRole.roleId === roleId) {
          // Validate context-specific data
          if (this.validateRoleContext(contactRole, context)) {
            return {
              hasRole: true,
              roleLevel: this.getRoleLevel(roleId),
              context,
            };
          }
        }
      }

      // Check role hierarchy
      if (await this.hasRoleOrHigher(userId, roleId, context)) {
        return {
          hasRole: true,
          roleLevel: this.getRoleLevel(roleId),
          context,
        };
      }

      return {
        hasRole: false,
        roleLevel: 'none',
        context,
      };
    } catch (error) {
      console.error('Error checking role:', error);
      throw error;
    }
  }

  /**
   * Check if user has role or higher in hierarchy
   */
  async hasRoleOrHigher(
    userId: string,
    requiredRole: string,
    context: RoleContext,
  ): Promise<boolean> {
    try {
      const userRoles = await this.getUserRoles(userId, context.accountId);

      // Check global roles
      for (const globalRole of userRoles.globalRoles) {
        if (hasRoleOrHigher([globalRole], requiredRole)) {
          return true;
        }
      }

      // Check contact roles
      for (const contactRole of userRoles.contactRoles) {
        if (this.validateRoleContext(contactRole, context)) {
          if (hasRoleOrHigher([contactRole.roleId], requiredRole)) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking role hierarchy:', error);
      throw error;
    }
  }

  /**
   * Check if user has permission
   */
  async hasPermission(userId: string, permission: string, context: RoleContext): Promise<boolean> {
    try {
      const userRoles = await this.getUserRoles(userId, context.accountId);

      // Check global roles first
      for (const globalRole of userRoles.globalRoles) {
        const rolePerms = ROLE_PERMISSIONS_BY_ID[globalRole];
        if (
          rolePerms &&
          (rolePerms.permissions.includes('*') || rolePerms.permissions.includes(permission))
        ) {
          return true;
        }
      }

      // Check contact roles
      for (const contactRole of userRoles.contactRoles) {
        if (this.validateRoleContext(contactRole, context)) {
          const rolePerms = ROLE_PERMISSIONS_BY_ID[contactRole.roleId];
          if (
            rolePerms &&
            (rolePerms.permissions.includes('*') || rolePerms.permissions.includes(permission))
          ) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking permission:', error);
      throw error;
    }
  }

  /**
   * Assign a role to a contact
   */
  async assignRole(
    assignerUserId: string,
    contactId: bigint,
    roleId: string,
    roleData: bigint,
    accountId: bigint,
    seasonId?: bigint,
  ): Promise<ContactRole> {
    try {
      // Validate that assigner has permission to assign this role
      const assignerRoles = await this.getUserRoles(assignerUserId, accountId);
      const assignerRoleNames = [
        ...assignerRoles.globalRoles,
        ...assignerRoles.contactRoles.map((cr) => cr.roleId),
      ];

      if (!validateRoleAssignment(assignerRoleNames, roleId, { accountId })) {
        throw new Error('Insufficient permissions to assign this role');
      }

      // Check if this is the account owner - prevent role assignments
      const contactSecurityService = ServiceFactory.getContactSecurityService();
      // First validate the contact exists in the account
      const isValidContact = await contactSecurityService.isContactInAccount(contactId, accountId);
      if (!isValidContact) {
        throw new Error('Contact not found in the specified account');
      }

      // Get contact with account owner information (using direct query due to complex relationship)
      const contact = await this.prisma.contacts.findFirst({
        where: {
          id: contactId,
          creatoraccountid: accountId,
        },
        select: {
          userid: true,
          accounts: {
            select: {
              owneruserid: true,
            },
          },
        },
      });

      const isAccountOwner = contact?.userid && contact.userid === contact.accounts?.owneruserid;

      if (isAccountOwner) {
        throw new Error('Cannot assign roles to account owner - they already have all permissions');
      }

      // For team roles, check if user is already a team manager for this team
      if (
        roleId === ROLE_IDS[RoleType.TEAM_ADMIN] ||
        roleId === ROLE_IDS[RoleType.TEAM_PHOTO_ADMIN]
      ) {
        // Get current season for validation
        const currentSeasonRecord = await this.prisma.currentseason.findUnique({
          where: { accountid: accountId },
          select: { seasonid: true },
        });

        if (currentSeasonRecord && seasonId === currentSeasonRecord.seasonid) {
          // Check if user is a team manager for this team in the current season
          const isTeamManager = await this.prisma.teamseasonmanager.findFirst({
            where: {
              contactid: contactId,
              teamseasonid: roleData,
              teamsseason: {
                leagueseason: {
                  seasonid: currentSeasonRecord.seasonid,
                },
              },
            },
          });

          if (isTeamManager) {
            const roleName =
              roleId === ROLE_IDS[RoleType.TEAM_ADMIN]
                ? RoleType.TEAM_ADMIN
                : RoleType.TEAM_PHOTO_ADMIN;
            throw new Error(
              `Cannot assign ${roleName} role - user is already a team manager and has this role automatically`,
            );
          }
        }
      }

      // Validate role-specific data requirements
      if (
        roleId === ROLE_IDS[RoleType.ACCOUNT_ADMIN] ||
        roleId === ROLE_IDS[RoleType.ACCOUNT_PHOTO_ADMIN]
      ) {
        // Account roles: roleData must be the accountId
        if (roleData !== accountId) {
          throw new Error(
            `For ${roleId === ROLE_IDS[RoleType.ACCOUNT_ADMIN] ? RoleType.ACCOUNT_ADMIN : RoleType.ACCOUNT_PHOTO_ADMIN} role, roleData must be the accountId (${accountId}), but received ${roleData}`,
          );
        }
      } else if (roleId === ROLE_IDS[RoleType.LEAGUE_ADMIN]) {
        // League role: seasonId is required
        if (!seasonId) {
          throw new Error(`For ${RoleType.LEAGUE_ADMIN} role, seasonId is required`);
        }
        // roleData must be a valid leagueSeasonId
        const leagueSeason = await this.prisma.leagueseason.findFirst({
          where: {
            id: roleData,
            seasonid: seasonId,
            league: {
              accountid: accountId,
            },
          },
          include: {
            league: true,
          },
        });
        if (!leagueSeason) {
          throw new Error(
            `For ${RoleType.LEAGUE_ADMIN} role, roleData must be a valid leagueSeasonId for account ${accountId} and season ${seasonId}, but ${roleData} is not valid`,
          );
        }
      } else if (
        roleId === ROLE_IDS[RoleType.TEAM_ADMIN] ||
        roleId === ROLE_IDS[RoleType.TEAM_PHOTO_ADMIN]
      ) {
        // Team roles: seasonId is required
        if (!seasonId) {
          throw new Error(
            `For ${roleId === ROLE_IDS[RoleType.TEAM_ADMIN] ? RoleType.TEAM_ADMIN : RoleType.TEAM_PHOTO_ADMIN} role, seasonId is required`,
          );
        }
        // roleData must be a valid teamSeasonId
        const teamSeason = await this.prisma.teamsseason.findFirst({
          where: {
            id: roleData,
            leagueseason: {
              seasonid: seasonId,
              league: {
                accountid: accountId,
              },
            },
          },
        });
        if (!teamSeason) {
          throw new Error(
            `For ${roleId === ROLE_IDS[RoleType.TEAM_ADMIN] ? RoleType.TEAM_ADMIN : RoleType.TEAM_PHOTO_ADMIN} role, roleData must be a valid teamSeasonId for account ${accountId} and season ${seasonId}, but ${roleData} is not valid`,
          );
        }
      }

      // Check if role already exists
      const existingRole = await this.prisma.contactroles.findFirst({
        where: {
          contactid: contactId,
          roleid: roleId,
          roledata: roleData,
          accountid: accountId,
        },
      });

      if (existingRole) {
        throw new Error('Role already assigned');
      }

      // Create new role assignment
      const newRole = await this.prisma.contactroles.create({
        data: {
          contactid: contactId,
          roleid: roleId,
          roledata: roleData,
          accountid: accountId,
        },
      });

      return {
        id: newRole.id,
        contactId: newRole.contactid,
        roleId: newRole.roleid,
        roleData: newRole.roledata,
        accountId: newRole.accountid,
      };
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  }

  /**
   * Remove a role from a contact
   */
  async removeRole(
    assignerUserId: string,
    contactId: bigint,
    roleId: string,
    roleData: bigint,
    accountId: bigint,
  ): Promise<boolean> {
    try {
      // Validate that assigner has permission to remove this role
      const assignerRoles = await this.getUserRoles(assignerUserId, accountId);
      const assignerRoleNames = [
        ...assignerRoles.globalRoles,
        ...assignerRoles.contactRoles.map((cr) => cr.roleId),
      ];

      if (!validateRoleAssignment(assignerRoleNames, roleId, { accountId })) {
        throw new Error('Insufficient permissions to remove this role');
      }

      const deletedRole = await this.prisma.contactroles.deleteMany({
        where: {
          contactid: contactId,
          roleid: roleId,
          roledata: roleData,
          accountid: accountId,
        },
      });

      return deletedRole.count > 0;
    } catch (error) {
      console.error('Error removing role:', error);
      throw error;
    }
  }

  /**
   * Get all users with a specific role in an account
   */
  async getUsersWithRole(roleId: string, accountId: bigint): Promise<ContactRole[]> {
    try {
      const contactRoles = await this.prisma.contactroles.findMany({
        where: {
          roleid: roleId,
          accountid: accountId,
        },
        include: {
          contacts: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
      });

      return contactRoles.map((cr) => ({
        id: cr.id,
        contactId: cr.contactid,
        roleId: cr.roleid,
        roleData: cr.roledata,
        accountId: cr.accountid,
      }));
    } catch (error) {
      console.error('Error getting users with role:', error);
      throw error;
    }
  }

  /**
   * Validate role context (check if roleData matches context)
   */
  private validateRoleContext(contactRole: ContactRole, context: RoleContext): boolean {
    // For account-level roles, just check accountId
    if (
      contactRole.roleId === ROLE_IDS[RoleType.ACCOUNT_ADMIN] ||
      contactRole.roleId === ROLE_IDS[RoleType.ACCOUNT_PHOTO_ADMIN]
    ) {
      return contactRole.accountId === context.accountId;
    }

    // For team-level roles, check if roleData matches teamId
    if (
      contactRole.roleId === ROLE_IDS[RoleType.TEAM_ADMIN] ||
      contactRole.roleId === ROLE_IDS[RoleType.TEAM_PHOTO_ADMIN]
    ) {
      return contactRole.roleData === context.teamId;
    }

    // For league-level roles, check if roleData matches leagueId
    if (contactRole.roleId === ROLE_IDS[RoleType.LEAGUE_ADMIN]) {
      return contactRole.roleData === context.leagueId;
    }

    return false;
  }

  /**
   * Get role level based on role ID
   */
  private getRoleLevel(roleId: string): 'global' | 'account' | 'team' | 'league' | 'none' {
    if (roleId === ROLE_IDS[RoleType.ADMINISTRATOR]) return 'global';
    if (
      roleId === ROLE_IDS[RoleType.ACCOUNT_ADMIN] ||
      roleId === ROLE_IDS[RoleType.ACCOUNT_PHOTO_ADMIN]
    )
      return 'account';
    if (roleId === ROLE_IDS[RoleType.TEAM_ADMIN] || roleId === ROLE_IDS[RoleType.TEAM_PHOTO_ADMIN])
      return 'team';
    if (roleId === ROLE_IDS[RoleType.LEAGUE_ADMIN]) return 'league';
    return 'none';
  }

  /**
   * Get role name by ID
   */
  async getRoleName(roleId: string): Promise<string | null> {
    try {
      const role = await this.prisma.aspnetroles.findUnique({
        where: { id: roleId },
        select: { name: true },
      });
      return role?.name || null;
    } catch (error) {
      console.error('Error getting role name:', error);
      return null;
    }
  }

  /**
   * Get role ID by name
   */
  async getRoleId(roleName: string): Promise<string | null> {
    try {
      const role = await this.prisma.aspnetroles.findFirst({
        where: { name: roleName },
        select: { id: true },
      });
      return role?.id || null;
    } catch (error) {
      console.error('Error getting role ID:', error);
      return null;
    }
  }
}
