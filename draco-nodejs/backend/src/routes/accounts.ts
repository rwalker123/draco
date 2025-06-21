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
          owneruserid: true,
          firstyear: true,
          affiliationid: true,
          timezoneid: true,
          twitteraccountname: true,
          youtubeuserid: true,
          facebookfanpage: true,
          defaultvideo: true,
          autoplayvideo: true,
          accounttypes: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Get affiliations separately since there's no direct relationship
      const affiliationIds = [...new Set(accounts.map(acc => acc.affiliationid))];
      const affiliations = await prisma.affiliations.findMany({
        where: {
          id: { in: affiliationIds }
        },
        select: {
          id: true,
          name: true,
          url: true
        }
      });

      const affiliationMap = new Map(affiliations.map(aff => [aff.id.toString(), aff]));

      res.json({
        success: true,
        data: {
          accounts: accounts.map((account: any) => ({
            id: account.id.toString(),
            name: account.name,
            accountTypeId: account.accounttypeid.toString(),
            accountType: account.accounttypes?.name,
            ownerUserId: account.owneruserid,
            firstYear: account.firstyear,
            affiliationId: account.affiliationid.toString(),
            affiliation: affiliationMap.get(account.affiliationid.toString())?.name,
            timezoneId: account.timezoneid,
            twitterAccountName: account.twitteraccountname,
            youtubeUserId: account.youtubeuserid,
            facebookFanPage: account.facebookfanpage,
            defaultVideo: account.defaultvideo,
            autoPlayVideo: account.autoplayvideo
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
 * GET /api/accounts/types
 * Get all account types
 */
router.get('/types',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountTypes = await prisma.accounttypes.findMany({
        select: {
          id: true,
          name: true,
          filepath: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      res.json({
        success: true,
        data: {
          accountTypes: accountTypes.map((type: any) => ({
            id: type.id.toString(),
            name: type.name,
            filePath: type.filepath
          }))
        }
      });
    } catch (error) {
      console.error('Error getting account types:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/accounts/affiliations
 * Get all affiliations
 */
router.get('/affiliations',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const affiliations = await prisma.affiliations.findMany({
        select: {
          id: true,
          name: true,
          url: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      res.json({
        success: true,
        data: {
          affiliations: affiliations.map((affiliation: any) => ({
            id: affiliation.id.toString(),
            name: affiliation.name,
            url: affiliation.url
          }))
        }
      });
    } catch (error) {
      console.error('Error getting affiliations:', error);
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
          owneruserid: true,
          firstyear: true,
          affiliationid: true,
          timezoneid: true,
          twitteraccountname: true,
          twitteroauthtoken: true,
          twitteroauthsecretkey: true,
          youtubeuserid: true,
          facebookfanpage: true,
          twitterwidgetscript: true,
          defaultvideo: true,
          autoplayvideo: true,
          accounttypes: {
            select: {
              id: true,
              name: true,
              filepath: true
            }
          },
          accountsurl: {
            select: {
              id: true,
              url: true
            },
            orderBy: {
              id: 'asc'
            }
          }
        }
      });

      if (!account) {
        res.status(404).json({
          success: false,
          message: 'Account not found'
        });
        return;
      }

      // Get affiliation separately
      const affiliation = await prisma.affiliations.findUnique({
        where: { id: account.affiliationid },
        select: {
          id: true,
          name: true,
          url: true
        }
      });

      res.json({
        success: true,
        data: {
          account: {
            id: account.id.toString(),
            name: account.name,
            accountTypeId: account.accounttypeid.toString(),
            accountType: account.accounttypes?.name,
            ownerUserId: account.owneruserid,
            firstYear: account.firstyear,
            affiliationId: account.affiliationid.toString(),
            affiliation: affiliation?.name,
            timezoneId: account.timezoneid,
            twitterAccountName: account.twitteraccountname,
            twitterOauthToken: account.twitteroauthtoken,
            twitterOauthSecretKey: account.twitteroauthsecretkey,
            youtubeUserId: account.youtubeuserid,
            facebookFanPage: account.facebookfanpage,
            twitterWidgetScript: account.twitterwidgetscript,
            defaultVideo: account.defaultvideo,
            autoPlayVideo: account.autoplayvideo,
            urls: account.accountsurl.map((url: any) => ({
              id: url.id.toString(),
              url: url.url
            }))
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
      const { 
        name, 
        accountTypeId, 
        ownerUserId, 
        affiliationId = 1,
        timezoneId = 'UTC',
        firstYear,
        urls = []
      } = req.body;

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
          firstyear: firstYear || new Date().getFullYear(),
          affiliationid: BigInt(affiliationId),
          timezoneid: timezoneId,
          twitteraccountname: '',
          twitteroauthtoken: '',
          twitteroauthsecretkey: '',
          defaultvideo: '',
          autoplayvideo: false
        }
      });

      // Create URLs if provided
      if (urls.length > 0) {
        for (const url of urls) {
          await prisma.accountsurl.create({
            data: {
              accountid: account.id,
              url
            }
          });
        }
      }

      res.status(201).json({
        success: true,
        data: {
          account: {
            id: account.id.toString(),
            name: account.name,
            accountTypeId: account.accounttypeid.toString(),
            ownerUserId: account.owneruserid,
            firstYear: account.firstyear,
            affiliationId: account.affiliationid.toString(),
            timezoneId: account.timezoneid
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
      const { 
        name, 
        accountTypeId, 
        affiliationId, 
        timezoneId, 
        firstYear,
        youtubeUserId,
        facebookFanPage,
        defaultVideo,
        autoPlayVideo
      } = req.body;

      if (!name && !accountTypeId && !affiliationId && !timezoneId && 
          firstYear === undefined && !youtubeUserId && !facebookFanPage && 
          defaultVideo === undefined && autoPlayVideo === undefined) {
        res.status(400).json({
          success: false,
          message: 'At least one field to update is required'
        });
        return;
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (accountTypeId) updateData.accounttypeid = BigInt(accountTypeId);
      if (affiliationId) updateData.affiliationid = BigInt(affiliationId);
      if (timezoneId) updateData.timezoneid = timezoneId;
      if (firstYear !== undefined) updateData.firstyear = firstYear;
      if (youtubeUserId !== undefined) updateData.youtubeuserid = youtubeUserId;
      if (facebookFanPage !== undefined) updateData.facebookfanpage = facebookFanPage;
      if (defaultVideo !== undefined) updateData.defaultvideo = defaultVideo;
      if (autoPlayVideo !== undefined) updateData.autoplayvideo = autoPlayVideo;

      const account = await prisma.accounts.update({
        where: { id: accountId },
        data: updateData,
        select: {
          id: true,
          name: true,
          accounttypeid: true,
          owneruserid: true,
          firstyear: true,
          affiliationid: true,
          timezoneid: true,
          youtubeuserid: true,
          facebookfanpage: true,
          defaultvideo: true,
          autoplayvideo: true
        }
      });

      res.json({
        success: true,
        data: {
          account: {
            id: account.id.toString(),
            name: account.name,
            accountTypeId: account.accounttypeid.toString(),
            ownerUserId: account.owneruserid,
            firstYear: account.firstyear,
            affiliationId: account.affiliationid.toString(),
            timezoneId: account.timezoneid,
            youtubeUserId: account.youtubeuserid,
            facebookFanPage: account.facebookfanpage,
            defaultVideo: account.defaultvideo,
            autoPlayVideo: account.autoplayvideo
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
 * PUT /api/accounts/:accountId/twitter
 * Update Twitter settings (Account Admin or Administrator)
 */
router.put('/:accountId/twitter',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const { 
        twitterAccountName, 
        twitterOauthToken, 
        twitterOauthSecretKey,
        twitterWidgetScript 
      } = req.body;

      if (!twitterAccountName && !twitterOauthToken && !twitterOauthSecretKey && !twitterWidgetScript) {
        res.status(400).json({
          success: false,
          message: 'At least one Twitter field to update is required'
        });
        return;
      }

      const updateData: any = {};
      if (twitterAccountName !== undefined) updateData.twitteraccountname = twitterAccountName;
      if (twitterOauthToken !== undefined) updateData.twitteroauthtoken = twitterOauthToken;
      if (twitterOauthSecretKey !== undefined) updateData.twitteroauthsecretkey = twitterOauthSecretKey;
      if (twitterWidgetScript !== undefined) updateData.twitterwidgetscript = twitterWidgetScript;

      const account = await prisma.accounts.update({
        where: { id: accountId },
        data: updateData,
        select: {
          id: true,
          name: true,
          twitteraccountname: true,
          twitteroauthtoken: true,
          twitteroauthsecretkey: true,
          twitterwidgetscript: true
        }
      });

      res.json({
        success: true,
        data: {
          account: {
            id: account.id.toString(),
            name: account.name,
            twitterAccountName: account.twitteraccountname,
            twitterOauthToken: account.twitteroauthtoken,
            twitterOauthSecretKey: account.twitteroauthsecretkey,
            twitterWidgetScript: account.twitterwidgetscript
          }
        }
      });
    } catch (error) {
      console.error('Error updating Twitter settings:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/accounts/:accountId/urls
 * Add URL to account (Account Admin or Administrator)
 */
router.post('/:accountId/urls',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const { url } = req.body;

      if (!url) {
        res.status(400).json({
          success: false,
          message: 'URL is required'
        });
        return;
      }

      const accountUrl = await prisma.accountsurl.create({
        data: {
          accountid: accountId,
          url
        },
        select: {
          id: true,
          url: true
        }
      });

      res.status(201).json({
        success: true,
        data: {
          url: {
            id: accountUrl.id.toString(),
            url: accountUrl.url
          }
        }
      });
    } catch (error) {
      console.error('Error adding URL:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * DELETE /api/accounts/:accountId/urls/:urlId
 * Remove URL from account (Account Admin or Administrator)
 */
router.delete('/:accountId/urls/:urlId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const urlId = BigInt(req.params.urlId);

      // Verify the URL belongs to the account
      const existingUrl = await prisma.accountsurl.findFirst({
        where: {
          id: urlId,
          accountid: accountId
        }
      });

      if (!existingUrl) {
        res.status(404).json({
          success: false,
          message: 'URL not found or does not belong to this account'
        });
        return;
      }

      await prisma.accountsurl.delete({
        where: { id: urlId }
      });

      res.json({
        success: true,
        message: 'URL removed successfully'
      });
    } catch (error) {
      console.error('Error removing URL:', error);
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