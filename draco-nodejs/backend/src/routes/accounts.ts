// Protected Accounts Routes for Draco Sports Manager
// Demonstrates route protection with role-based access control

import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { RouteProtection } from '../middleware/routeProtection';
import { RoleService } from '../services/roleService';
import { Prisma } from '@prisma/client';
import { isEmail } from 'validator';
import { isValidAccountUrl, normalizeUrl } from '../utils/validation';
import { ContactRole } from '../types/roles';
import { asyncHandler } from '../utils/asyncHandler';
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  ConflictError,
} from '../utils/customErrors';
import {
  extractAccountParams,
  extractContactParams,
  extractBigIntParams,
} from '../utils/paramExtraction';
import * as multer from 'multer';
import { validateLogoFile, getAccountLogoUrl } from '../config/logo';
import { createStorageService } from '../services/storageService';
import { getLogoUrl } from '../config/logo';
import prisma from '../lib/prisma';

const router = Router({ mergeParams: true });
export const roleService = new RoleService(prisma);
const routeProtection = new RouteProtection(roleService, prisma);
const storageService = createStorageService();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

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
    type Affiliation = { id: bigint; name: string; url: string };

    interface AccountSearchResult {
      id: string;
      name: string;
      accountType?: string;
      firstYear: number | null;
      affiliation?: string;
      urls: { id: string; url: string }[];
    }

    // Search accounts by name, type, or affiliation
    const accounts: AccountWithTypeAndUrls[] = await prisma.accounts.findMany(accountSearchArgs);

    // Get affiliations separately
    const affiliationIds = [...new Set(accounts.map((acc) => acc.affiliationid))];
    const affiliations: Affiliation[] = await prisma.affiliations.findMany({
      where: {
        id: { in: affiliationIds },
      },
      select: {
        id: true,
        name: true,
        url: true,
      },
    });

    const affiliationMap = new Map<string, Affiliation>(
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
    const isAdmin = await roleService.hasRole(userId, 'Administrator', {
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
        (role: ContactRole) => role.roleId === 'AccountAdmin' && role.accountId,
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

      const accountIds = accountAdminRoles.map((role: ContactRole) => role.accountId);

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
 * GET /api/accounts/types
 * Get all account types
 */
router.get(
  '/types',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const accountTypeSelect = {
      id: true,
      name: true,
      filepath: true,
    } as const;
    const accountTypes = await prisma.accounttypes.findMany({
      select: accountTypeSelect,
      orderBy: {
        name: 'asc',
      },
    });
    type AccountType = Prisma.accounttypesGetPayload<{ select: typeof accountTypeSelect }>;
    res.json({
      success: true,
      data: {
        accountTypes: accountTypes.map((type: AccountType) => ({
          id: type.id.toString(),
          name: type.name,
          filePath: type.filepath,
        })),
      },
    });
  }),
);

/**
 * GET /api/accounts/:accountId/public
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
    type PublicAffiliation = { id: bigint; name: string; url: string };
    type PublicSeason = { id: bigint; name: string };

    interface PublicAccountResponse {
      id: string;
      name: string;
      accountType?: string;
      accountTypeId: string;
      firstYear: number | null;
      affiliation?: { name: string; url: string } | null;
      timezoneId: string;
      twitterAccountName: string;
      facebookFanPage: string;
      urls: { id: string; url: string }[];
      accountLogoUrl: string;
    }
    interface PublicSeasonResponse {
      id: string;
      name: string;
      isCurrent: boolean;
    }

    const account: PublicAccount | null = await prisma.accounts.findUnique(accountSelectArgs);

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    // Get affiliation separately
    const affiliation: PublicAffiliation | null = await prisma.affiliations.findUnique({
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
 * GET /api/accounts/affiliations
 * Get all affiliations
 */
router.get(
  '/affiliations',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const affiliationSelect = {
      id: true,
      name: true,
      url: true,
    } as const;
    const affiliations = await prisma.affiliations.findMany({
      select: affiliationSelect,
      orderBy: {
        name: 'asc',
      },
    });
    type Affiliation = Prisma.affiliationsGetPayload<{ select: typeof affiliationSelect }>;
    res.json({
      success: true,
      data: {
        affiliations: affiliations.map((affiliation: Affiliation) => ({
          id: affiliation.id.toString(),
          name: affiliation.name,
          url: affiliation.url,
        })),
      },
    });
  }),
);

/**
 * GET /api/accounts/:accountId
 * Get specific account (requires account access)
 */
router.get(
  '/:accountId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const accountSelect = {
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
          filepath: true,
        },
      },
      accountsurl: {
        select: {
          id: true,
          url: true,
        },
        orderBy: {
          id: 'asc' as const,
        },
      },
    } as const;
    const account = await prisma.accounts.findUnique({
      where: { id: BigInt(req.params.accountId) },
      select: accountSelect,
    });
    type Account = Prisma.accountsGetPayload<{ select: typeof accountSelect }>;
    type AccountUrl = Account['accountsurl'][number];
    if (!account) {
      throw new NotFoundError('Account not found');
    }
    const affiliationSelect = {
      id: true,
      name: true,
      url: true,
    } as const;
    const affiliation = await prisma.affiliations.findUnique({
      where: { id: account.affiliationid },
      select: affiliationSelect,
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
          urls: account.accountsurl.map((url: AccountUrl) => ({
            id: url.id.toString(),
            url: url.url,
          })),
        },
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
 * PUT /api/accounts/:accountId/twitter
 * Update Twitter settings (Account Admin or Administrator)
 */
router.put(
  '/:accountId/twitter',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { twitterAccountName, twitterOauthToken, twitterOauthSecretKey, twitterWidgetScript } =
      req.body;

    if (
      !twitterAccountName &&
      !twitterOauthToken &&
      !twitterOauthSecretKey &&
      !twitterWidgetScript
    ) {
      throw new ValidationError('At least one Twitter field to update is required');
    }

    const updateData: Partial<Prisma.accountsUpdateInput> = {};
    if (twitterAccountName !== undefined) updateData.twitteraccountname = twitterAccountName;
    if (twitterOauthToken !== undefined) updateData.twitteroauthtoken = twitterOauthToken;
    if (twitterOauthSecretKey !== undefined)
      updateData.twitteroauthsecretkey = twitterOauthSecretKey;
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
        twitterwidgetscript: true,
      },
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
          twitterWidgetScript: account.twitterwidgetscript,
        },
      },
    });
  }),
);

/**
 * GET /api/accounts/:accountId/urls
 * Get URLs for account (Account Admin or Administrator)
 */
router.get(
  '/:accountId/urls',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    const urlSelect = {
      id: true,
      url: true,
    } as const;
    const urls = await prisma.accountsurl.findMany({
      where: {
        accountid: accountId,
      },
      select: urlSelect,
      orderBy: {
        id: 'asc',
      },
    });
    type AccountUrl = Prisma.accountsurlGetPayload<{ select: typeof urlSelect }>;
    res.json({
      success: true,
      data: {
        urls: urls.map((url: AccountUrl) => ({
          id: url.id.toString(),
          url: url.url,
        })),
      },
    });
  }),
);

/**
 * POST /api/accounts/:accountId/urls
 * Add URL to account (Account Admin or Administrator)
 */
router.post(
  '/:accountId/urls',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { url } = req.body;

    if (!url) {
      throw new ValidationError('URL is required');
    }

    // Validate URL format using centralized validation
    if (!isValidAccountUrl(url)) {
      throw new ValidationError(
        'Invalid URL format. Please use http:// or https:// followed by a valid domain.',
      );
    }

    const normalizedUrl = normalizeUrl(url);

    // Check if URL already exists for this account
    const existingUrl = await prisma.accountsurl.findFirst({
      where: {
        accountid: accountId,
        url: normalizedUrl,
      },
    });

    if (existingUrl) {
      throw new ConflictError('This URL is already associated with this account');
    }

    const accountUrl = await prisma.accountsurl.create({
      data: {
        accountid: accountId,
        url: normalizedUrl,
      },
      select: {
        id: true,
        url: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        url: {
          id: accountUrl.id.toString(),
          url: accountUrl.url,
        },
      },
    });
  }),
);

/**
 * PUT /api/accounts/:accountId/urls/:urlId
 * Update URL for account (Account Admin or Administrator)
 */
router.put(
  '/:accountId/urls/:urlId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, urlId } = extractBigIntParams(req.params, 'accountId', 'urlId');
    const { url } = req.body;

    if (!url) {
      throw new ValidationError('URL is required');
    }

    // Validate URL format using centralized validation
    if (!isValidAccountUrl(url)) {
      throw new ValidationError(
        'Invalid URL format. Please use http:// or https:// followed by a valid domain.',
      );
    }

    const normalizedUrl = normalizeUrl(url);

    // Check if URL already exists for this account
    const existingUrl = await prisma.accountsurl.findFirst({
      where: {
        accountid: accountId,
        url: normalizedUrl,
        id: { not: urlId },
      },
    });

    if (existingUrl) {
      throw new ConflictError('This URL is already associated with this account');
    }

    // Verify the URL belongs to the account
    const currentUrl = await prisma.accountsurl.findFirst({
      where: {
        id: urlId,
        accountid: accountId,
      },
    });

    if (!currentUrl) {
      throw new NotFoundError('URL not found or does not belong to this account');
    }

    // Update the URL
    const updatedUrl = await prisma.accountsurl.update({
      where: { id: urlId },
      data: { url: normalizedUrl },
      select: {
        id: true,
        url: true,
      },
    });

    res.json({
      success: true,
      data: {
        url: {
          id: updatedUrl.id.toString(),
          url: updatedUrl.url,
        },
      },
    });
  }),
);

/**
 * DELETE /api/accounts/:accountId/urls/:urlId
 * Remove URL from account (Account Admin or Administrator)
 */
router.delete(
  '/:accountId/urls/:urlId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, urlId } = extractBigIntParams(req.params, 'accountId', 'urlId');

    // Verify the URL belongs to the account
    const existingUrl = await prisma.accountsurl.findFirst({
      where: {
        id: urlId,
        accountid: accountId,
      },
    });

    if (!existingUrl) {
      throw new NotFoundError('URL not found or does not belong to this account');
    }

    await prisma.accountsurl.delete({
      where: { id: urlId },
    });

    res.json({
      success: true,
      message: 'URL removed successfully',
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

/**
 * GET /api/accounts/:accountId/users
 * Get users in account (requires account access)
 */
router.get(
  '/:accountId/users',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.users.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    const contactSelect = {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      userid: true,
    } as const;
    const contacts = await prisma.contacts.findMany({
      where: {
        creatoraccountid: accountId,
      },
      select: contactSelect,
      orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
    });
    type Contact = Prisma.contactsGetPayload<{ select: typeof contactSelect }>;
    const users = contacts.map((contact: Contact) => ({
      id: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      email: contact.email,
      userId: contact.userid,
    }));

    res.json({
      success: true,
      data: {
        accountId: accountId.toString(),
        users,
      },
    });
  }),
);

/**
 * POST /api/accounts/:accountId/users/:contactId/roles
 * Assign role to user in account (Account Admin or Administrator)
 */
router.post(
  '/:accountId/users/:contactId/roles',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.roles.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, contactId } = extractContactParams(req.params);
    const { roleId, roleData } = req.body;

    if (!roleId || !roleData) {
      throw new ValidationError('Role ID and role data are required');
    }

    const assignedRole = await roleService.assignRole(
      req.user!.id,
      contactId,
      roleId,
      BigInt(roleData),
      accountId,
    );

    res.status(201).json({
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

/**
 * DELETE /api/accounts/:accountId/users/:contactId/roles/:roleId
 * Remove role from user in account (Account Admin or Administrator)
 */
router.delete(
  '/:accountId/users/:contactId/roles/:roleId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.roles.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, contactId } = extractContactParams(req.params);
    const roleId = req.params.roleId;
    const { roleData } = req.body;

    if (!roleData) {
      throw new ValidationError('Role data is required');
    }

    await roleService.removeRole(req.user!.id, contactId, roleId, BigInt(roleData), accountId);

    res.json({
      success: true,
      message: 'Role removed successfully',
    });
  }),
);

/**
 * GET /api/accounts/contacts/search
 * Search contacts by name for autocomplete
 */
router.get(
  '/:accountId/contacts/search',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { q } = req.query; // search query
    const limit = 10; // maximum results to return
    const { accountId } = extractAccountParams(req.params);

    if (!q || typeof q !== 'string') {
      res.json({
        success: true,
        data: {
          contacts: [],
        },
      });
      return;
    }

    const contactSelect = {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      userid: true,
    } as const;
    const contacts = await prisma.contacts.findMany({
      where: {
        creatoraccountid: accountId,
        OR: [
          {
            firstname: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            lastname: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: q,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: contactSelect,
      orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      take: limit,
    });
    type Contact = Prisma.contactsGetPayload<{ select: typeof contactSelect }>;
    res.json({
      success: true,
      data: {
        contacts: contacts.map((contact: Contact) => ({
          id: contact.id.toString(),
          firstName: contact.firstname,
          lastName: contact.lastname,
          email: contact.email,
          userId: contact.userid,
          displayName: `${contact.firstname} ${contact.lastname}`,
          searchText: `${contact.firstname} ${contact.lastname} (${contact.email})`,
        })),
      },
    });
  }),
);

/**
 * GET /api/accounts/contacts/:userId
 * Get contact information by user ID
 */
router.get(
  '/contacts/:userId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const contact = await prisma.contacts.findFirst({
      where: { userid: userId },
      select: { userid: true, firstname: true, lastname: true, email: true },
    });
    if (!contact) {
      throw new NotFoundError('Contact not found');
    }
    res.json({
      success: true,
      data: {
        contact: {
          userId: contact.userid,
          displayName: `${contact.firstname} ${contact.lastname}`.trim(),
          searchText: `${contact.firstname} ${contact.lastname} (${contact.email})`.trim(),
          email: contact.email,
        },
      },
    });
  }),
);

/**
 * PUT /api/accounts/:accountId/contacts/:contactId
 * Update contact information
 */
router.put(
  '/:accountId/contacts/:contactId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, contactId } = extractContactParams(req.params);
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
      dateofbirth,
    } = req.body;

    // Validate required fields
    if (!firstname || !lastname) {
      throw new ValidationError('First name and last name are required');
    }

    // Validate email format if provided
    if (email) {
      if (!isEmail(email)) {
        throw new ValidationError('Please enter a valid email address');
      }
    }

    // Verify the contact exists and belongs to this account
    const existingContact = await prisma.contacts.findFirst({
      where: {
        id: contactId,
        creatoraccountid: accountId,
      },
    });

    if (!existingContact) {
      throw new NotFoundError('Contact not found');
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
        ...(dateofbirth ? { dateofbirth: new Date(dateofbirth) } : {}),
      },
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
          dateofbirth: updatedContact.dateofbirth ? updatedContact.dateofbirth.toISOString() : null,
        },
      },
    });
  }),
);

/**
 * POST /api/accounts/:accountId/contacts
 * Create a new contact in an account
 */
router.post(
  '/:accountId/contacts',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
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
      dateofbirth,
    } = req.body;

    // Validate required fields
    if (!firstname || !lastname) {
      throw new ValidationError('First name and last name are required');
    }

    // Validate email format if provided
    if (email) {
      if (!isEmail(email)) {
        throw new ValidationError('Please enter a valid email address');
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
        dateofbirth: dateofbirth ? new Date(dateofbirth) : new Date('1900-01-01'),
      },
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
          dateofbirth: newContact.dateofbirth ? newContact.dateofbirth.toISOString() : null,
        },
      },
    });
  }),
);

/**
 * POST /api/accounts/:accountId/roster
 * Create a new roster entry (player) in an account
 */
router.post(
  '/:accountId/roster',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { contactId, submittedDriversLicense, firstYear } = req.body;

    if (!contactId) {
      throw new ValidationError('ContactId is required');
    }

    // Verify the contact exists and belongs to this account
    const contact = await prisma.contacts.findFirst({
      where: {
        id: BigInt(contactId),
        creatoraccountid: accountId,
      },
      select: {
        firstname: true,
        lastname: true,
      },
    });

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    // Check if a roster entry already exists for this contact
    const existingRoster = await prisma.roster.findFirst({
      where: {
        contactid: BigInt(contactId),
      },
    });

    if (existingRoster) {
      throw new ConflictError('A roster entry already exists for this contact');
    }

    // Create the roster entry
    const newRoster = await prisma.roster.create({
      data: {
        contactid: BigInt(contactId),
        submitteddriverslicense: submittedDriversLicense || false,
        firstyear: firstYear || 0,
      },
      include: {
        contacts: {
          select: {
            firstname: true,
            lastname: true,
          },
        },
      },
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
          contact: newRoster.contacts,
        },
      },
    });
  }),
);

/**
 * GET /api/accounts/:accountId/user-teams
 * Get teams that the current user is a member of for this account
 */
router.get(
  '/:accountId/user-teams',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const userId = req.user?.id;

    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    // Get the user's contact record for this account
    const userContact = await prisma.contacts.findFirst({
      where: {
        userid: userId,
        creatoraccountid: accountId,
      },
    });

    if (!userContact) {
      // User doesn't have a contact record for this account, return empty teams
      res.json({
        success: true,
        data: {
          teams: [],
        },
      });
      return;
    }

    // Get current season for this account
    const currentSeasonRecord = await prisma.currentseason.findUnique({
      where: {
        accountid: accountId,
      },
    });

    if (!currentSeasonRecord) {
      res.json({
        success: true,
        data: {
          teams: [],
        },
      });
      return;
    }

    const currentSeason = await prisma.season.findUnique({
      where: {
        id: currentSeasonRecord.seasonid,
      },
    });

    if (!currentSeason) {
      res.json({
        success: true,
        data: {
          teams: [],
        },
      });
      return;
    }

    // Get teams where the user is a roster member
    const userTeams = await prisma.rosterseason.findMany({
      where: {
        roster: {
          contactid: userContact.id,
        },
        teamsseason: {
          leagueseason: {
            seasonid: currentSeason.id,
          },
        },
        inactive: false,
      },
      include: {
        teamsseason: {
          include: {
            leagueseason: {
              include: {
                league: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            teams: {
              select: {
                accountid: true,
              },
            },
          },
        },
      },
    });

    // Get teams where the user is a manager
    const managedTeams = await prisma.teamseasonmanager.findMany({
      where: {
        contactid: userContact.id,
        teamsseason: {
          leagueseason: {
            seasonid: currentSeason.id,
          },
        },
      },
      include: {
        teamsseason: {
          include: {
            leagueseason: {
              include: {
                league: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            teams: {
              select: {
                accountid: true,
              },
            },
          },
        },
      },
    });

    // Combine and deduplicate teams
    const allTeams = [...userTeams, ...managedTeams];
    const uniqueTeams = new Map();

    for (const team of allTeams) {
      const teamSeason = team.teamsseason;
      // Defensive: fetch league.accountid if not already included
      // We'll need to fetch the team base record to get its accountid
      let teamAccountId: string | undefined = undefined;
      if (teamSeason.teams && teamSeason.teams.accountid) {
        teamAccountId = teamSeason.teams.accountid.toString();
      } else {
        // Fallback: fetch from DB (shouldn't happen if include is set up right)
        const teamBase = await prisma.teams.findUnique({
          where: { id: teamSeason.teamid },
          select: { accountid: true },
        });
        if (teamBase) teamAccountId = teamBase.accountid.toString();
      }
      // Only include if the team's accountId matches the route accountId
      if (teamAccountId === accountId.toString()) {
        const teamId = teamSeason.id.toString();
        if (!uniqueTeams.has(teamId)) {
          uniqueTeams.set(teamId, {
            id: teamId,
            name: teamSeason.name,
            leagueName: teamSeason.leagueseason.league.name,
            logoUrl: getLogoUrl(teamAccountId, teamSeason.teamid.toString()),
            // TODO: Add more team data like record, standing, next game
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        teams: Array.from(uniqueTeams.values()),
      },
    });
  }),
);

/**
 * GET /api/accounts/:accountId/leagues
 * Get all leagues for this account
 */
router.get(
  '/:accountId/leagues',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    // Get current season for this account
    const currentSeasonRecord = await prisma.currentseason.findUnique({
      where: {
        accountid: accountId,
      },
    });

    if (!currentSeasonRecord) {
      res.json({
        success: true,
        data: {
          leagues: [],
        },
      });
      return;
    }

    const currentSeason = await prisma.season.findUnique({
      where: {
        id: currentSeasonRecord.seasonid,
      },
    });

    if (!currentSeason) {
      res.json({
        success: true,
        data: {
          leagues: [],
        },
      });
      return;
    }

    // Get leagues with team counts
    const leagues = await prisma.leagueseason.findMany({
      where: {
        seasonid: currentSeason.id,
        league: {
          accountid: accountId,
        },
      },
      include: {
        league: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            teamsseason: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        leagues: leagues.map((league) => ({
          id: league.league.id.toString(),
          name: league.league.name,
          teamCount: league._count.teamsseason,
        })),
      },
    });
  }),
);

/**
 * GET /api/accounts/:accountId/fields
 * Get all fields for an account (public endpoint)
 */
router.get(
  '/:accountId/fields',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    const fields = await prisma.availablefields.findMany({
      where: {
        accountid: accountId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: {
        fields: fields.map((field) => ({
          id: field.id.toString(),
          name: field.name,
          address: field.address,
          accountId: field.accountid.toString(),
        })),
      },
    });
  }),
);

/**
 * POST /api/accounts/:accountId/fields
 * Create a new field for an account
 */
router.post(
  '/:accountId/fields',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { name, address } = req.body;

    if (!name || typeof name !== 'string') {
      throw new ValidationError('Field name is required');
    }

    // Check if field with same name already exists for this account
    const existingField = await prisma.availablefields.findFirst({
      where: {
        accountid: accountId,
        name: name.trim(),
      },
    });

    if (existingField) {
      throw new ValidationError('A field with this name already exists for this account');
    }

    const newField = await prisma.availablefields.create({
      data: {
        name: name.trim(),
        shortname: name.trim().substring(0, 5), // Use first 5 chars of name
        comment: '', // Empty string for comment
        address: address?.trim() || '',
        city: '', // Empty string for city
        state: '', // Empty string for state
        zipcode: '', // Empty string for zipcode
        directions: '', // Empty string for directions
        rainoutnumber: '', // Empty string for rainout number
        latitude: '', // Empty string for latitude
        longitude: '', // Empty string for longitude
        accountid: accountId,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        field: {
          id: newField.id.toString(),
          name: newField.name,
          address: newField.address,
          accountId: newField.accountid.toString(),
        },
      },
    });
  }),
);

/**
 * PUT /api/accounts/:accountId/fields/:fieldId
 * Update a field
 */
router.put(
  '/:accountId/fields/:fieldId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, fieldId } = extractBigIntParams(req.params, 'accountId', 'fieldId');
    const { name, address } = req.body;

    if (!name || typeof name !== 'string') {
      throw new ValidationError('Field name is required');
    }

    // Check if field exists and belongs to this account
    const existingField = await prisma.availablefields.findFirst({
      where: {
        id: fieldId,
        accountid: accountId,
      },
    });

    if (!existingField) {
      throw new NotFoundError('Field not found');
    }

    // Check if another field with the same name already exists for this account
    const duplicateField = await prisma.availablefields.findFirst({
      where: {
        accountid: accountId,
        name: name.trim(),
        id: { not: fieldId },
      },
    });

    if (duplicateField) {
      throw new ValidationError('A field with this name already exists for this account');
    }

    const updatedField = await prisma.availablefields.update({
      where: {
        id: fieldId,
      },
      data: {
        name: name.trim(),
        address: address?.trim() || null,
      },
    });

    res.json({
      success: true,
      data: {
        field: {
          id: updatedField.id.toString(),
          name: updatedField.name,
          address: updatedField.address,
          accountId: updatedField.accountid.toString(),
        },
      },
    });
  }),
);

/**
 * DELETE /api/accounts/:accountId/fields/:fieldId
 * Delete a field
 */
router.delete(
  '/:accountId/fields/:fieldId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, fieldId } = extractBigIntParams(req.params, 'accountId', 'fieldId');

    // Check if field exists and belongs to this account
    const field = await prisma.availablefields.findFirst({
      where: {
        id: fieldId,
        accountid: accountId,
      },
    });

    if (!field) {
      throw new NotFoundError('Field not found');
    }

    // Check if field is being used in any games
    const gamesUsingField = await prisma.leagueschedule.findFirst({
      where: {
        fieldid: fieldId,
      },
    });

    if (gamesUsingField) {
      throw new ValidationError('Cannot delete field because it is being used in scheduled games');
    }

    await prisma.availablefields.delete({
      where: {
        id: fieldId,
      },
    });

    res.json({
      success: true,
      data: {
        message: `Field "${field.name}" has been deleted`,
      },
    });
  }),
);

// Account logo upload endpoint
router.post(
  '/:accountId/logo',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('logo')(req, res, (err: unknown) => {
      if (err) {
        res.status(400).json({ success: false, message: (err as Error).message });
        return;
      }
      next();
    });
  },
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const accountId = req.params.accountId;
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }
    const validationError = validateLogoFile(req.file);
    if (validationError) {
      throw new ValidationError(validationError);
    }
    await storageService.saveAccountLogo(accountId, req.file.buffer);
    const accountLogoUrl = getAccountLogoUrl(accountId);
    res.json({ success: true, accountLogoUrl });
  }),
);

// Account logo get endpoint
router.get(
  '/:accountId/logo',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const accountId = req.params.accountId;
    const logoBuffer = await storageService.getAccountLogo(accountId);
    if (!logoBuffer) {
      throw new NotFoundError('Account logo not found');
    }
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Length', logoBuffer.length.toString());
    res.send(logoBuffer);
  }),
);

// Account logo delete endpoint
router.delete(
  '/:accountId/logo',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const accountId = req.params.accountId;
    await storageService.deleteAccountLogo(accountId);
    res.json({ success: true });
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

/**
 * GET /api/accounts/:accountId/umpires
 * Get all umpires for an account
 */
router.get(
  '/:accountId/umpires',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    const umpires = await prisma.leagueumpires.findMany({
      where: {
        accountid: accountId,
      },
      include: {
        contacts: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
      orderBy: {
        contacts: {
          lastname: 'asc',
        },
      },
    });

    res.json({
      success: true,
      data: {
        umpires: umpires.map((umpire) => ({
          id: umpire.id.toString(),
          contactId: umpire.contactid.toString(),
          firstName: umpire.contacts.firstname,
          lastName: umpire.contacts.lastname,
          email: umpire.contacts.email,
          displayName: `${umpire.contacts.firstname} ${umpire.contacts.lastname}`.trim(),
        })),
      },
    });
  }),
);

// Add missing type definitions for contacts and account list response

type AccountListContact = {
  userid: string;
  firstname: string;
  lastname: string;
  email: string | null;
};

interface AccountListResponse {
  id: string;
  name: string;
  accountTypeId: string;
  accountType?: string;
  ownerUserId: string | null;
  ownerName: string;
  ownerEmail: string | null;
  firstYear: number | null;
  affiliationId: string;
  affiliation?: string;
  timezoneId: string;
  twitterAccountName: string;
  youtubeUserId: string | null;
  facebookFanPage: string | null;
  defaultVideo: string;
  autoPlayVideo: boolean;
  accountLogoUrl: string;
}

export default router;
