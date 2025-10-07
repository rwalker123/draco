// Route Protection Middleware for Draco Sports Manager
// Implements contact role-based protection, account boundaries, and role hierarchy

import { Request, Response, NextFunction } from 'express';
import { IRoleMiddleware } from '../services/interfaces/roleInterfaces.js';
import { ROLE_IDS } from '../config/roles.js';
import { RoleContextData } from '../services/interfaces/roleInterfaces.js';
import { RoleNamesType } from '../types/roles.js';
import { UserRolesType } from '@draco/shared-schemas';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../utils/customErrors.js';
import { ContactService } from '../services/contactService.js';
import { UserService } from '../services/userService.js';
import { ServiceFactory } from '../services/serviceFactory.js';

// Extend the Request interface to include user and role information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
      };
      userRoles?: UserRolesType;
      accountBoundary?: {
        accountId: bigint;
        contactId: bigint;
        enforced: boolean;
      };
    }
  }
}

export class RouteProtection {
  private roleService: IRoleMiddleware;
  private contactService: ContactService;
  private userService: UserService;

  constructor() {
    this.roleService = ServiceFactory.getRoleService();
    this.contactService = ServiceFactory.getContactService();
    this.userService = ServiceFactory.getUserService();
  }

  /**
   * Middleware to require authentication
   */
  requireAuth = () => {
    return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
      if (!req.user?.id) {
        throw new AuthenticationError('Authentication required');
      }
      next();
    });
  };

  /**
   * Middleware to require a specific role
   */
  requireRole = (requiredRole: string) => {
    return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
      if (!req.user?.id) {
        throw new AuthenticationError('Authentication required');
      }

      const roleContext: RoleContextData = {
        accountId: this.extractAccountId(req) || BigInt(0),
        teamId: this.extractTeamId(req),
        leagueId: this.extractLeagueId(req),
        seasonId: this.extractSeasonId(req),
      };

      const roleCheck = await this.roleService.hasRole(req.user.id, requiredRole, roleContext);

      if (!roleCheck.hasRole) {
        throw new AuthorizationError(`Role '${requiredRole}' required`);
      }

      req.userRoles = await this.roleService.getUserRoles(req.user.id, roleContext.accountId);

      next();
    });
  };

  /**
   * Middleware to require a specific permission
   */
  requirePermission = (requiredPermission: string, context?: Partial<RoleContextData>) => {
    return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
      if (!req.user?.id) {
        throw new AuthenticationError('Authentication required');
      }

      const roleContext: RoleContextData = {
        accountId: context?.accountId || this.extractAccountId(req) || BigInt(0),
        teamId: context?.teamId || this.extractTeamId(req),
        leagueId: context?.leagueId || this.extractLeagueId(req),
        seasonId: context?.seasonId || this.extractSeasonId(req),
      };

      const hasPermission = await this.roleService.hasPermission(
        req.user.id,
        requiredPermission,
        roleContext,
      );

      if (!hasPermission) {
        throw new AuthorizationError(`Permission '${requiredPermission}' required`);
      }

      req.userRoles = await this.roleService.getUserRoles(req.user.id, roleContext.accountId);

      next();
    });
  };

  requirePollManagerAccess = () => {
    return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
      if (!req.user?.id) {
        throw new AuthenticationError('Authentication required');
      }

      const accountId = req.accountBoundary?.accountId ?? this.extractAccountId(req);

      if (!accountId) {
        throw new ValidationError('Account ID required');
      }

      const roleContext: RoleContextData = {
        accountId,
        teamId: this.extractTeamId(req),
        leagueId: this.extractLeagueId(req),
        seasonId: this.extractSeasonId(req),
      };

      const hasPermission = await this.roleService.hasPermission(
        req.user.id,
        'account.polls.manage',
        roleContext,
      );

      if (hasPermission) {
        if (!req.userRoles) {
          req.userRoles = await this.roleService.getUserRoles(req.user.id, accountId);
        }
        next();
        return;
      }

      const userRoles =
        req.userRoles ?? (await this.roleService.getUserRoles(req.user.id, accountId));

      const hasTeamAdminRole = userRoles.contactRoles.some(
        (contactRole) => contactRole.roleId === ROLE_IDS[RoleNamesType.TEAM_ADMIN],
      );

      if (hasTeamAdminRole) {
        req.userRoles = userRoles;
        next();
        return;
      }

      throw new AuthorizationError("Permission 'account.polls.manage' or TeamAdmin role required");
    });
  };

  /**
   * Middleware to enforce account boundary (user can only access their account's data)
   */
  enforceAccountBoundary = () => {
    return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
      if (!req.user?.id) {
        throw new AuthenticationError('Authentication required');
      }

      const accountId = this.extractAccountId(req);
      if (!accountId) {
        throw new ValidationError('Account ID required');
      }

      const userContactId = await this.checkUserAccount(req.user.id, accountId);

      if (!userContactId) {
        throw new AuthorizationError('Access denied to this account');
      }

      req.userRoles = await this.roleService.getUserRoles(req.user.id, accountId);
      req.accountBoundary = { contactId: userContactId, accountId, enforced: true };

      next();
    });
  };

  /**
   * Middleware to enforce account owner
   * @returns Middleware to enforce account owner
   */
  enforceAccountOwner = () => {
    return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
      if (!req.user?.id) {
        throw new AuthenticationError('Authentication required');
      }

      const accountId = this.extractAccountId(req);
      if (!accountId) {
        throw new ValidationError('Account ID required');
      }

      const accountOwner = await this.userService.isAccountOwner(req.user.id, accountId);
      const userRoles = await this.roleService.getUserRoles(req.user.id, accountId);
      if (!accountOwner) {
        // check to see if administrator
        if (!userRoles.globalRoles.includes(ROLE_IDS[RoleNamesType.ADMINISTRATOR])) {
          throw new AuthorizationError('Access denied');
        }
      }

      req.userRoles = userRoles;
      const userContactId = await this.checkUserAccount(req.user.id, accountId);
      req.accountBoundary = { contactId: userContactId || BigInt(0), accountId, enforced: true };

      next();
    });
  };

  /**
   * Middleware to enforce team boundary
   */
  enforceTeamBoundary = () => {
    return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
      if (!req.user?.id) {
        throw new AuthenticationError('Authentication required');
      }

      const teamId = this.extractTeamId(req);
      if (!teamId) {
        throw new ValidationError('Team ID required');
      }

      const accountId = this.extractAccountId(req);
      if (!accountId) {
        throw new ValidationError('Account ID required');
      }

      const userRoles = await this.roleService.getUserRoles(req.user.id, accountId);

      if (userRoles.globalRoles.includes(ROLE_IDS[RoleNamesType.ADMINISTRATOR])) {
        req.userRoles = userRoles;
        next();
        return;
      }

      if (
        userRoles.globalRoles.includes(ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN]) ||
        userRoles.contactRoles.some((cr) => cr.roleId === ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN])
      ) {
        req.userRoles = userRoles;
        next();
        return;
      }

      const teamContext: RoleContextData = { accountId: accountId, teamId: teamId };
      const hasTeamRole = await this.roleService.hasRole(
        req.user.id,
        ROLE_IDS[RoleNamesType.TEAM_ADMIN],
        teamContext,
      );

      if (hasTeamRole.hasRole) {
        req.userRoles = userRoles;
        next();
        return;
      }

      throw new AuthorizationError('Access denied to this team');
    });
  };

  /**
   * Middleware to enforce league boundary
   */
  enforceLeagueBoundary = () => {
    return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
      if (!req.user?.id) {
        throw new AuthenticationError('Authentication required');
      }

      const leagueId = this.extractLeagueId(req);
      if (!leagueId) {
        throw new ValidationError('League ID required');
      }

      const accountId = this.extractAccountId(req);
      if (!accountId) {
        throw new ValidationError('Account ID required');
      }

      const userRoles = await this.roleService.getUserRoles(req.user.id, accountId);

      if (userRoles.globalRoles.includes(ROLE_IDS[RoleNamesType.ADMINISTRATOR])) {
        req.userRoles = userRoles;
        next();
        return;
      }

      if (
        userRoles.globalRoles.includes(ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN]) ||
        userRoles.contactRoles.some((cr) => cr.roleId === ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN])
      ) {
        req.userRoles = userRoles;
        next();
        return;
      }

      const leagueContext: RoleContextData = { accountId: accountId, leagueId: leagueId };
      const hasLeagueRole = await this.roleService.hasRole(
        req.user.id,
        ROLE_IDS[RoleNamesType.LEAGUE_ADMIN],
        leagueContext,
      );

      if (hasLeagueRole.hasRole) {
        req.userRoles = userRoles;
        next();
        return;
      }

      throw new AuthorizationError('Access denied to this league');
    });
  };

  /**
   * Convenience methods for common role requirements
   */
  requireAdministrator = () => this.requireRole(ROLE_IDS[RoleNamesType.ADMINISTRATOR]);
  requireAccountAdmin = () => this.requireRole(ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN]);
  requireAccountPhotoAdmin = () => this.requireRole(ROLE_IDS[RoleNamesType.ACCOUNT_PHOTO_ADMIN]);
  requireLeagueAdmin = () => this.requireRole(ROLE_IDS[RoleNamesType.LEAGUE_ADMIN]);
  requireTeamAdmin = () => this.requireRole(ROLE_IDS[RoleNamesType.TEAM_ADMIN]);
  requireTeamPhotoAdmin = () => this.requireRole(ROLE_IDS[RoleNamesType.TEAM_PHOTO_ADMIN]);

  /**
   * Extract account ID from request (from URL params, body, or query)
   */
  private extractAccountId(req: Request): bigint | undefined {
    // Try to get from URL params first
    if (req.params.accountId) {
      return BigInt(req.params.accountId);
    }

    // Try to get from body
    if (req.body?.accountId) {
      return BigInt(req.body.accountId);
    }

    // Try to get from query
    if (req.query?.accountId) {
      return BigInt(req.query.accountId as string);
    }

    return undefined;
  }

  /**
   * Extract team ID from request
   */
  private extractTeamId(req: Request): bigint | undefined {
    if (req.params.teamId) {
      return BigInt(req.params.teamId);
    }
    if (req.body?.teamId) {
      return BigInt(req.body.teamId);
    }
    if (req.query?.teamId) {
      return BigInt(req.query.teamId as string);
    }
    return undefined;
  }

  /**
   * Extract league ID from request
   */
  private extractLeagueId(req: Request): bigint | undefined {
    if (req.params.leagueId) {
      return BigInt(req.params.leagueId);
    }
    if (req.body?.leagueId) {
      return BigInt(req.body.leagueId);
    }
    if (req.query?.leagueId) {
      return BigInt(req.query.leagueId as string);
    }
    return undefined;
  }

  /**
   * Extract season ID from request
   */
  private extractSeasonId(req: Request): bigint | undefined {
    if (req.params.seasonId) {
      return BigInt(req.params.seasonId);
    }
    if (req.body?.seasonId) {
      return BigInt(req.body.seasonId);
    }
    if (req.query?.seasonId) {
      return BigInt(req.query.seasonId as string);
    }
    return undefined;
  }

  /**
   * Check if user is member of account
   */
  private async checkUserAccount(userId: string, accountId: bigint): Promise<bigint | undefined> {
    try {
      const contact = await this.contactService.getContactByUserId(userId, accountId);
      return contact ? BigInt(contact.id) : undefined;
    } catch (error) {
      console.error('Error checking account membership:', error);
      return undefined;
    }
  }
}
