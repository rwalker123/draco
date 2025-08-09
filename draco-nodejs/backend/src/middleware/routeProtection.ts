// Route Protection Middleware for Draco Sports Manager
// Implements contact role-based protection, account boundaries, and role hierarchy

import { Request, Response, NextFunction } from 'express';
import { IRoleMiddleware } from '../interfaces/roleInterfaces.js';
import { RoleContext, RoleType, UserRoles } from '../types/roles.js';
import { ROLE_IDS } from '../config/roles.js';
import { PrismaClient } from '@prisma/client';

// Extend the Request interface to include user and role information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
      };
      userRoles?: UserRoles;
      accountBoundary?: {
        accountId: bigint;
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
  requireRole = (requiredRole: string, context?: Partial<RoleContext>) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user?.id) {
          res.status(401).json({
            success: false,
            message: 'Authentication required',
          });
          return;
        }

        const roleContext: RoleContext = {
          accountId: context?.accountId || this.extractAccountId(req),
          teamId: context?.teamId || this.extractTeamId(req),
          leagueId: context?.leagueId || this.extractLeagueId(req),
          seasonId: context?.seasonId || this.extractSeasonId(req),
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
  requirePermission = (requiredPermission: string, context?: Partial<RoleContext>) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user?.id) {
          res.status(401).json({
            success: false,
            message: 'Authentication required',
          });
          return;
        }

        const roleContext: RoleContext = {
          accountId: context?.accountId || this.extractAccountId(req),
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

        // Check if user has access to this account
        const userRoles = await this.roleService.getUserRoles(req.user.id, accountId);

        // Allow if user has global administrator role
        if (userRoles.globalRoles.includes(ROLE_IDS[RoleType.ADMINISTRATOR])) {
          req.userRoles = userRoles;
          req.accountBoundary = { accountId, enforced: true };
          return next();
        }

        // Allow if user has contact roles in this account
        if (userRoles.contactRoles.length > 0) {
          req.userRoles = userRoles;
          req.accountBoundary = { accountId, enforced: true };
          return next();
        }

        // Check if user is the account owner
        const isAccountOwner = await this.checkAccountOwnership(req.user.id, accountId);
        if (isAccountOwner) {
          req.userRoles = userRoles;
          req.accountBoundary = { accountId, enforced: true };
          return next();
        }

        res.status(403).json({
          success: false,
          message: 'Access denied to this account',
        });
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
        if (userRoles.globalRoles.includes(ROLE_IDS[RoleType.ADMINISTRATOR])) {
          req.userRoles = userRoles;
          return next();
        }

        // Allow if user has account admin role
        if (
          userRoles.globalRoles.includes(ROLE_IDS[RoleType.ACCOUNT_ADMIN]) ||
          userRoles.contactRoles.some((cr) => cr.roleId === ROLE_IDS[RoleType.ACCOUNT_ADMIN])
        ) {
          req.userRoles = userRoles;
          return next();
        }

        // Check if user has team-specific roles
        const teamContext = { accountId, teamId };
        const hasTeamRole = await this.roleService.hasRole(
          req.user.id,
          ROLE_IDS[RoleType.TEAM_ADMIN],
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
        if (userRoles.globalRoles.includes(ROLE_IDS[RoleType.ADMINISTRATOR])) {
          req.userRoles = userRoles;
          return next();
        }

        // Allow if user has account admin role
        if (
          userRoles.globalRoles.includes(ROLE_IDS[RoleType.ACCOUNT_ADMIN]) ||
          userRoles.contactRoles.some((cr) => cr.roleId === ROLE_IDS[RoleType.ACCOUNT_ADMIN])
        ) {
          req.userRoles = userRoles;
          return next();
        }

        // Check if user has league-specific roles
        const leagueContext = { accountId, leagueId };
        const hasLeagueRole = await this.roleService.hasRole(
          req.user.id,
          ROLE_IDS[RoleType.LEAGUE_ADMIN],
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
  requireAdministrator = () => this.requireRole(ROLE_IDS[RoleType.ADMINISTRATOR]);
  requireAccountAdmin = () => this.requireRole(ROLE_IDS[RoleType.ACCOUNT_ADMIN]);
  requireAccountPhotoAdmin = () => this.requireRole(ROLE_IDS[RoleType.ACCOUNT_PHOTO_ADMIN]);
  requireLeagueAdmin = () => this.requireRole(ROLE_IDS[RoleType.LEAGUE_ADMIN]);
  requireTeamAdmin = () => this.requireRole(ROLE_IDS[RoleType.TEAM_ADMIN]);
  requireTeamPhotoAdmin = () => this.requireRole(ROLE_IDS[RoleType.TEAM_PHOTO_ADMIN]);

  /**
   * Middleware to add role information to request (for informational purposes)
   */
  addRoleInfo = () => {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      try {
        if (req.user?.id) {
          const accountId = this.extractAccountId(req);
          req.userRoles = await this.roleService.getUserRoles(req.user.id, accountId);
        }
        next();
      } catch (error) {
        console.error('Error adding role info:', error);
        // Don't fail the request, just continue without role info
        next();
      }
    };
  };

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
   * Check if user is the owner of the account
   */
  private async checkAccountOwnership(userId: string, accountId: bigint): Promise<boolean> {
    try {
      const account = await this.prisma.accounts.findUnique({
        where: { id: accountId },
        select: { owneruserid: true },
      });

      return account?.owneruserid === userId;
    } catch (error) {
      console.error('Error checking account ownership:', error);
      return false;
    }
  }
}
