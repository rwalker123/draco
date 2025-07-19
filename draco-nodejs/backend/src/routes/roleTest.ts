// Test routes for role system foundation
// These routes help verify that the role system is working correctly

import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { RoleService } from '../services/roleService';
import prisma from '../lib/prisma';

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
router.get('/user-roles', authenticateToken, async (req, res): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'User not found' });
      return;
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
  } catch (error) {
    console.error('Error getting user roles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/role-test/check-role
 * Check if current user has a specific role
 */
router.get('/check-role', authenticateToken, async (req, res): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const { roleId, accountId, teamId, leagueId } = req.query;

    if (!roleId) {
      res.status(400).json({ error: 'roleId is required' });
      return;
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
  } catch (error) {
    console.error('Error checking role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/role-test/check-permission
 * Check if current user has a specific permission
 */
router.get('/check-permission', authenticateToken, async (req, res): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const { permission, accountId, teamId, leagueId } = req.query;

    if (!permission) {
      res.status(400).json({ error: 'permission is required' });
      return;
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
  } catch (error) {
    console.error('Error checking permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/role-test/role-ids
 * Get all role IDs and names (for reference)
 */
router.get('/role-ids', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error getting role IDs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/role-test/account-users/:accountId
 * Get all users with roles in a specific account
 */
router.get('/account-users/:accountId', authenticateToken, async (req, res) => {
  try {
    const accountId = BigInt(req.params.accountId);

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
  } catch (error) {
    console.error('Error getting account users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/role-test/assign-role
 * Assign a role to a contact (for testing)
 */
router.post('/assign-role', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { contactId, roleId, roleData, accountId } = req.body;

    if (!contactId || !roleId || !roleData || !accountId) {
      res.status(400).json({
        error: 'contactId, roleId, roleData, and accountId are required',
      });
      return;
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
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
