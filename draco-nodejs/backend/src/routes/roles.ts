// Test routes for role system foundation
// These routes help verify that the role system is working correctly

import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError, AuthenticationError } from '../utils/customErrors.js';
import { extractAccountParams } from '../utils/paramExtraction.js';
import { DateUtils } from '../utils/dateUtils.js';
import {
  BaseRoleType,
  ContactWithContactRolesType,
  RegisteredUserWithRolesType,
  RoleCheckType,
  RoleMetadataSchemaType,
} from '@draco/shared-schemas';
import { RoleContextData } from '@/interfaces/roleInterfaces.js';

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
    const userRoles = await roleService.getUserRoles(req.user.id, accountId);

    const result: RegisteredUserWithRolesType = {
      userId: req.user.id,
      userName: req.user.username,
      globalRoles: userRoles.globalRoles,
      contactRoles: userRoles.contactRoles.map((cr) => ({
        id: cr.id.toString(),
        roleId: cr.roleId,
        roleData: cr.roleData.toString(),
        accountId: cr.accountId.toString(),
        contact: cr.contact,
      })),
    };

    res.json(result);
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

    const roleCheck = await roleService.hasRole(req.user.id, roleId as string, context);

    const result: RoleCheckType = {
      userId: req.user.id,
      roleId: roleId as string,
      hasRole: roleCheck.hasRole,
      roleLevel: roleCheck.roleLevel,
      context: roleCheck.context,
    };

    res.json(result);
  }),
);

/**
 * GET /api/roles/role-ids
 * Get all role IDs and names (for reference)
 */
router.get(
  '/role-ids',
  asyncHandler(async (req, res) => {
    const roles = await prisma.aspnetroles.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const result: BaseRoleType[] = roles.map((role) => ({
      roleId: role.id,
      roleName: role.name,
    }));

    res.json(result);
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

    // Get all contacts in this account
    const contacts = await prisma.contacts.findMany({
      where: {
        creatoraccountid: accountId,
      },
      include: {
        contactroles: {
          where: {
            accountid: accountId,
          },
        },
      },
    });

    const result: ContactWithContactRolesType[] = contacts.map((contact) => ({
      id: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      middleName: contact.middlename || undefined,
      email: contact.email || undefined,
      userId: contact.userid || undefined,
      roles: contact.contactroles.map((cr) => ({
        id: cr.id.toString(),
        roleId: cr.roleid,
        roleData: cr.roledata.toString(),
      })),
    }));

    res.json(result);
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
