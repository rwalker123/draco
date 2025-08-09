// Core Account Routes for Draco Sports Manager
// Handles basic account operations: search, retrieval, creation, updates, deletion

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../lib/serviceFactory.js';
import { Prisma } from '@prisma/client';
// Import removed - these utilities not used in core operations
import { RoleType } from '../types/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError, NotFoundError } from '../utils/customErrors.js';
import { extractAccountParams } from '../utils/paramExtraction.js';
import { getAccountLogoUrl } from '../config/logo.js';
import { ROLE_IDS } from '../config/roles.js';
import prisma from '../lib/prisma.js';
import {
  AccountSearchResult,
  PublicAccountResponse,
  PublicSeasonResponse,
  AccountListResponse,
  AccountListContact,
  AccountAffiliation,
  PublicSeason,
} from '../interfaces/accountInterfaces.js';

const router = Router({ mergeParams: true });
export const roleService = ServiceFactory.getRoleService();
const routeProtection = ServiceFactory.getRouteProtection();

/**
 * @swagger
 * /api/accounts/search:
 *   get:
 *     summary: Search for accounts
 *     description: Public search for accounts by name, type, or affiliation (no authentication required)
 *     tags: [Accounts]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query for account name, type, or affiliation
 *         example: "baseball"
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "123"
 *                           name:
 *                             type: string
 *                             example: "Local Baseball League"
 *                           accountType:
 *                             type: string
 *                             example: "Baseball League"
 *                           firstYear:
 *                             type: integer
 *                             example: 2020
 *                           affiliation:
 *                             type: string
 *                             example: "National Baseball Association"
 *                           urls:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   example: "456"
 *                                 url:
 *                                   type: string
 *                                   example: "www.localbaseball.com"
 *       400:
 *         description: Missing search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/search',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { q } = req.query; // search query

    if (!q || typeof q !== 'string') {
      throw new ValidationError('Search query is required');
    }

    const searchTerm = q.trim();

    // Define the findMany args as a constant for type inference
    const accountSearchArgs = {
      where: {
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            accounttypes: {
              name: {
                contains: searchTerm,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        ],
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
            name: true,
          },
        },
        accountsurl: {
          select: {
            id: true,
            url: true,
          },
          orderBy: {
            id: Prisma.SortOrder.asc,
          },
        },
      },
      orderBy: {
        name: Prisma.SortOrder.asc,
      },
      take: 20, // Limit results
    };

    type AccountWithTypeAndUrls = Prisma.accountsGetPayload<typeof accountSearchArgs>;
    type AccountUrl = AccountWithTypeAndUrls['accountsurl'][number];

    // Search accounts by name, type, or affiliation
    const accounts: AccountWithTypeAndUrls[] = await prisma.accounts.findMany(accountSearchArgs);

    // Get affiliations separately
    const affiliationIds = [...new Set(accounts.map((acc) => acc.affiliationid))];
    const affiliations: AccountAffiliation[] = await prisma.affiliations.findMany({
      where: {
        id: { in: affiliationIds },
      },
      select: {
        id: true,
        name: true,
        url: true,
      },
    });

    const affiliationMap = new Map<string, AccountAffiliation>(
      affiliations.map((aff) => [aff.id.toString(), aff]),
    );

    res.json({
      success: true,
      data: {
        accounts: accounts.map(
          (account: AccountWithTypeAndUrls): AccountSearchResult => ({
            id: account.id.toString(),
            name: account.name,
            accountType: account.accounttypes?.name,
            firstYear: account.firstyear,
            affiliation: account.affiliationid
              ? affiliationMap.get(account.affiliationid.toString())?.name
              : undefined,
            urls: account.accountsurl.map((url: AccountUrl) => ({
              id: url.id.toString(),
              url: url.url,
            })),
          }),
        ),
      },
    });
  }),
);

/**
 * @swagger
 * /api/accounts/by-domain:
 *   get:
 *     summary: Get account by domain
 *     description: Get account information by domain (no authentication required, used by domain routing middleware)
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: Account found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     account:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "123"
 *                         name:
 *                           type: string
 *                           example: "Local Baseball League"
 *                         accountType:
 *                           type: string
 *                           example: "Baseball League"
 *                         accountTypeId:
 *                           type: string
 *                           example: "1"
 *                         firstYear:
 *                           type: integer
 *                           example: 2020
 *                         timezoneId:
 *                           type: integer
 *                           example: 1
 *                         urls:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "456"
 *                               url:
 *                                 type: string
 *                                 example: "www.localbaseball.com"
 *       400:
 *         description: Missing host header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No account found for this domain
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/by-domain',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Use X-Forwarded-Host if present (for local dev proxy), else Host
    const host = req.get('x-forwarded-host') || req.get('host');

    if (!host) {
      throw new ValidationError('Host header is required');
    }

    // Compose protocol + host for matching (check both http and https)
    const hostLower = host.toLowerCase();
    const urlVariants = [
      `http://${hostLower}`,
      `https://${hostLower}`,
      `http://www.${hostLower}`,
      `https://www.${hostLower}`,
      `http://${hostLower.replace('www.', '')}`,
      `https://${hostLower.replace('www.', '')}`,
    ];

    // Look up the host in the accountsurl table with more precise matching
    const accountUrl = await prisma.accountsurl.findFirst({
      where: {
        url: { in: urlVariants },
      },
      include: {
        accounts: {
          include: {
            accounttypes: true,
          },
        },
      },
    });

    if (!accountUrl) {
      throw new NotFoundError('No account found for this domain');
    }

    const account = accountUrl.accounts;

    res.json({
      success: true,
      data: {
        account: {
          id: account.id.toString(),
          name: account.name,
          accountType: account.accounttypes?.name,
          accountTypeId: account.accounttypeid.toString(),
          firstYear: account.firstyear,
          timezoneId: account.timezoneid,
          urls: [
            {
              id: accountUrl.id.toString(),
              url: accountUrl.url,
            },
          ],
        },
      },
    });
  }),
);

/**
 * GET /api/accounts/my-accounts
 * Get accounts accessible to the current user (Account Admin or Administrator)
 */
router.get(
  '/my-accounts',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;

    // Check if user is global administrator
    const isAdmin = await roleService.hasRole(userId, ROLE_IDS[RoleType.ADMINISTRATOR], {
      accountId: undefined,
    });

    const accountSelect: Prisma.accountsSelect = {
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
          name: true,
        },
      },
    };
    const accountListArgs = {
      select: accountSelect,
      orderBy: {
        name: Prisma.SortOrder.asc,
      },
    } as const;
    type AccountList = Prisma.accountsGetPayload<typeof accountListArgs>;

    let accounts: AccountList[] = [];
    if (isAdmin.hasRole) {
      // Administrator can see all accounts
      accounts = await prisma.accounts.findMany(accountListArgs);
    } else {
      // Account Admin can only see accounts they have access to
      const userRoles = await roleService.getUserRoles(userId);
      const accountAdminRoles = userRoles.contactRoles.filter(
        (role) => role.roleId === 'AccountAdmin' && role.accountId,
      );

      if (accountAdminRoles.length === 0) {
        res.json({
          success: true,
          data: {
            accounts: [],
          },
        });
        return;
      }

      const accountIds = accountAdminRoles.map((role) => role.accountId);

      accounts = await prisma.accounts.findMany({
        where: {
          id: { in: accountIds },
        },
        select: accountSelect,
        orderBy: {
          name: 'asc',
        },
      });
    }

    // Common code for both branches
    const affiliationIds = [...new Set(accounts.map((acc) => acc.affiliationid))];
    const affiliations = await prisma.affiliations.findMany({
      where: {
        id: { in: affiliationIds },
      },
      select: {
        id: true,
        name: true,
        url: true,
      },
    });

    const affiliationMap = new Map(affiliations.map((aff) => [aff.id.toString(), aff]));

    // Get contact information for owner users
    const ownerUserIds = [
      ...new Set(accounts.map((acc) => acc.owneruserid).filter((id) => id !== null)),
    ];
    const contacts: AccountListContact[] = (
      await prisma.contacts.findMany({
        where: {
          userid: { in: ownerUserIds },
        },
        select: {
          userid: true,
          firstname: true,
          lastname: true,
          email: true,
        },
      })
    ).map((contact) => ({
      userid: contact.userid ?? '',
      firstname: contact.firstname,
      lastname: contact.lastname,
      email: contact.email,
    }));

    const contactMap = new Map<string, AccountListContact>(
      contacts.map((contact) => [contact.userid, contact]),
    );

    res.json({
      success: true,
      data: {
        accounts: accounts.map((account: AccountList): AccountListResponse => {
          const contact = account.owneruserid ? contactMap.get(account.owneruserid) : undefined;
          return {
            id: account.id.toString(),
            name: account.name,
            accountTypeId: account.accounttypeid.toString(),
            accountType: account.accounttypes?.name,
            ownerUserId: account.owneruserid ? account.owneruserid.toString() : null,
            ownerName: contact ? `${contact.firstname} ${contact.lastname}` : 'Unknown Owner',
            ownerEmail: contact?.email ?? '',
            firstYear: account.firstyear,
            affiliationId: account.affiliationid.toString(),
            affiliation: affiliationMap.get(account.affiliationid.toString())?.name,
            timezoneId: account.timezoneid ?? '',
            twitterAccountName: account.twitteraccountname ?? '',
            youtubeUserId: account.youtubeuserid ?? null,
            facebookFanPage: account.facebookfanpage ?? null,
            defaultVideo: account.defaultvideo ?? '',
            autoPlayVideo: account.autoplayvideo,
            accountLogoUrl: getAccountLogoUrl(account.id.toString()),
          };
        }),
      },
    });
  }),
);

/**
 * GET /api/accounts/:accountId
 * Get public account information (no authentication required)
 */
router.get(
  '/:accountId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { includeCurrentSeason } = req.query;

    const accountSelectArgs = {
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
            name: true,
          },
        },
        accountsurl: {
          select: {
            id: true,
            url: true,
          },
          orderBy: {
            id: Prisma.SortOrder.asc,
          },
        },
      },
    } as const;

    type PublicAccount = Prisma.accountsGetPayload<typeof accountSelectArgs>;
    type PublicAccountUrl = PublicAccount['accountsurl'][number];

    const account: PublicAccount | null = await prisma.accounts.findUnique(accountSelectArgs);

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    // Get affiliation separately
    const affiliation: AccountAffiliation | null = await prisma.affiliations.findUnique({
      where: { id: account.affiliationid },
      select: {
        id: true,
        name: true,
        url: true,
      },
    });

    // Get current season
    const currentSeasonRecord = await prisma.currentseason.findUnique({
      where: {
        accountid: accountId,
      },
    });

    if (!currentSeasonRecord) {
      res.json({
        success: true,
        data: {
          account: {
            id: account.id.toString(),
            name: account.name,
            accountType: account.accounttypes?.name,
            accountTypeId: account.accounttypeid.toString(),
            firstYear: account.firstyear,
            affiliation: affiliation ? { name: affiliation.name, url: affiliation.url } : null,
            timezoneId: account.timezoneid ?? '',
            twitterAccountName: account.twitteraccountname ?? '',
            facebookFanPage: account.facebookfanpage ?? '',
            urls: account.accountsurl.map((url: PublicAccountUrl) => ({
              id: url.id.toString(),
              url: url.url,
            })),
            accountLogoUrl: getAccountLogoUrl(account.id.toString()),
          },
          currentSeason: null,
          seasons: [],
        },
      });
      return;
    }

    const currentSeason: PublicSeason | null = await prisma.season.findUnique({
      where: {
        id: currentSeasonRecord.seasonid,
      },
      select: {
        id: true,
        name: true,
      },
    });

    let seasonsWithCurrentFlag: PublicSeasonResponse[] = [];
    if (includeCurrentSeason === 'true' && currentSeason) {
      // Only return the current season
      seasonsWithCurrentFlag = [
        {
          id: currentSeason.id.toString(),
          name: currentSeason.name,
          isCurrent: true,
        },
      ];
    }

    res.json({
      success: true,
      data: {
        account: {
          id: account.id.toString(),
          name: account.name,
          accountType: account.accounttypes?.name,
          accountTypeId: account.accounttypeid.toString(),
          firstYear: account.firstyear,
          affiliation: affiliation ? { name: affiliation.name, url: affiliation.url } : null,
          timezoneId: account.timezoneid ?? '',
          twitterAccountName: account.twitteraccountname ?? '',
          facebookFanPage: account.facebookfanpage ?? '',
          urls: account.accountsurl.map((url: PublicAccountUrl) => ({
            id: url.id.toString(),
            url: url.url,
          })),
          accountLogoUrl: getAccountLogoUrl(account.id.toString()),
        } satisfies PublicAccountResponse,
        currentSeason: currentSeason
          ? {
              id: currentSeason.id.toString(),
              name: currentSeason.name,
            }
          : null,
        seasons: seasonsWithCurrentFlag,
      },
    });
  }),
);

/**
 * POST /api/accounts
 * Create new account (Administrator only)
 */
router.post(
  '/',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      name,
      accountTypeId,
      ownerUserId,
      affiliationId = 1,
      timezoneId = 'UTC',
      firstYear,
      urls = [],
    } = req.body;

    if (!name || !accountTypeId || !ownerUserId) {
      throw new ValidationError('Name, account type ID, and owner user ID are required');
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
        autoplayvideo: false,
      },
    });

    // Create URLs if provided
    if (urls.length > 0) {
      for (const url of urls) {
        await prisma.accountsurl.create({
          data: {
            accountid: account.id,
            url,
          },
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
          timezoneId: account.timezoneid,
        },
      },
    });
  }),
);

/**
 * PUT /api/accounts/:accountId
 * Update account (Account Admin or Administrator)
 */
router.put(
  '/:accountId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const {
      name,
      accountTypeId,
      affiliationId,
      timezoneId,
      firstYear,
      youtubeUserId,
      facebookFanPage,
      defaultVideo,
      autoPlayVideo,
    } = req.body;

    if (
      !name &&
      !accountTypeId &&
      !affiliationId &&
      !timezoneId &&
      firstYear === undefined &&
      !youtubeUserId &&
      !facebookFanPage &&
      defaultVideo === undefined &&
      autoPlayVideo === undefined
    ) {
      throw new ValidationError('At least one field to update is required');
    }

    const updateData: Partial<Prisma.accountsUpdateInput> = {};
    if (name) updateData.name = name;
    if (accountTypeId) updateData.accounttypes = { connect: { id: BigInt(accountTypeId) } };
    if (affiliationId) updateData.affiliationid = BigInt(affiliationId);
    if (timezoneId) updateData.timezoneid = timezoneId;
    if (firstYear !== undefined) updateData.firstyear = firstYear;
    if (youtubeUserId !== undefined) updateData.youtubeuserid = youtubeUserId;
    if (facebookFanPage !== undefined) updateData.facebookfanpage = facebookFanPage;
    if (defaultVideo !== undefined) updateData.defaultvideo = defaultVideo;
    if (autoPlayVideo !== undefined) updateData.autoplayvideo = autoPlayVideo;

    const accountSelect = {
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
      autoplayvideo: true,
    } as const;
    const account = await prisma.accounts.update({
      where: { id: accountId },
      data: updateData,
      select: accountSelect,
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
          autoPlayVideo: account.autoplayvideo,
        },
      },
    });
  }),
);

/**
 * DELETE /api/accounts/:accountId
 * Delete account (Administrator only)
 */
router.delete(
  '/:accountId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    // Check if account exists
    const existingAccount = await prisma.accounts.findUnique({
      where: { id: accountId },
    });

    if (!existingAccount) {
      throw new NotFoundError('Account not found');
    }

    // Delete account (this will cascade to related records)
    await prisma.accounts.delete({
      where: { id: accountId },
    });

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  }),
);

// Lightweight endpoint to get only the account name
router.get(
  '/:accountId/name',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const account = await prisma.accounts.findUnique({
      where: { id: accountId },
      select: { id: true, name: true },
    });
    if (!account) {
      throw new NotFoundError('Account not found');
    }
    res.json({ success: true, data: { id: accountId.toString(), name: account.name } });
  }),
);

// Lightweight endpoint to get account name and logo URL
router.get(
  '/:accountId/header',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const account = await prisma.accounts.findUnique({
      where: { id: accountId },
      select: { name: true },
    });
    if (!account) {
      throw new NotFoundError('Account not found');
    }
    res.json({
      success: true,
      data: {
        name: account.name,
        accountLogoUrl: getAccountLogoUrl(accountId.toString()),
      },
    });
  }),
);

export default router;
