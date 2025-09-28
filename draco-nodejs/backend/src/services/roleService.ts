// Role Service for Draco Sports Manager
// Handles all role-related operations including contact roles and global roles

import { RoleNamesType } from '../types/roles.js';
import { ROLE_IDS, ROLE_PERMISSIONS_BY_ID, hasRoleOrHigher } from '../config/roles.js';
import { IRoleService } from '../interfaces/roleInterfaces.js';
import {
  ContactRoleType,
  CreateContactRoleType,
  RoleCheckResultType,
  RoleWithContactType,
  UserRolesType,
} from '@draco/shared-schemas';
import {
  RepositoryFactory,
  IContactRepository,
  IRoleRepository,
  ISeasonRepository,
  dbAspnetRolesId,
  dbAspnetRoleName,
  ITeamRepository,
  ILeagueRepository,
} from '../repositories/index.js';
import { RoleResponseFormatter } from '../responseFormatters/index.js';
import { RoleContextData } from '../interfaces/roleInterfaces.js';
import { ValidationError } from '../utils/customErrors.js';

export class RoleService implements IRoleService {
  private contactRepository: IContactRepository;
  private roleRepository: IRoleRepository;
  private seasonRepository: ISeasonRepository;
  private teamRepository: ITeamRepository;
  private leagueRepository: ILeagueRepository;

  constructor() {
    this.contactRepository = RepositoryFactory.getContactRepository();
    this.roleRepository = RepositoryFactory.getRoleRepository();
    this.seasonRepository = RepositoryFactory.getSeasonRepository();
    this.teamRepository = RepositoryFactory.getTeamRepository();
    this.leagueRepository = RepositoryFactory.getLeagueRepository();
  }

  /**
   * Get all roles for a user (both global and contact roles)
   */
  async getUserRoles(userId: string, accountId?: bigint): Promise<UserRolesType> {
    // Get global roles from aspnetuserroles
    const globalRoles: string[] = await this.getGlobalRoles(userId);

    // Get contact roles if accountId is provided
    const contactRoles: RoleWithContactType[] = accountId
      ? await this.getContactRoles(userId, accountId)
      : [];

    return {
      globalRoles,
      contactRoles,
    };
  }

  async getUserRolesByContactId(contactId: bigint, accountId: bigint): Promise<UserRolesType> {
    // Get global roles from aspnetuserroles
    const dbContact = await this.contactRepository.findContactInAccount(contactId, accountId);
    if (!dbContact) {
      throw new ValidationError('Contact not found');
    }

    if (!dbContact.userid) {
      return { globalRoles: [], contactRoles: [] };
    }

    const globalRoles: string[] = await this.getGlobalRoles(dbContact.userid);

    // Get contact roles
    const contactRoles: RoleWithContactType[] = await this.getContactRoles(
      dbContact.userid,
      accountId,
    );

    return {
      globalRoles,
      contactRoles,
    };
  }

  /**
   * Get global roles for a user from aspnetuserroles table
   */
  async getGlobalRoles(userId: string): Promise<string[]> {
    const dbRoles = await this.roleRepository.findGlobalRoles(userId);
    const response: string[] = RoleResponseFormatter.formatGlobalRoles(dbRoles);

    return response;
  }

  /**
   * Get contact roles for a user in a specific account
   */
  async getContactRoles(userId: string, accountId: bigint): Promise<RoleWithContactType[]> {
    // First get the contact ID for this user in this account
    const dbContact = await this.contactRepository.findByUserId(userId, accountId);
    if (!dbContact) {
      return [];
    }

    const dbContactRoles = await this.roleRepository.findMany({
      contactid: dbContact.id,
      accountid: accountId,
    });

    const response: RoleWithContactType[] = RoleResponseFormatter.formatRoleWithContact(
      dbContact,
      dbContactRoles,
    );
    return response;
  }

  /**
   * Check if a user has a specific role in a context
   */
  async hasRole(
    userId: string,
    roleId: string,
    context: RoleContextData,
  ): Promise<RoleCheckResultType> {
    const userRoles: UserRolesType = await this.getUserRoles(userId, context.accountId);

    // Check global roles first
    const foundGlobalRole = userRoles.globalRoles.find((role) => role === roleId);
    if (foundGlobalRole) {
      return RoleResponseFormatter.formatGlobalRoleCheckResult(foundGlobalRole);
    }

    // Check contact roles
    for (const contactRole of userRoles.contactRoles) {
      if (contactRole.roleId === roleId) {
        if (this.validateRoleContext(contactRole, context)) {
          const rowCheckResult: RoleCheckResultType = {
            accountId: context.accountId.toString(),
            userId: userId,
            roleId: contactRole.roleId,
            hasRole: true,
            roleLevel: this.getRoleLevel(roleId),
            context: contactRole.roleData,
          };
          return rowCheckResult;
        }
      }
    }

    // Check role hierarchy
    if (await this.hasRoleOrHigher(userId, roleId, context)) {
      return {
        accountId: context.accountId.toString(),
        userId,
        roleId,
        hasRole: true,
        roleLevel: this.getRoleLevel(roleId),
      };
    }

    const roleCheckResult: RoleCheckResultType = {
      accountId: context.accountId.toString(),
      userId,
      roleId,
      hasRole: false,
      roleLevel: 'none',
    };
    return roleCheckResult;
  }

  /**
   * Check if user has role or higher in hierarchy
   */
  async hasRoleOrHigher(
    userId: string,
    requiredRole: string,
    context: RoleContextData,
  ): Promise<boolean> {
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
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    userId: string,
    permission: string,
    context: RoleContextData,
  ): Promise<boolean> {
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
  }

  /**
   * Assign a role to a contact
   */
  async assignRole(
    accountId: bigint,
    contactId: bigint,
    roleData: CreateContactRoleType,
  ): Promise<RoleWithContactType> {
    // Get contact with account owner information (using direct query due to complex relationship)
    const contact = await this.contactRepository.findContactInAccount(contactId, accountId);

    if (!contact) {
      throw new Error('Contact not found in the specified account');
    }

    const isAccountOwner = await this.contactRepository.isAccountOwner(contactId, accountId);
    if (isAccountOwner) {
      throw new Error('Cannot assign roles to account owner - they already have all permissions');
    }

    const currentSeason = await this.seasonRepository.findCurrentSeason(accountId);

    // For team roles, check if user is already a team manager for this team
    if (
      roleData.roleId === ROLE_IDS[RoleNamesType.TEAM_ADMIN] ||
      roleData.roleId === ROLE_IDS[RoleNamesType.TEAM_PHOTO_ADMIN]
    ) {
      // Get current season for validation
      if (!currentSeason) {
        throw new Error(
          'Current season not found for account. Must have a current season to assign team roles.',
        );
      }

      const teamManager = await this.teamRepository.findTeamManager(
        contactId,
        roleData.roleData,
        currentSeason.id,
      );

      if (teamManager) {
        const roleName =
          roleData.roleId === ROLE_IDS[RoleNamesType.TEAM_ADMIN]
            ? RoleNamesType.TEAM_ADMIN
            : RoleNamesType.TEAM_PHOTO_ADMIN;
        throw new Error(
          `Cannot assign ${roleName} role - user is already a team manager and has this role automatically`,
        );
      }
    }

    // Validate role-specific data requirements
    if (
      roleData.roleId === ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN] ||
      roleData.roleId === ROLE_IDS[RoleNamesType.ACCOUNT_PHOTO_ADMIN]
    ) {
      // Account roles: roleData must be the accountId
      if (roleData.roleData !== accountId) {
        throw new Error('Invalid role data', { cause: roleData.roleData });
      }
    } else if (roleData.roleId === ROLE_IDS[RoleNamesType.LEAGUE_ADMIN]) {
      // League role: seasonId is required
      if (!currentSeason) {
        throw new Error(
          'Current season not found for account. Must have a current season to assign league roles.',
        );
      }

      const leagueSeason = await this.leagueRepository.findLeagueSeason(
        roleData.roleData,
        currentSeason.id,
        accountId,
      );
      if (!leagueSeason) {
        throw new Error('Invalid Role Data', { cause: roleData.roleData });
      }
    } else if (
      roleData.roleId === ROLE_IDS[RoleNamesType.TEAM_ADMIN] ||
      roleData.roleId === ROLE_IDS[RoleNamesType.TEAM_PHOTO_ADMIN]
    ) {
      // Team roles: seasonId is required
      if (!currentSeason) {
        throw new Error(
          'Current season not found for account. Must have a current season to assign team roles.',
        );
      }

      const teamSeason = await this.teamRepository.findTeamSeason(
        roleData.roleData,
        currentSeason.id,
        accountId,
      );
      if (!teamSeason) {
        throw new Error('Invalid Role Data', { cause: roleData.roleData });
      }
    }

    const existingRole = await this.roleRepository.findRole(
      contactId,
      roleData.roleId,
      roleData.roleData,
      accountId,
    );
    // Check if role already exists
    if (existingRole) {
      throw new ValidationError('Role already assigned');
    }

    const newRole = await this.roleRepository.create({
      contactid: contactId,
      roleid: roleData.roleId,
      roledata: roleData.roleData,
      accountid: accountId,
    });

    if (!newRole) {
      throw new Error('Failed to create role');
    }

    // Fetch context name for the newly assigned role
    const contextNames = new Map<string, string>();
    const contextKey = `${newRole.roleid}-${newRole.roledata}`;

    if (
      newRole.roleid === ROLE_IDS[RoleNamesType.TEAM_ADMIN] ||
      newRole.roleid === ROLE_IDS[RoleNamesType.TEAM_PHOTO_ADMIN]
    ) {
      if (currentSeason) {
        const teamSeason = await this.teamRepository.findTeamSeason(
          newRole.roledata,
          currentSeason.id,
          accountId,
        );
        if (teamSeason) {
          contextNames.set(contextKey, teamSeason.name);
        }
      }
    } else if (newRole.roleid === ROLE_IDS[RoleNamesType.LEAGUE_ADMIN]) {
      if (currentSeason) {
        const leagueSeason = await this.leagueRepository.findLeagueSeason(
          newRole.roledata,
          currentSeason.id,
          accountId,
        );
        if (leagueSeason) {
          contextNames.set(contextKey, leagueSeason.league.name);
        }
      }
    } else if (newRole.roleid === ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN]) {
      contextNames.set(contextKey, 'Account Admin');
    } else if (newRole.roleid === ROLE_IDS[RoleNamesType.ACCOUNT_PHOTO_ADMIN]) {
      contextNames.set(contextKey, 'Account Photo Admin');
    } else if (newRole.roleid === ROLE_IDS[RoleNamesType.ADMINISTRATOR]) {
      contextNames.set(contextKey, 'Administrator');
    }

    const response = RoleResponseFormatter.formatRoleWithContact(contact, [newRole], contextNames);
    return response[0];
  }

  /**
   * Remove a role from a contact
   */
  async removeRole(
    contactId: bigint,
    roleId: string,
    roleData: bigint,
    accountId: bigint,
  ): Promise<ContactRoleType> {
    const dbContactRole = await this.roleRepository.removeContactRole(
      contactId,
      roleId,
      roleData,
      accountId,
    );

    if (!dbContactRole) {
      throw new ValidationError('Role not found');
    }

    const response = RoleResponseFormatter.formatContactRole(dbContactRole);
    return response;
  }

  /**
   * Get all users with a specific role in an account
   */
  async getUsersWithRole(roleId: string, accountId: bigint): Promise<RoleWithContactType[]> {
    const contactRoles = await this.roleRepository.getUsersWithRole(roleId, accountId);

    const response: RoleWithContactType[] =
      RoleResponseFormatter.formatRoleWithContacts(contactRoles);
    return response;
  }

  /**
   * Validate role context (check if roleData matches context)
   */
  private validateRoleContext(contactRole: RoleWithContactType, context: RoleContextData): boolean {
    // For account-level roles, just check accountId
    if (
      contactRole.roleId === ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN] ||
      contactRole.roleId === ROLE_IDS[RoleNamesType.ACCOUNT_PHOTO_ADMIN]
    ) {
      return contactRole.accountId === context.accountId.toString();
    }

    // For team-level roles, check if roleData matches teamId
    if (
      contactRole.roleId === ROLE_IDS[RoleNamesType.TEAM_ADMIN] ||
      contactRole.roleId === ROLE_IDS[RoleNamesType.TEAM_PHOTO_ADMIN]
    ) {
      return contactRole.roleData === context.teamId?.toString();
    }

    // For league-level roles, check if roleData matches leagueId
    if (contactRole.roleId === ROLE_IDS[RoleNamesType.LEAGUE_ADMIN]) {
      return contactRole.roleData === context.leagueId?.toString();
    }

    return false;
  }

  /**
   * Get role level based on role ID
   */
  private getRoleLevel(roleId: string): 'global' | 'account' | 'team' | 'league' | 'none' {
    if (roleId === ROLE_IDS[RoleNamesType.ADMINISTRATOR]) return 'global';
    if (
      roleId === ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN] ||
      roleId === ROLE_IDS[RoleNamesType.ACCOUNT_PHOTO_ADMIN]
    )
      return 'account';
    if (
      roleId === ROLE_IDS[RoleNamesType.TEAM_ADMIN] ||
      roleId === ROLE_IDS[RoleNamesType.TEAM_PHOTO_ADMIN]
    )
      return 'team';
    if (roleId === ROLE_IDS[RoleNamesType.LEAGUE_ADMIN]) return 'league';
    return 'none';
  }

  /**
   * Get role name by ID
   */
  async getRoleName(roleId: string): Promise<string | null> {
    const role: dbAspnetRoleName | null = await this.roleRepository.findRoleName(roleId);

    return role?.name || null;
  }

  /**
   * Get role ID by name
   */
  async getRoleId(roleName: string): Promise<string | null> {
    const role: dbAspnetRolesId | null = await this.roleRepository.findRoleId(roleName);

    return role?.id || null;
  }
}
