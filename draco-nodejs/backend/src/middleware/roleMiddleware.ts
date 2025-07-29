// Role-based middleware for route protection
// Extends the existing authentication middleware with role checking

import { Request, Response, NextFunction } from 'express';
import { IRoleMiddleware } from '../interfaces/roleInterfaces';
import { RoleContext, RoleType, UserRoles } from '../types/roles';
import { ROLE_IDS } from '../config/roles';
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
    }
  }
}

export class RoleMiddleware {
  private roleService: IRoleMiddleware;
  private prisma: PrismaClient;

  constructor(roleService: IRoleMiddleware, prisma: PrismaClient) {
    this.roleService = roleService;
    this.prisma = prisma;
  }

  /**
   * Middleware to require a specific role
   */
  requireRole = (requiredRole: string, context?: Partial<RoleContext>) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user?.id) {
          res.status(401).json({ error: 'Authentication required' });
          return;
        }

        const roleContext: RoleContext = {
          accountId: context?.accountId || this.extractAccountId(req),
          teamId: context?.teamId,
          leagueId: context?.leagueId,
          seasonId: context?.seasonId,
        };

        const roleCheck = await this.roleService.hasRole(req.user.id, requiredRole, roleContext);

        if (!roleCheck.hasRole) {
          res.status(403).json({
            error: 'Insufficient permissions',
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
        res.status(500).json({ error: 'Internal server error' });
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
          res.status(401).json({ error: 'Authentication required' });
          return;
        }

        const roleContext: RoleContext = {
          accountId: context?.accountId || this.extractAccountId(req),
          teamId: context?.teamId,
          leagueId: context?.leagueId,
          seasonId: context?.seasonId,
        };

        const hasPermission = await this.roleService.hasPermission(
          req.user.id,
          requiredPermission,
          roleContext,
        );

        if (!hasPermission) {
          res.status(403).json({
            error: 'Insufficient permissions',
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
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  };

  /**
   * Middleware to require account admin role
   */
  requireAccountAdmin = () => {
    return this.requireRole(ROLE_IDS[RoleType.ACCOUNT_ADMIN]);
  };

  /**
   * Middleware to require team admin role
   */
  requireTeamAdmin = () => {
    return this.requireRole(ROLE_IDS[RoleType.TEAM_ADMIN]);
  };

  /**
   * Middleware to require league admin role
   */
  requireLeagueAdmin = () => {
    return this.requireRole(ROLE_IDS[RoleType.LEAGUE_ADMIN]);
  };

  /**
   * Middleware to require administrator role
   */
  requireAdministrator = () => {
    return this.requireRole(ROLE_IDS[RoleType.ADMINISTRATOR]);
  };

  /**
   * Middleware to enforce account boundary (user can only access their account's data)
   */
  enforceAccountBoundary = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const accountId = this.extractAccountId(req);
        if (!accountId) {
          return res.status(400).json({ error: 'Account ID required' });
        }

        // Check if user has access to this account
        const userRoles = await this.roleService.getUserRoles(req.user.id, accountId);

        // Allow if user has global administrator role
        if (userRoles.globalRoles.includes(ROLE_IDS[RoleType.ADMINISTRATOR])) {
          req.userRoles = userRoles;
          return next();
        }

        // Allow if user has contact roles in this account
        if (userRoles.contactRoles.length > 0) {
          req.userRoles = userRoles;
          return next();
        }

        // Check if user is the account owner
        const isAccountOwner = await this.checkAccountOwnership(req.user.id, accountId);
        if (isAccountOwner) {
          req.userRoles = userRoles;
          return next();
        }

        return res.status(403).json({ error: 'Access denied to this account' });
      } catch (error) {
        console.error('Account boundary middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
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

  /**
   * Middleware to add role information to request (for informational purposes)
   */
  addRoleInfo = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
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
}
