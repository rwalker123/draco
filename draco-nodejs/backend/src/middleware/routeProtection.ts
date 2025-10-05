// Route Protection Middleware for Draco Sports Manager
// Implements contact role-based protection, account boundaries, and role hierarchy

import { Request, Response, NextFunction } from 'express';
import { IRoleMiddleware } from '../services/interfaces/roleInterfaces.js';
import { PrismaClient } from '@prisma/client';
import { ROLE_IDS } from '../config/roles.js';
import { RoleContextData } from '../services/interfaces/roleInterfaces.js';
import { RoleNamesType } from '../types/roles.js';
import { UserRolesType } from '@draco/shared-schemas';

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
  private prisma: PrismaClient;

  constructor(roleService: IRoleMiddleware, prisma: PrismaClient) {
    this.roleService = roleService;
    this.prisma = prisma;
  }

  /**
   * Middleware to require authentication
   */
  requireAuth = () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }
      next();
    };
  };

  /**
   * Middleware to require a specific role
   */
  requireRole = (requiredRole: string) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user?.id) {
          res.status(401).json({
            success: false,
            message: 'Authentication required',
          });
          return;
        }

        const roleContext: RoleContextData = {
          accountId: this.extractAccountId(req) || BigInt(0),
          teamId: this.extractTeamId(req),
          leagueId: this.extractLeagueId(req),
          seasonId: this.extractSeasonId(req),
        };

        const roleCheck = await this.roleService.hasRole(req.user.id, requiredRole, roleContext);

        if (!roleCheck.hasRole) {
          res.status(403).json({
            success: false,
            message: `Role '${requiredRole}' required`,
            requiredRole,
            context: roleContext,
          });
          return;
        }

        // Add role information to request for downstream use
        req.userRoles = await this.roleService.getUserRoles(req.user.id, roleContext.accountId);

        next();
      } catch (error) {
        console.error('Role middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    };
  };

  /**
   * Middleware to require a specific permission
   */
  requirePermission = (requiredPermission: string, context?: Partial<RoleContextData>) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user?.id) {
          res.status(401).json({
            success: false,
            message: 'Authentication required',
          });
          return;
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
          res.status(403).json({
            success: false,
            message: `Permission '${requiredPermission}' required`,
            requiredPermission,
            context: roleContext,
          });
          return;
        }

        // Add role information to request for downstream use
        req.userRoles = await this.roleService.getUserRoles(req.user.id, roleContext.accountId);

        next();
      } catch (error) {
        console.error('Permission middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    };
  };

  requirePollManagerAccess = () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user?.id) {
          res.status(401).json({
            success: false,
            message: 'Authentication required',
          });
          return;
        }

        const accountId = req.accountBoundary?.accountId ?? this.extractAccountId(req);

        if (!accountId) {
          res.status(400).json({
            success: false,
            message: 'Account ID required',
          });
          return;
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
          return next();
        }

        const userRoles =
          req.userRoles ?? (await this.roleService.getUserRoles(req.user.id, accountId));

        const hasTeamAdminRole = userRoles.contactRoles.some(
          (contactRole) => contactRole.roleId === ROLE_IDS[RoleNamesType.TEAM_ADMIN],
        );

        if (hasTeamAdminRole) {
          req.userRoles = userRoles;
          return next();
        }

        res.status(403).json({
          success: false,
          message: "Permission 'account.polls.manage' or TeamAdmin role required",
          requiredPermission: 'account.polls.manage',
          requiredRole: ROLE_IDS[RoleNamesType.TEAM_ADMIN],
        });
      } catch (error) {
        console.error('Poll management access middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    };
  };

  /**
   * Middleware to enforce account boundary (user can only access their account's data)
   */
  enforceAccountBoundary = () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user?.id) {
          res.status(401).json({
            success: false,
            message: 'Authentication required',
          });
          return;
        }

        const accountId = this.extractAccountId(req);
        if (!accountId) {
          res.status(400).json({
            success: false,
            message: 'Account ID required',
          });
          return;
        }

        // Get the user's contact record for this account
        const userContactId = await this.checkUserAccount(req.user.id, accountId);

        if (!userContactId) {
          res.status(403).json({
            success: false,
            message: 'Access denied to this account',
          });
          return;
        }

        // First check account boundary
        req.userRoles = await this.roleService.getUserRoles(req.user.id, accountId);
        req.accountBoundary = { contactId: userContactId, accountId, enforced: true };

        return next();
      } catch (error) {
        console.error('Account boundary middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    };
  };

  /**
   * Middleware to enforce team boundary
   */
  enforceTeamBoundary = () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user?.id) {
          res.status(401).json({
            success: false,
            message: 'Authentication required',
          });
          return;
        }

        const teamId = this.extractTeamId(req);
        if (!teamId) {
          res.status(400).json({
            success: false,
            message: 'Team ID required',
          });
          return;
        }

        const accountId = this.extractAccountId(req);
        if (!accountId) {
          res.status(400).json({
            success: false,
            message: 'Account ID required',
          });
          return;
        }

        // First check account boundary
        const userRoles = await this.roleService.getUserRoles(req.user.id, accountId);

        // Allow if user has global administrator role
        if (userRoles.globalRoles.includes(ROLE_IDS[RoleNamesType.ADMINISTRATOR])) {
          req.userRoles = userRoles;
          return next();
        }

        // Allow if user has account admin role
        if (
          userRoles.globalRoles.includes(ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN]) ||
          userRoles.contactRoles.some((cr) => cr.roleId === ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN])
        ) {
          req.userRoles = userRoles;
          return next();
        }

        // Check if user has team-specific roles
        const teamContext: RoleContextData = { accountId: accountId, teamId: teamId };
        const hasTeamRole = await this.roleService.hasRole(
          req.user.id,
          ROLE_IDS[RoleNamesType.TEAM_ADMIN],
          teamContext,
        );

        if (hasTeamRole.hasRole) {
          req.userRoles = userRoles;
          return next();
        }

        res.status(403).json({
          success: false,
          message: 'Access denied to this team',
        });
      } catch (error) {
        console.error('Team boundary middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    };
  };

  /**
   * Middleware to enforce league boundary
   */
  enforceLeagueBoundary = () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user?.id) {
          res.status(401).json({
            success: false,
            message: 'Authentication required',
          });
          return;
        }

        const leagueId = this.extractLeagueId(req);
        if (!leagueId) {
          res.status(400).json({
            success: false,
            message: 'League ID required',
          });
          return;
        }

        const accountId = this.extractAccountId(req);
        if (!accountId) {
          res.status(400).json({
            success: false,
            message: 'Account ID required',
          });
          return;
        }

        // First check account boundary
        const userRoles = await this.roleService.getUserRoles(req.user.id, accountId);

        // Allow if user has global administrator role
        if (userRoles.globalRoles.includes(ROLE_IDS[RoleNamesType.ADMINISTRATOR])) {
          req.userRoles = userRoles;
          return next();
        }

        // Allow if user has account admin role
        if (
          userRoles.globalRoles.includes(ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN]) ||
          userRoles.contactRoles.some((cr) => cr.roleId === ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN])
        ) {
          req.userRoles = userRoles;
          return next();
        }

        // Check if user has league-specific roles
        const leagueContext: RoleContextData = { accountId: accountId, leagueId: leagueId };
        const hasLeagueRole = await this.roleService.hasRole(
          req.user.id,
          ROLE_IDS[RoleNamesType.LEAGUE_ADMIN],
          leagueContext,
        );

        if (hasLeagueRole.hasRole) {
          req.userRoles = userRoles;
          return next();
        }

        res.status(403).json({
          success: false,
          message: 'Access denied to this league',
        });
      } catch (error) {
        console.error('League boundary middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    };
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
      const contact = await this.prisma.contacts.findFirst({
        where: {
          userid: userId,
          creatoraccountid: accountId,
        },
        select: { id: true },
      });

      return contact?.id;
    } catch (error) {
      console.error('Error checking account membership:', error);
      return undefined;
    }
  }
}
