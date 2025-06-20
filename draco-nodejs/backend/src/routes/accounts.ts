// Protected Accounts Routes for Draco Sports Manager
// Demonstrates route protection with role-based access control

import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { RouteProtection } from '../middleware/routeProtection';
import { RoleService } from '../services/roleService';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const roleService = new RoleService(prisma);
const routeProtection = new RouteProtection(roleService, prisma);

/**
 * GET /api/accounts
 * Get all accounts (Administrator only)
 */
router.get('/', 
  authenticateToken,
  routeProtection.requireAdministrator(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accounts = await prisma.accounts.findMany({
        select: {
          id: true,
          name: true,
          accounttypeid: true,
          owneruserid: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      res.json({
        success: true,
        data: {
          accounts: accounts.map((account: any) => ({
            id: account.id.toString(),
            name: account.name,
            accountTypeId: account.accounttypeid.toString(),
            ownerUserId: account.owneruserid
          }))
        }
      });
    } catch (error) {
      console.error('Error getting accounts:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/accounts/:accountId
 * Get specific account (requires account access)
 */
router.get('/:accountId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);

      const account = await prisma.accounts.findUnique({
        where: { id: accountId },
        select: {
          id: true,
          name: true,
          accounttypeid: true,
          owneruserid: true
        }
      });

      if (!account) {
        res.status(404).json({
          success: false,
          message: 'Account not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          account: {
            id: account.id.toString(),
            name: account.name,
            accountTypeId: account.accounttypeid.toString(),
            ownerUserId: account.owneruserid
          }
        }
      });
    } catch (error) {
      console.error('Error getting account:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/accounts
 * Create new account (Administrator only)
 */
router.post('/',
  authenticateToken,
  routeProtection.requireAdministrator(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, accountTypeId, ownerUserId } = req.body;

      if (!name || !accountTypeId || !ownerUserId) {
        res.status(400).json({
          success: false,
          message: 'Name, account type ID, and owner user ID are required'
        });
        return;
      }

      const account = await prisma.accounts.create({
        data: {
          name,
          accounttypeid: BigInt(accountTypeId),
          owneruserid: ownerUserId,
          firstyear: new Date().getFullYear(),
          affiliationid: BigInt(1), // Default affiliation
          timezoneid: 'UTC',
          twitteraccountname: '',
          twitteroauthtoken: '',
          twitteroauthsecretkey: '',
          defaultvideo: '',
          autoplayvideo: false
        }
      });

      res.status(201).json({
        success: true,
        data: {
          account: {
            id: account.id.toString(),
            name: account.name,
            accountTypeId: account.accounttypeid.toString(),
            ownerUserId: account.owneruserid
          }
        }
      });
    } catch (error) {
      console.error('Error creating account:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * PUT /api/accounts/:accountId
 * Update account (Account Admin or Administrator)
 */
router.put('/:accountId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const { name, accountTypeId } = req.body;

      if (!name && !accountTypeId) {
        res.status(400).json({
          success: false,
          message: 'At least one field to update is required'
        });
        return;
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (accountTypeId) updateData.accounttypeid = BigInt(accountTypeId);

      const account = await prisma.accounts.update({
        where: { id: accountId },
        data: updateData,
        select: {
          id: true,
          name: true,
          accounttypeid: true,
          owneruserid: true
        }
      });

      res.json({
        success: true,
        data: {
          account: {
            id: account.id.toString(),
            name: account.name,
            accountTypeId: account.accounttypeid.toString(),
            ownerUserId: account.owneruserid
          }
        }
      });
    } catch (error) {
      console.error('Error updating account:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * DELETE /api/accounts/:accountId
 * Delete account (Administrator only)
 */
router.delete('/:accountId',
  authenticateToken,
  routeProtection.requireAdministrator(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);

      // Check if account exists
      const existingAccount = await prisma.accounts.findUnique({
        where: { id: accountId }
      });

      if (!existingAccount) {
        res.status(404).json({
          success: false,
          message: 'Account not found'
        });
        return;
      }

      // Delete account (this will cascade to related records)
      await prisma.accounts.delete({
        where: { id: accountId }
      });

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/accounts/:accountId/users
 * Get users in account (requires account access)
 */
router.get('/:accountId/users',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.users.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);

      const contacts = await prisma.contacts.findMany({
        where: {
          creatoraccountid: accountId
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          userid: true
        },
        orderBy: [
          { lastname: 'asc' },
          { firstname: 'asc' }
        ]
      });

      const users = contacts.map((contact: any) => ({
        id: contact.id.toString(),
        firstName: contact.firstname,
        lastName: contact.lastname,
        email: contact.email,
        userId: contact.userid
      }));

      res.json({
        success: true,
        data: {
          accountId: accountId.toString(),
          users
        }
      });
    } catch (error) {
      console.error('Error getting account users:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/accounts/:accountId/users/:contactId/roles
 * Assign role to user in account (Account Admin or Administrator)
 */
router.post('/:accountId/users/:contactId/roles',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.roles.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const contactId = BigInt(req.params.contactId);
      const { roleId, roleData } = req.body;

      if (!roleId || !roleData) {
        res.status(400).json({
          success: false,
          message: 'Role ID and role data are required'
        });
        return;
      }

      const assignedRole = await roleService.assignRole(
        req.user!.id,
        contactId,
        roleId,
        BigInt(roleData),
        accountId
      );

      res.status(201).json({
        success: true,
        data: {
          assignedRole: {
            id: assignedRole.id.toString(),
            contactId: assignedRole.contactId.toString(),
            roleId: assignedRole.roleId,
            roleData: assignedRole.roleData.toString(),
            accountId: assignedRole.accountId.toString()
          }
        }
      });
    } catch (error) {
      console.error('Error assigning role:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * DELETE /api/accounts/:accountId/users/:contactId/roles/:roleId
 * Remove role from user in account (Account Admin or Administrator)
 */
router.delete('/:accountId/users/:contactId/roles/:roleId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.roles.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const contactId = BigInt(req.params.contactId);
      const roleId = req.params.roleId;
      const { roleData } = req.body;

      if (!roleData) {
        res.status(400).json({
          success: false,
          message: 'Role data is required'
        });
        return;
      }

      await roleService.removeRole(
        req.user!.id,
        contactId,
        roleId,
        BigInt(roleData),
        accountId
      );

      res.json({
        success: true,
        message: 'Role removed successfully'
      });
    } catch (error) {
      console.error('Error removing role:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

export default router; 