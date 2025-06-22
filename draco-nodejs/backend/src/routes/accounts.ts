// Protected Accounts Routes for Draco Sports Manager
// Demonstrates route protection with role-based access control

import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { RouteProtection } from '../middleware/routeProtection';
import { RoleService } from '../services/roleService';
import { PrismaClient } from '@prisma/client';
import { isEmail } from 'validator';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();
const roleService = new RoleService(prisma);
const routeProtection = new RouteProtection(roleService, prisma);

/**
 * GET /api/accounts/search
 * Public search for accounts (no authentication required)
 */
router.get('/search',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query; // search query
      
      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
        return;
      }

      const searchTerm = q.trim();
      
      // Search accounts by name, type, or affiliation
      const accounts = await prisma.accounts.findMany({
        where: {
          OR: [
            {
              name: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            },
            {
              accounttypes: {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              }
            }
          ]
        },
        select: {
          id: true,
          name: true,
          accounttypeid: true,
          firstyear: true,
          affiliationid: true,
          timezoneid: true,
          accounttypes: {
            select: {
              id: true,
              name: true
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
        },
        orderBy: {
          name: 'asc'
        },
        take: 20 // Limit results
      });

      // Get affiliations separately
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
            accountType: account.accounttypes?.name,
            firstYear: account.firstyear,
            affiliation: affiliationMap.get(account.affiliationid.toString())?.name,
            urls: account.accountsurl.map((url: any) => ({
              id: url.id.toString(),
              url: url.url
            }))
          }))
        }
      });
    } catch (error) {
      console.error('Error searching accounts:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/accounts/:accountId/public
 * Get public account information (no authentication required)
 */
router.get('/:accountId/public',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);

      const account = await prisma.accounts.findUnique({
        where: { id: accountId },
        select: {
          id: true,
          name: true,
          accounttypeid: true,
          firstyear: true,
          affiliationid: true,
          timezoneid: true,
          twitteraccountname: true,
          facebookfanpage: true,
          accounttypes: {
            select: {
              id: true,
              name: true
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

      // Get current season
      const currentSeasonRecord = await prisma.currentseason.findUnique({
        where: { accountid: accountId },
        select: {
          seasonid: true
        }
      });

      let currentSeason = null;
      if (currentSeasonRecord) {
        currentSeason = await prisma.season.findUnique({
          where: { id: currentSeasonRecord.seasonid },
          select: {
            id: true,
            name: true
          }
        });
      }

      // Get recent seasons
      const recentSeasons = await prisma.season.findMany({
        where: {
          accountid: accountId
        },
        select: {
          id: true,
          name: true
        },
        orderBy: {
          name: 'desc'
        },
        take: 5
      });

      // Mark current season
      const seasonsWithCurrentFlag = recentSeasons.map((season: any) => ({
        id: season.id.toString(),
        name: season.name,
        isCurrent: currentSeason ? season.id === currentSeason.id : false
      }));

      res.json({
        success: true,
        data: {
          account: {
            id: account.id.toString(),
            name: account.name,
            accountType: account.accounttypes?.name,
            accountTypeId: account.accounttypeid.toString(),
            firstYear: account.firstyear,
            affiliation: affiliation?.name,
            timezoneId: account.timezoneid,
            twitterAccountName: account.twitteraccountname,
            facebookFanPage: account.facebookfanpage,
            urls: account.accountsurl.map((url: any) => ({
              id: url.id.toString(),
              url: url.url
            }))
          },
          currentSeason: currentSeason ? {
            id: currentSeason.id.toString(),
            name: currentSeason.name
          } : null,
          seasons: seasonsWithCurrentFlag
        }
      });
    } catch (error) {
      console.error('Error getting public account:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

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
 * GET /api/accounts/my-accounts
 * Get accounts accessible to the current user (Account Admin or Administrator)
 */
router.get('/my-accounts',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      
      // Check if user is global administrator
      const isAdmin = await roleService.hasRole(userId, 'Administrator', { accountId: undefined });
      
      if (isAdmin.hasRole) {
        // Administrator can see all accounts
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

        // Get affiliations separately
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

        // Get contact information for owner users
        const ownerUserIds = [...new Set(accounts.map(acc => acc.owneruserid).filter(id => id !== null))];
        const contacts = await prisma.contacts.findMany({
          where: {
            userid: { in: ownerUserIds }
          },
          select: {
            userid: true,
            firstname: true,
            lastname: true,
            email: true
          }
        });

        const contactMap = new Map(contacts.map(contact => [contact.userid, contact]));

        res.json({
          success: true,
          data: {
            accounts: accounts.map((account: any) => {
              const contact = contactMap.get(account.owneruserid);
              return {
                id: account.id.toString(),
                name: account.name,
                accountTypeId: account.accounttypeid.toString(),
                accountType: account.accounttypes?.name,
                ownerUserId: account.owneruserid,
                ownerName: contact ? `${contact.firstname} ${contact.lastname}` : 'Unknown Owner',
                ownerEmail: contact?.email || '',
                firstYear: account.firstyear,
                affiliationId: account.affiliationid.toString(),
                affiliation: affiliationMap.get(account.affiliationid.toString())?.name,
                timezoneId: account.timezoneid,
                twitterAccountName: account.twitteraccountname,
                youtubeUserId: account.youtubeuserid,
                facebookFanPage: account.facebookfanpage,
                defaultVideo: account.defaultvideo,
                autoPlayVideo: account.autoplayvideo
              };
            })
          }
        });
      } else {
        // Account Admin can only see accounts they have access to
        const userRoles = await roleService.getUserRoles(userId);
        const accountAdminRoles = userRoles.contactRoles.filter((role: any) => 
          role.roleId === 'AccountAdmin' && role.accountId
        );
        
        if (accountAdminRoles.length === 0) {
          res.json({
            success: true,
            data: {
              accounts: []
            }
          });
          return;
        }

        const accountIds = accountAdminRoles.map((role: any) => role.accountId!);
        
        const accounts = await prisma.accounts.findMany({
          where: {
            id: { in: accountIds }
          },
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

        // Get affiliations separately
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

        // Get contact information for owner users
        const ownerUserIds = [...new Set(accounts.map(acc => acc.owneruserid).filter(id => id !== null))];
        const contacts = await prisma.contacts.findMany({
          where: {
            userid: { in: ownerUserIds }
          },
          select: {
            userid: true,
            firstname: true,
            lastname: true,
            email: true
          }
        });

        const contactMap = new Map(contacts.map(contact => [contact.userid, contact]));

        res.json({
          success: true,
          data: {
            accounts: accounts.map((account: any) => {
              const contact = contactMap.get(account.owneruserid);
              return {
                id: account.id.toString(),
                name: account.name,
                accountTypeId: account.accounttypeid.toString(),
                accountType: account.accounttypes?.name,
                ownerUserId: account.owneruserid,
                ownerName: contact ? `${contact.firstname} ${contact.lastname}` : 'Unknown Owner',
                ownerEmail: contact?.email || '',
                firstYear: account.firstyear,
                affiliationId: account.affiliationid.toString(),
                affiliation: affiliationMap.get(account.affiliationid.toString())?.name,
                timezoneId: account.timezoneid,
                twitterAccountName: account.twitteraccountname,
                youtubeUserId: account.youtubeuserid,
                facebookFanPage: account.facebookfanpage,
                defaultVideo: account.defaultvideo,
                autoPlayVideo: account.autoplayvideo
              };
            })
          }
        });
      }
    } catch (error) {
      console.error('Error getting my accounts:', error);
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

/**
 * GET /api/accounts/contacts/search
 * Search contacts by name for autocomplete
 */
router.get('/contacts/search',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query; // search query
      const limit = 10; // maximum results to return

      if (!q || typeof q !== 'string') {
        res.json({
          success: true,
          data: {
            contacts: []
          }
        });
        return;
      }

      const contacts = await prisma.contacts.findMany({
        where: {
          OR: [
            {
              firstname: {
                contains: q,
                mode: 'insensitive'
              }
            },
            {
              lastname: {
                contains: q,
                mode: 'insensitive'
              }
            },
            {
              email: {
                contains: q,
                mode: 'insensitive'
              }
            }
          ]
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
        ],
        take: limit
      });

      res.json({
        success: true,
        data: {
          contacts: contacts.map((contact: any) => ({
            id: contact.id.toString(),
            firstName: contact.firstname,
            lastName: contact.lastname,
            email: contact.email,
            userId: contact.userid,
            displayName: `${contact.firstname} ${contact.lastname}`,
            searchText: `${contact.firstname} ${contact.lastname} (${contact.email})`
          }))
        }
      });
    } catch (error) {
      console.error('Error searching contacts:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/accounts/contacts/:userId
 * Get contact information by user ID
 */
router.get('/contacts/:userId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const contact = await prisma.contacts.findFirst({
      where: { userid: userId },
      select: { userid: true, firstname: true, lastname: true, email: true }
    });
    if (!contact) {
      res.status(404).json({ success: false, message: 'Contact not found' });
      return;
    }
    res.json({
      success: true,
      data: {
        contact: {
          userId: contact.userid,
          displayName: `${contact.firstname} ${contact.lastname}`.trim(),
          searchText: `${contact.firstname} ${contact.lastname} (${contact.email})`.trim(),
          email: contact.email
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * PUT /api/accounts/:accountId/contacts/:contactId
 * Update contact information
 */
router.put('/:accountId/contacts/:contactId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const contactId = BigInt(req.params.contactId);
      const {
        firstname,
        lastname,
        middlename,
        email,
        phone1,
        phone2,
        phone3,
        streetaddress,
        city,
        state,
        zip,
        dateofbirth
      } = req.body;

      // Validate required fields
      if (!firstname || !lastname) {
        res.status(400).json({
          success: false,
          message: 'First name and last name are required'
        });
        return;
      }

      // Validate email format if provided
      if (email) {
        if (!isEmail(email)) {
          res.status(400).json({
            success: false,
            message: 'Please enter a valid email address'
          });
          return;
        }
      }

      // Verify the contact exists and belongs to this account
      const existingContact = await prisma.contacts.findFirst({
        where: {
          id: contactId,
          creatoraccountid: accountId
        }
      });

      if (!existingContact) {
        res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
        return;
      }

      // Update the contact
      const updatedContact = await prisma.contacts.update({
        where: { id: contactId },
        data: {
          firstname,
          lastname,
          middlename: middlename || '',
          email: email || null,
          phone1: phone1 || null,
          phone2: phone2 || null,
          phone3: phone3 || null,
          streetaddress: streetaddress || null,
          city: city || null,
          state: state || null,
          zip: zip || null,
          ...(dateofbirth ? { dateofbirth: new Date(dateofbirth) } : {})
        }
      });

      res.json({
        success: true,
        data: {
          message: `Contact "${updatedContact.firstname} ${updatedContact.lastname}" updated successfully`,
          contact: {
            id: updatedContact.id.toString(),
            firstname: updatedContact.firstname,
            lastname: updatedContact.lastname,
            middlename: updatedContact.middlename,
            email: updatedContact.email,
            phone1: updatedContact.phone1,
            phone2: updatedContact.phone2,
            phone3: updatedContact.phone3,
            streetaddress: updatedContact.streetaddress,
            city: updatedContact.city,
            state: updatedContact.state,
            zip: updatedContact.zip,
            dateofbirth: updatedContact.dateofbirth ? updatedContact.dateofbirth.toISOString() : null
          }
        }
      });
    } catch (error: any) {
      console.error('Error updating contact:', error);
      
      // Handle unique constraint violation (duplicate name)
      if (error.code === 'P2002' && 
          error.meta?.target && 
          Array.isArray(error.meta.target) &&
          error.meta.target.includes('lastname') &&
          error.meta.target.includes('firstname') &&
          error.meta.target.includes('middlename') &&
          error.meta.target.includes('creatoraccountid')) {
        res.status(400).json({
          success: false,
          message: 'A contact with this name already exists in this account'
        });
        return;
      }
      
      // Handle other Prisma validation errors
      if (error.code === 'P2000' || error.code === 'P2001' || error.code === 'P2003') {
        res.status(400).json({
          success: false,
          message: 'Invalid data provided for contact update'
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/accounts/:accountId/contacts
 * Create a new contact in an account
 */
router.post('/:accountId/contacts',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const {
        firstname,
        lastname,
        middlename,
        email,
        phone1,
        phone2,
        phone3,
        streetaddress,
        city,
        state,
        zip,
        dateofbirth
      } = req.body;

      // Validate required fields
      if (!firstname || !lastname) {
        res.status(400).json({
          success: false,
          message: 'First name and last name are required'
        });
        return;
      }

      // Validate email format if provided
      if (email) {
        if (!isEmail(email)) {
          res.status(400).json({
            success: false,
            message: 'Please enter a valid email address'
          });
          return;
        }
      }

      // Create the contact
      const newContact = await prisma.contacts.create({
        data: {
          firstname,
          lastname,
          middlename: middlename || '',
          email: email || null,
          phone1: phone1 || null,
          phone2: phone2 || null,
          phone3: phone3 || null,
          streetaddress: streetaddress || null,
          city: city || null,
          state: state || null,
          zip: zip || null,
          creatoraccountid: accountId,
          dateofbirth: dateofbirth ? new Date(dateofbirth) : new Date('1900-01-01')
        }
      });

      res.status(201).json({
        success: true,
        data: {
          message: `Contact "${newContact.firstname} ${newContact.lastname}" created successfully`,
          contact: {
            id: newContact.id.toString(),
            firstname: newContact.firstname,
            lastname: newContact.lastname,
            middlename: newContact.middlename,
            email: newContact.email,
            phone1: newContact.phone1,
            phone2: newContact.phone2,
            phone3: newContact.phone3,
            streetaddress: newContact.streetaddress,
            city: newContact.city,
            state: newContact.state,
            zip: newContact.zip,
            dateofbirth: newContact.dateofbirth ? newContact.dateofbirth.toISOString() : null
          }
        }
      });
    } catch (error: any) {
      console.error('Error creating contact:', error);
      
      // Handle unique constraint violation (duplicate name)
      if (error.code === 'P2002' && 
          error.meta?.target && 
          Array.isArray(error.meta.target) &&
          error.meta.target.includes('lastname') &&
          error.meta.target.includes('firstname') &&
          error.meta.target.includes('middlename') &&
          error.meta.target.includes('creatoraccountid')) {
        res.status(400).json({
          success: false,
          message: 'A contact with this name already exists in this account'
        });
        return;
      }
      
      // Handle other Prisma validation errors
      if (error.code === 'P2000' || error.code === 'P2001' || error.code === 'P2003') {
        res.status(400).json({
          success: false,
          message: 'Invalid data provided for contact creation'
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/accounts/:accountId/roster
 * Create a new roster entry (player) in an account
 */
router.post('/:accountId/roster',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const { contactId, submittedDriversLicense, firstYear } = req.body;

      if (!contactId) {
        res.status(400).json({
          success: false,
          message: 'ContactId is required'
        });
        return;
      }

      // Verify the contact exists and belongs to this account
      const contact = await prisma.contacts.findFirst({
        where: {
          id: BigInt(contactId),
          creatoraccountid: accountId
        },
        select: {
          firstname: true,
          lastname: true
        }
      });

      if (!contact) {
        res.status(404).json({ success: false, message: 'Contact not found' });
        return;
      }

      // Check if a roster entry already exists for this contact
      const existingRoster = await prisma.roster.findFirst({
        where: {
          contactid: BigInt(contactId)
        }
      });

      if (existingRoster) {
        res.status(409).json({
          success: false,
          message: 'A roster entry already exists for this contact'
        });
        return;
      }

      // Create the roster entry
      const newRoster = await prisma.roster.create({
        data: {
          contactid: BigInt(contactId),
          submitteddriverslicense: submittedDriversLicense || false,
          firstyear: firstYear || 0
        },
        include: {
          contacts: {
            select: {
              firstname: true,
              lastname: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: {
          message: `Roster entry created for "${newRoster.contacts.firstname} ${newRoster.contacts.lastname}"`,
          player: {
            id: newRoster.id.toString(),
            contactId: newRoster.contactid.toString(),
            submittedDriversLicense: newRoster.submitteddriverslicense,
            firstYear: newRoster.firstyear,
            contact: newRoster.contacts
          }
        }
      });
    } catch (error) {
      console.error('Error creating roster entry:', error);
      next(error);
    }
  }
);

export default router; 