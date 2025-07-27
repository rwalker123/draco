// Test routes for role system foundation
// These routes help verify that the role system is working correctly

import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { RoleService } from '../services/roleService';
import prisma from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError, AuthenticationError } from '../utils/customErrors';
import { extractAccountParams } from '../utils/paramExtraction';

// Type definitions for Prisma query results
interface ContactRole {
  id: bigint;
  contactId: bigint;
  roleId: string;
  roleData: bigint;
  accountId: bigint;
}

interface AspNetRole {
  id: string;
  name: string;
}

interface ContactWithRoles {
  id: bigint;
  firstname: string;
  lastname: string;
  email: string | null;
  userid: string | null;
  contactroles: Array<{
    id: bigint;
    roleid: string;
    roledata: bigint;
  }>;
}

const router = Router();
const roleService = new RoleService(prisma);

/**
 * GET /api/role-test/user-roles
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

    res.json({
      success: true,
      data: {
        userId: req.user.id,
        username: req.user.username,
        accountId: accountId?.toString(),
        globalRoles: userRoles.globalRoles,
        contactRoles: userRoles.contactRoles.map((cr: ContactRole) => ({
          id: cr.id.toString(),
          contactId: cr.contactId.toString(),
          roleId: cr.roleId,
          roleData: cr.roleData.toString(),
          accountId: cr.accountId.toString(),
        })),
      },
    });
  }),
);

/**
 * GET /api/role-test/check-role
 * Check if current user has a specific role
 */
router.get(
  '/check-role',
  authenticateToken,
  asyncHandler(async (req, res): Promise<void> => {
    if (!req.user?.id) {
      throw new AuthenticationError('User not found');
    }

    const { roleId, accountId, teamId, leagueId } = req.query;

    if (!roleId) {
      throw new ValidationError('roleId is required');
    }

    const context = {
      accountId: accountId ? BigInt(accountId as string) : undefined,
      teamId: teamId ? BigInt(teamId as string) : undefined,
      leagueId: leagueId ? BigInt(leagueId as string) : undefined,
    };

    const roleCheck = await roleService.hasRole(req.user.id, roleId as string, context);

    res.json({
      success: true,
      data: {
        userId: req.user.id,
        roleId: roleId as string,
        hasRole: roleCheck.hasRole,
        roleLevel: roleCheck.roleLevel,
        context: roleCheck.context,
      },
    });
  }),
);

/**
 * GET /api/role-test/check-permission
 * Check if current user has a specific permission
 */
router.get(
  '/check-permission',
  authenticateToken,
  asyncHandler(async (req, res): Promise<void> => {
    if (!req.user?.id) {
      throw new AuthenticationError('User not found');
    }

    const { permission, accountId, teamId, leagueId } = req.query;

    if (!permission) {
      throw new ValidationError('permission is required');
    }

    const context = {
      accountId: accountId ? BigInt(accountId as string) : undefined,
      teamId: teamId ? BigInt(teamId as string) : undefined,
      leagueId: leagueId ? BigInt(leagueId as string) : undefined,
    };

    const hasPermission = await roleService.hasPermission(
      req.user.id,
      permission as string,
      context,
    );

    res.json({
      success: true,
      data: {
        userId: req.user.id,
        permission: permission as string,
        hasPermission,
        context,
      },
    });
  }),
);

/**
 * GET /api/role-test/role-ids
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

    res.json({
      success: true,
      data: {
        roles: roles.map((role: AspNetRole) => ({
          id: role.id,
          name: role.name,
        })),
      },
    });
  }),
);

/**
 * GET /api/role-test/account-users/:accountId
 * Get all users with roles in a specific account
 */
router.get(
  '/account-users/:accountId',
  authenticateToken,
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

    const usersWithRoles = contacts.map((contact: ContactWithRoles) => ({
      contactId: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      email: contact.email,
      userId: contact.userid,
      roles: contact.contactroles.map((cr) => ({
        id: cr.id.toString(),
        roleId: cr.roleid,
        roleData: cr.roledata.toString(),
      })),
    }));

    res.json({
      success: true,
      data: {
        accountId: accountId.toString(),
        users: usersWithRoles,
      },
    });
  }),
);

/**
 * POST /api/role-test/assign-role
 * Assign a role to a contact (for testing)
 */
router.post(
  '/assign-role',
  authenticateToken,
  asyncHandler(async (req, res): Promise<void> => {
    const { contactId, roleId, roleData, accountId } = req.body;

    if (!contactId || !roleId || !roleData || !accountId) {
      throw new ValidationError('contactId, roleId, roleData, and accountId are required');
    }

    const assignedRole = await roleService.assignRole(
      req.user!.id,
      BigInt(contactId),
      roleId,
      BigInt(roleData),
      BigInt(accountId),
    );

    res.json({
      success: true,
      data: {
        assignedRole: {
          id: assignedRole.id.toString(),
          contactId: assignedRole.contactId.toString(),
          roleId: assignedRole.roleId,
          roleData: assignedRole.roleData.toString(),
          accountId: assignedRole.accountId.toString(),
        },
      },
    });
  }),
);

export default router;
