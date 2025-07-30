// Role-based middleware for route protection
// Extends the existing authentication middleware with role checking

import { Request, Response, NextFunction } from 'express';
import { IRoleMiddleware } from '../interfaces/roleInterfaces';
import { RoleContext, UserRoles } from '../types/roles';

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

  constructor(roleService: IRoleMiddleware) {
    this.roleService = roleService;
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

  // Note: Convenience methods like requireAccountAdmin(), requireTeamAdmin(), etc.
  // are now consolidated in RouteProtection class to avoid duplication

  // Note: enforceAccountBoundary() and related methods are now consolidated
  // in RouteProtection class to avoid duplication

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
   * Middleware to add role information to request (for informational purposes)
   */
  addRoleInfo = () => {
    return async (req: Request, _res: Response, next: NextFunction) => {
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
