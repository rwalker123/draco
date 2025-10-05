// Test routes for role system foundation
// These routes help verify that the role system is working correctly

import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError, AuthenticationError } from '../utils/customErrors.js';
import { extractAccountParams } from '../utils/paramExtraction.js';
import { DateUtils } from '../utils/dateUtils.js';
import {
  BaseRoleType,
  RegisteredUserWithRolesType,
  RoleCheckType,
  RoleMetadataSchemaType,
} from '@draco/shared-schemas';
import { RoleContextData } from '@/services/interfaces/roleInterfaces.js';

const router = Router();
const roleService = ServiceFactory.getRoleService();
const routeProtection = ServiceFactory.getRouteProtection();

/**
 * GET /api/roles/user-roles
 * Get current user's roles (for testing)
 */
router.get(
  '/user-roles',
  authenticateToken,
  asyncHandler(async (req, res): Promise<void> => {
    if (!req.user?.id) {
      throw new AuthenticationError('User not found');
    }

    const accountId = req.query.accountId ? BigInt(req.query.accountId as string) : undefined;
    const registeredUserWithRoles: RegisteredUserWithRolesType =
      await roleService.getRegisteredUserWithRoles(req.user.id, req.user.username, accountId);

    res.json(registeredUserWithRoles);
  }),
);

/**
 * GET /api/roles/check-role
 * Check if current user has a specific role
 */
router.get(
  '/check-role',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req, res): Promise<void> => {
    if (!req.user?.id) {
      throw new AuthenticationError('User not found');
    }

    const { roleId, accountId, teamId, leagueId } = req.query;

    if (!roleId) {
      throw new ValidationError('roleId is required');
    }

    const context: RoleContextData = {
      accountId: accountId ? BigInt(accountId as string) : BigInt(0),
      teamId: teamId ? BigInt(teamId as string) : undefined,
      leagueId: leagueId ? BigInt(leagueId as string) : undefined,
    };

    const roleCheck: RoleCheckType = await roleService.hasRole(
      req.user.id,
      roleId as string,
      context,
    );

    res.json(roleCheck);
  }),
);

/**
 * GET /api/roles/role-ids
 * Get all role IDs and names (for reference)
 */
router.get(
  '/role-ids',
  asyncHandler(async (req, res) => {
    const roles: BaseRoleType[] = await roleService.getRoleIdentifiers();

    res.json(roles);
  }),
);

/**
 * GET /api/roles/account-users/:accountId
 * Get all users with roles in a specific account
 */
router.get(
  '/account-users/:accountId',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req, res) => {
    const { accountId } = extractAccountParams(req.params);

    const contacts = await roleService.getAccountContactsWithRoles(accountId);

    res.json(contacts);
  }),
);

/**
 * GET /api/roles/roles/metadata
 * Get role hierarchy and permissions metadata for frontend caching
 */
router.get(
  '/roles/metadata',
  authenticateToken, // Requires JWT but no permission checks
  asyncHandler(async (req, res): Promise<void> => {
    // Import role metadata from config
    const { ROLE_INHERITANCE_BY_ID, ROLE_PERMISSIONS_BY_ID } = await import('../config/roles.js');

    // Create a timestamp for cache invalidation
    const timestamp = DateUtils.formatDateTimeForResponse(new Date());
    const version = '1.0.0'; // Increment this when role metadata changes

    const result: RoleMetadataSchemaType = {
      version,
      timestamp,
      hierarchy: ROLE_INHERITANCE_BY_ID,
      permissions: ROLE_PERMISSIONS_BY_ID,
    };

    res.json(result);
  }),
);

export default router;
