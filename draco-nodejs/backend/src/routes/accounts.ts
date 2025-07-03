// Protected Accounts Routes for Draco Sports Manager
// Demonstrates route protection with role-based access control

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { RouteProtection } from '../middleware/routeProtection';
import { RoleService } from '../services/roleService';
import { PrismaClient, Prisma } from '@prisma/client';
import { isEmail } from 'validator';
import { isValidAccountUrl, normalizeUrl } from '../utils/validation';
import { generateLogoPath } from '../config/logo';
import { logAndRethrow } from '../utils/logAndRethrow';
import { ContactRole } from '../types/roles';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();
export const roleService = new RoleService(prisma);
const routeProtection = new RouteProtection(roleService, prisma);

// Helper to generate logo URL for a team
function getLogoUrl(accountId: string | number, teamId: string | number): string {
  if (process.env.STORAGE_PROVIDER === 's3') {
    if (!process.env.S3_BUCKET) {
      throw new Error('S3_BUCKET environment variable must be set for S3 storage');
    }
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION || 'us-east-1';
    return `https://${bucket}.s3.${region}.amazonaws.com/team-logos/${teamId}-logo.png`;
  } else {
    // Local storage
    console.log('Generating logo URL for account:', accountId, 'team:', teamId);
    console.log('generateLogoPath:', generateLogoPath(accountId.toString(), teamId.toString()));
    return `/${generateLogoPath(accountId.toString(), teamId.toString())}`;
  }
}

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
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query; // search query

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
      return;
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
  } catch (error) {
    logAndRethrow('searching accounts', error);
  }
});

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
router.get('/by-domain', async (req: Request, res: Response): Promise<void> => {
  try {
    // Use X-Forwarded-Host if present (for local dev proxy), else Host
    const host = req.get('x-forwarded-host') || req.get('host');

    if (!host) {
      res.status(400).json({
        success: false,
        message: 'Host header is required',
      });
      return;
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
      res.status(404).json({
        success: false,
        message: 'No account found for this domain',
      });
      return;
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
  } catch (error) {
    logAndRethrow('looking up account by domain', error);
  }
});

/**
 * GET /api/accounts/:accountId/public
 * Get public account information (no authentication required)
 */
router.get('/:accountId/public', async (req: Request, res: Response): Promise<void> => {
  try {
    const accountId = BigInt(req.params.accountId);

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
      affiliation?: string;
      timezoneId: string;
      twitterAccountName: string;
      facebookFanPage: string;
      urls: { id: string; url: string }[];
    }
    interface PublicSeasonResponse {
      id: string;
      name: string;
      isCurrent: boolean;
    }

    const account: PublicAccount | null = await prisma.accounts.findUnique(accountSelectArgs);

    if (!account) {
      res.status(404).json({
        success: false,
        message: 'Account not found',
      });
      return;
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
          teams: [],
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

    if (!currentSeason) {
      res.json({
        success: true,
        data: {
          teams: [],
        },
      });
      return;
    }

    // Get recent seasons
    const recentSeasons: PublicSeason[] = await prisma.season.findMany({
      where: {
        accountid: accountId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: Prisma.SortOrder.desc,
      },
      take: 5,
    });

    // Mark current season
    const seasonsWithCurrentFlag: PublicSeasonResponse[] = recentSeasons.map((season) => ({
      id: season.id.toString(),
      name: season.name,
      isCurrent: currentSeason ? season.id === currentSeason.id : false,
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
          timezoneId: account.timezoneid ?? '',
          twitterAccountName: account.twitteraccountname ?? '',
          facebookFanPage: account.facebookfanpage ?? '',
          urls: account.accountsurl.map((url: PublicAccountUrl) => ({
            id: url.id.toString(),
            url: url.url,
          })),
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
  } catch (error) {
    logAndRethrow('getting public account', error);
  }
});

/**
 * GET /api/accounts
 * Get all accounts (Administrator only)
 */
router.get(
  '/',
  authenticateToken,
  routeProtection.requireAdministrator(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountListArgs = {
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
              name: true,
            },
          },
        },
        orderBy: {
          name: Prisma.SortOrder.asc,
        },
      } as const;

      type AccountList = Prisma.accountsGetPayload<typeof accountListArgs>;
      type AccountListAffiliation = { id: bigint; name: string; url: string };
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
        ownerEmail: string;
        firstYear: number | null;
        affiliationId: string;
        affiliation?: string;
        timezoneId: string;
        twitterAccountName: string;
        youtubeUserId: string | null;
        facebookFanPage: string | null;
        defaultVideo: string;
        autoPlayVideo: boolean;
      }

      // Administrator can see all accounts
      const accounts: AccountList[] = await prisma.accounts.findMany(accountListArgs);

      // Get affiliations separately
      const affiliationIds = [...new Set(accounts.map((acc) => acc.affiliationid))];
      const affiliations: AccountListAffiliation[] = await prisma.affiliations.findMany({
        where: {
          id: { in: affiliationIds },
        },
        select: {
          id: true,
          name: true,
          url: true,
        },
      });

      const affiliationMap = new Map<string, AccountListAffiliation>(
        affiliations.map((aff) => [aff.id.toString(), aff]),
      );

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
            };
          }),
        },
      });
    } catch (error) {
      logAndRethrow('getting accounts', error);
    }
  },
);

/**
 * GET /api/accounts/my-accounts
 * Get accounts accessible to the current user (Account Admin or Administrator)
 */
router.get(
  '/my-accounts',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
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
      const contacts = await prisma.contacts.findMany({
        where: {
          userid: { in: ownerUserIds },
        },
        select: {
          userid: true,
          firstname: true,
          lastname: true,
          email: true,
        },
      });

      const contactMap = new Map(contacts.map((contact) => [contact.userid, contact]));

      res.json({
        success: true,
        data: {
          accounts: accounts.map((account: AccountList) => {
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
              autoPlayVideo: account.autoplayvideo,
            };
          }),
        },
      });
    } catch (error) {
      logAndRethrow('getting my accounts', error);
    }
  },
);

/**
 * GET /api/accounts/types
 * Get all account types
 */
router.get('/types', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
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
  } catch (error) {
    logAndRethrow('getting account types', error);
  }
});

/**
 * GET /api/accounts/affiliations
 * Get all affiliations
 */
router.get(
  '/affiliations',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
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
    } catch (error) {
      logAndRethrow('getting affiliations', error);
    }
  },
);

/**
 * GET /api/accounts/:accountId
 * Get specific account (requires account access)
 */
router.get(
  '/:accountId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response): Promise<void> => {
    try {
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
        res.status(404).json({
          success: false,
          message: 'Account not found',
        });
        return;
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
    } catch (error) {
      logAndRethrow('getting account', error);
    }
  },
);

/**
 * POST /api/accounts
 * Create new account (Administrator only)
 */
router.post(
  '/',
  authenticateToken,
  routeProtection.requireAdministrator(),
  async (req: Request, res: Response): Promise<void> => {
    try {
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
        res.status(400).json({
          success: false,
          message: 'Name, account type ID, and owner user ID are required',
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
    } catch (error) {
      logAndRethrow('creating account', error);
    }
  },
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
  async (req: Request, res: Response): Promise<void> => {
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
        res.status(400).json({
          success: false,
          message: 'At least one field to update is required',
        });
        return;
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
    } catch (error) {
      logAndRethrow('updating account', error);
    }
  },
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
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const { twitterAccountName, twitterOauthToken, twitterOauthSecretKey, twitterWidgetScript } =
        req.body;

      if (
        !twitterAccountName &&
        !twitterOauthToken &&
        !twitterOauthSecretKey &&
        !twitterWidgetScript
      ) {
        res.status(400).json({
          success: false,
          message: 'At least one Twitter field to update is required',
        });
        return;
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
    } catch (error) {
      logAndRethrow('updating Twitter settings', error);
    }
  },
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
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);

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
    } catch (error) {
      logAndRethrow('getting account URLs', error);
    }
  },
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
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const { url } = req.body;

      if (!url) {
        res.status(400).json({
          success: false,
          message: 'URL is required',
        });
        return;
      }

      // Validate URL format using centralized validation
      if (!isValidAccountUrl(url)) {
        res.status(400).json({
          success: false,
          message: 'Invalid URL format. Please use http:// or https:// followed by a valid domain.',
        });
        return;
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
        res.status(409).json({
          success: false,
          message: 'This URL is already associated with this account',
        });
        return;
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
    } catch (error) {
      logAndRethrow('adding URL', error);
    }
  },
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
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const urlId = BigInt(req.params.urlId);
      const { url } = req.body;

      if (!url) {
        res.status(400).json({
          success: false,
          message: 'URL is required',
        });
        return;
      }

      // Validate URL format using centralized validation
      if (!isValidAccountUrl(url)) {
        res.status(400).json({
          success: false,
          message: 'Invalid URL format. Please use http:// or https:// followed by a valid domain.',
        });
        return;
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
        res.status(409).json({
          success: false,
          message: 'This URL is already associated with this account',
        });
        return;
      }

      // Verify the URL belongs to the account
      const currentUrl = await prisma.accountsurl.findFirst({
        where: {
          id: urlId,
          accountid: accountId,
        },
      });

      if (!currentUrl) {
        res.status(404).json({
          success: false,
          message: 'URL not found or does not belong to this account',
        });
        return;
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
    } catch (error) {
      logAndRethrow('updating URL', error);
    }
  },
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
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const urlId = BigInt(req.params.urlId);

      // Verify the URL belongs to the account
      const existingUrl = await prisma.accountsurl.findFirst({
        where: {
          id: urlId,
          accountid: accountId,
        },
      });

      if (!existingUrl) {
        res.status(404).json({
          success: false,
          message: 'URL not found or does not belong to this account',
        });
        return;
      }

      await prisma.accountsurl.delete({
        where: { id: urlId },
      });

      res.json({
        success: true,
        message: 'URL removed successfully',
      });
    } catch (error) {
      logAndRethrow('removing URL', error);
    }
  },
);

/**
 * DELETE /api/accounts/:accountId
 * Delete account (Administrator only)
 */
router.delete(
  '/:accountId',
  authenticateToken,
  routeProtection.requireAdministrator(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);

      // Check if account exists
      const existingAccount = await prisma.accounts.findUnique({
        where: { id: accountId },
      });

      if (!existingAccount) {
        res.status(404).json({
          success: false,
          message: 'Account not found',
        });
        return;
      }

      // Delete account (this will cascade to related records)
      await prisma.accounts.delete({
        where: { id: accountId },
      });

      res.json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      logAndRethrow('deleting account', error);
    }
  },
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
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);

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
    } catch (error) {
      logAndRethrow('getting account users', error);
    }
  },
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
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const contactId = BigInt(req.params.contactId);
      const { roleId, roleData } = req.body;

      if (!roleId || !roleData) {
        res.status(400).json({
          success: false,
          message: 'Role ID and role data are required',
        });
        return;
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
    } catch (error) {
      logAndRethrow('assigning role', error);
    }
  },
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
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const contactId = BigInt(req.params.contactId);
      const roleId = req.params.roleId;
      const { roleData } = req.body;

      if (!roleData) {
        res.status(400).json({
          success: false,
          message: 'Role data is required',
        });
        return;
      }

      await roleService.removeRole(req.user!.id, contactId, roleId, BigInt(roleData), accountId);

      res.json({
        success: true,
        message: 'Role removed successfully',
      });
    } catch (error) {
      logAndRethrow('removing role', error);
    }
  },
);

/**
 * GET /api/accounts/contacts/search
 * Search contacts by name for autocomplete
 */
router.get(
  '/contacts/search',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { q } = req.query; // search query
      const limit = 10; // maximum results to return

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
    } catch (error) {
      logAndRethrow('searching contacts', error);
    }
  },
);

/**
 * GET /api/accounts/contacts/:userId
 * Get contact information by user ID
 */
router.get(
  '/contacts/:userId',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const contact = await prisma.contacts.findFirst({
        where: { userid: userId },
        select: { userid: true, firstname: true, lastname: true, email: true },
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
            email: contact.email,
          },
        },
      });
    } catch (error) {
      logAndRethrow('getting contact information', error);
    }
  },
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
  async (req: Request, res: Response): Promise<void> => {
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
        dateofbirth,
      } = req.body;

      // Validate required fields
      if (!firstname || !lastname) {
        res.status(400).json({
          success: false,
          message: 'First name and last name are required',
        });
        return;
      }

      // Validate email format if provided
      if (email) {
        if (!isEmail(email)) {
          res.status(400).json({
            success: false,
            message: 'Please enter a valid email address',
          });
          return;
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
        res.status(404).json({
          success: false,
          message: 'Contact not found',
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
            dateofbirth: updatedContact.dateofbirth
              ? updatedContact.dateofbirth.toISOString()
              : null,
          },
        },
      });
    } catch (error) {
      logAndRethrow('updating contact', error);
    }
  },
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
  async (req: Request, res: Response): Promise<void> => {
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
        dateofbirth,
      } = req.body;

      // Validate required fields
      if (!firstname || !lastname) {
        res.status(400).json({
          success: false,
          message: 'First name and last name are required',
        });
        return;
      }

      // Validate email format if provided
      if (email) {
        if (!isEmail(email)) {
          res.status(400).json({
            success: false,
            message: 'Please enter a valid email address',
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
    } catch (error) {
      logAndRethrow('creating contact', error);
    }
  },
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
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const { contactId, submittedDriversLicense, firstYear } = req.body;

      if (!contactId) {
        res.status(400).json({
          success: false,
          message: 'ContactId is required',
        });
        return;
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
        res.status(404).json({ success: false, message: 'Contact not found' });
        return;
      }

      // Check if a roster entry already exists for this contact
      const existingRoster = await prisma.roster.findFirst({
        where: {
          contactid: BigInt(contactId),
        },
      });

      if (existingRoster) {
        res.status(409).json({
          success: false,
          message: 'A roster entry already exists for this contact',
        });
        return;
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
    } catch (error) {
      logAndRethrow('creating roster entry', error);
    }
  },
);

/**
 * GET /api/accounts/:accountId/user-teams
 * Get teams that the current user is a member of for this account
 */
router.get(
  '/:accountId/user-teams',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
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
            },
          },
        },
      });

      // Combine and deduplicate teams
      const allTeams = [...userTeams, ...managedTeams];
      const uniqueTeams = new Map();

      allTeams.forEach((team) => {
        const teamId = team.teamsseason.id.toString();
        if (!uniqueTeams.has(teamId)) {
          uniqueTeams.set(teamId, {
            id: teamId,
            name: team.teamsseason.name,
            leagueName: team.teamsseason.leagueseason.league.name,
            logoUrl: getLogoUrl(accountId.toString(), team.teamsseason.teamid.toString()),
            // TODO: Add more team data like record, standing, next game
          });
        }
      });

      res.json({
        success: true,
        data: {
          teams: Array.from(uniqueTeams.values()),
        },
      });
    } catch (error) {
      logAndRethrow('fetching user teams', error);
    }
  },
);

/**
 * GET /api/accounts/:accountId/leagues
 * Get all leagues for this account
 */
router.get('/:accountId/leagues', async (req: Request, res: Response): Promise<void> => {
  try {
    const accountId = BigInt(req.params.accountId);

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
  } catch (error) {
    logAndRethrow('fetching leagues', error);
  }
});

/**
 * GET /api/accounts/:accountId/recent-games
 * Get recent games for this account
 */
router.get('/:accountId/recent-games', async (req: Request, res: Response): Promise<void> => {
  try {
    const accountId = BigInt(req.params.accountId);

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
          games: [],
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
          games: [],
        },
      });
      return;
    }

    // Get recent games with more details
    const recentGamesInclude = {
      leagueseason: {
        include: {
          league: {
            select: {
              name: true,
            },
          },
        },
      },
      availablefields: {
        select: {
          id: true,
          name: true,
        },
      },
      gamerecap: {
        select: {
          teamid: true,
          recap: true,
        },
      },
    } as const;
    const recentGames = await prisma.leagueschedule.findMany({
      where: {
        leagueseason: {
          seasonid: currentSeason.id,
          league: {
            accountid: accountId,
          },
        },
      },
      include: recentGamesInclude,
      orderBy: {
        gamedate: 'desc',
      },
      take: 10,
    });
    type RecentGame = Prisma.leaguescheduleGetPayload<{ include: typeof recentGamesInclude }>;

    // Get team names for all games
    const allTeamIds = new Set<bigint>();
    recentGames.forEach((game) => {
      allTeamIds.add(game.hteamid);
      allTeamIds.add(game.vteamid);
    });

    const teams = await prisma.teamsseason.findMany({
      where: {
        id: {
          in: Array.from(allTeamIds),
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const teamMap = new Map(teams.map((team) => [team.id, team.name]));

    // Helper function to get game status text
    const getGameStatusText = (status: number): string => {
      switch (status) {
        case 0:
          return 'Incomplete';
        case 1:
          return 'Final';
        case 2:
          return 'In Progress';
        case 3:
          return 'Postponed';
        case 4:
          return 'Forfeit';
        case 5:
          return 'Did Not Report';
        default:
          return 'Unknown';
      }
    };

    res.json({
      success: true,
      data: {
        games: recentGames.map((game: RecentGame) => ({
          id: game.id.toString(),
          date: game.gamedate.toISOString(),
          time: game.gamedate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          homeTeamId: game.hteamid.toString(),
          awayTeamId: game.vteamid.toString(),
          homeTeamName: teamMap.get(game.hteamid) || `Team ${game.hteamid}`,
          awayTeamName: teamMap.get(game.vteamid) || `Team ${game.vteamid}`,
          homeScore: game.hscore || 0,
          awayScore: game.vscore || 0,
          gameStatus: game.gamestatus,
          gameStatusText: getGameStatusText(game.gamestatus),
          leagueName: game.leagueseason.league.name,
          fieldId: game.fieldid?.toString() || null,
          fieldName: game.availablefields?.name || null,
          hasGameRecap: game.gamerecap.length > 0,
          gameRecaps: game.gamerecap.map((recap) => ({
            teamId: recap.teamid.toString(),
            recap: recap.recap,
          })),
        })),
      },
    });
  } catch (error) {
    logAndRethrow('fetching recent games', error);
  }
});

/**
 * POST /api/accounts/:accountId/teams
 * Create a new team definition
 */
router.post(
  '/:accountId/teams',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const { name, webAddress, youtubeUserId, defaultVideo, autoPlayVideo } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Team name is required',
        });
        return;
      }

      // Check if team with this name already exists for this account
      const existingTeam = await prisma.teams.findFirst({
        where: {
          accountid: accountId,
        },
        include: {
          teamsseason: {
            where: {
              name: name,
            },
          },
        },
      });

      if (existingTeam && existingTeam.teamsseason.length > 0) {
        res.status(409).json({
          success: false,
          message: 'A team with this name already exists for this account',
        });
        return;
      }

      const newTeam = await prisma.teams.create({
        data: {
          accountid: accountId,
          webaddress: webAddress || '',
          youtubeuserid: youtubeUserId || null,
          defaultvideo: defaultVideo || '',
          autoplayvideo: autoPlayVideo || false,
        },
        select: {
          id: true,
          accountid: true,
          webaddress: true,
          youtubeuserid: true,
          defaultvideo: true,
          autoplayvideo: true,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          team: {
            id: newTeam.id.toString(),
            accountId: newTeam.accountid.toString(),
            webAddress: newTeam.webaddress,
            youtubeUserId: newTeam.youtubeuserid,
            defaultVideo: newTeam.defaultvideo,
            autoPlayVideo: newTeam.autoplayvideo,
            logoUrl: getLogoUrl(newTeam.accountid.toString(), newTeam.id.toString()),
          },
        },
      });
    } catch (error) {
      logAndRethrow('creating team', error);
    }
  },
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/teams
 * Add a team to a league season (create teamsseason record)
 */
router.post(
  '/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/teams',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const seasonId = BigInt(req.params.seasonId);
      const leagueSeasonId = BigInt(req.params.leagueSeasonId);
      const { teamId, name } = req.body;

      if (!teamId && !name) {
        res.status(400).json({
          success: false,
          message: 'Either teamId or name is required',
        });
        return;
      }

      // Verify the season belongs to this account
      const season = await prisma.season.findFirst({
        where: {
          id: seasonId,
          accountid: accountId,
        },
      });

      if (!season) {
        res.status(404).json({
          success: false,
          message: 'Season not found',
        });
        return;
      }

      // Verify the league season exists and belongs to this account
      const leagueSeason = await prisma.leagueseason.findFirst({
        where: {
          id: leagueSeasonId,
          seasonid: seasonId,
          league: {
            accountid: accountId,
          },
        },
      });

      if (!leagueSeason) {
        res.status(404).json({
          success: false,
          message: 'League season not found',
        });
        return;
      }

      let teamToAdd;
      let teamName;

      if (teamId) {
        // Use existing team
        const existingTeam = await prisma.teams.findFirst({
          where: {
            id: BigInt(teamId),
            accountid: accountId,
          },
        });

        if (!existingTeam) {
          res.status(404).json({
            success: false,
            message: 'Team not found',
          });
          return;
        }

        teamToAdd = existingTeam;
        teamName = name || `Team ${existingTeam.id}`;
      } else {
        // Create new team
        const newTeam = await prisma.teams.create({
          data: {
            accountid: accountId,
            webaddress: '',
            youtubeuserid: null,
            defaultvideo: '',
            autoplayvideo: false,
          },
        });

        teamToAdd = newTeam;
        teamName = name;
      }

      // Check if team is already in this league season
      const existingTeamSeason = await prisma.teamsseason.findFirst({
        where: {
          teamid: teamToAdd.id,
          leagueseasonid: leagueSeasonId,
        },
      });

      if (existingTeamSeason) {
        res.status(409).json({
          success: false,
          message: 'Team is already in this league season',
        });
        return;
      }

      // Create team season record
      const newTeamSeason = await prisma.teamsseason.create({
        data: {
          teamid: teamToAdd.id,
          leagueseasonid: leagueSeasonId,
          name: teamName,
          divisionseasonid: null,
        },
        include: {
          teams: {
            select: {
              id: true,
              accountid: true,
              webaddress: true,
              youtubeuserid: true,
              defaultvideo: true,
              autoplayvideo: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: {
          teamSeason: {
            id: newTeamSeason.id.toString(),
            teamId: newTeamSeason.teamid.toString(),
            name: newTeamSeason.name,
            webAddress: newTeamSeason.teams.webaddress,
            youtubeUserId: newTeamSeason.teams.youtubeuserid,
            defaultVideo: newTeamSeason.teams.defaultvideo,
            autoPlayVideo: newTeamSeason.teams.autoplayvideo,
            logoUrl: getLogoUrl(accountId.toString(), newTeamSeason.teamid.toString()),
          },
          message: `Team "${teamName}" has been added to the league season`,
        },
      });
    } catch (error) {
      logAndRethrow('adding team to league season', error);
    }
  },
);

/**
 * DELETE /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId
 * Remove a team from a season (delete teamsseason record)
 */
router.delete(
  '/:accountId/seasons/:seasonId/teams/:teamSeasonId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const seasonId = BigInt(req.params.seasonId);
      const teamSeasonId = BigInt(req.params.teamSeasonId);

      // Verify the season belongs to this account
      const season = await prisma.season.findFirst({
        where: {
          id: seasonId,
          accountid: accountId,
        },
      });

      if (!season) {
        res.status(404).json({
          success: false,
          message: 'Season not found',
        });
        return;
      }

      // Get the team season with team details
      const teamSeason = await prisma.teamsseason.findFirst({
        where: {
          id: teamSeasonId,
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId,
            },
          },
        },
        include: {
          teams: {
            select: {
              id: true,
              accountid: true,
            },
          },
        },
      });

      if (!teamSeason) {
        res.status(404).json({
          success: false,
          message: 'Team season not found',
        });
        return;
      }

      // Verify the team belongs to this account
      if (teamSeason.teams.accountid !== accountId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      // Check if there are any related records that would prevent deletion
      const hasRelatedData = await prisma.teamsseason.findFirst({
        where: {
          id: teamSeasonId,
        },
        include: {
          _count: {
            select: {
              rosterseason: true,
              teamseasonmanager: true,
              gamerecap: true,
              batstatsum: true,
              pitchstatsum: true,
            },
          },
        },
      });

      if (
        hasRelatedData &&
        (hasRelatedData._count.rosterseason > 0 ||
          hasRelatedData._count.teamseasonmanager > 0 ||
          hasRelatedData._count.gamerecap > 0 ||
          hasRelatedData._count.batstatsum > 0 ||
          hasRelatedData._count.pitchstatsum > 0)
      ) {
        res.status(400).json({
          success: false,
          message:
            'Cannot remove team from season because it has related data (roster, managers, statistics, etc.). Remove related data first.',
        });
        return;
      }

      // Remove the team from the season
      await prisma.teamsseason.delete({
        where: {
          id: teamSeasonId,
        },
      });

      res.json({
        success: true,
        data: {
          message: `Team "${teamSeason.name}" has been removed from season "${season.name}"`,
        },
      });
    } catch (error) {
      logAndRethrow('removing team from season', error);
    }
  },
);

/**
 * DELETE /api/accounts/:accountId/teams/:teamId
 * Delete a team definition (may fail if used in other seasons)
 */
router.delete(
  '/:accountId/teams/:teamId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const teamId = BigInt(req.params.teamId);

      // Check if team exists and belongs to this account
      const team = await prisma.teams.findFirst({
        where: {
          id: teamId,
          accountid: accountId,
        },
      });

      if (!team) {
        res.status(404).json({
          success: false,
          message: 'Team not found',
        });
        return;
      }

      // Get a teamsseason record to get the team name
      const teamSeason = await prisma.teamsseason.findFirst({
        where: {
          teamid: teamId,
        },
        select: {
          name: true,
        },
      });

      const teamName = teamSeason?.name || `Team ${teamId}`;

      // Check if there are any related records that would prevent deletion
      const hasRelatedData = await prisma.teams.findFirst({
        where: {
          id: teamId,
        },
        include: {
          _count: {
            select: {
              teamsseason: true,
              sponsors: true,
              accountwelcome: true,
              teamhandouts: true,
              teamnews: true,
            },
          },
        },
      });

      if (
        hasRelatedData &&
        (hasRelatedData._count.teamsseason > 0 ||
          hasRelatedData._count.sponsors > 0 ||
          hasRelatedData._count.accountwelcome > 0 ||
          hasRelatedData._count.teamhandouts > 0 ||
          hasRelatedData._count.teamnews > 0)
      ) {
        res.status(400).json({
          success: false,
          message:
            'Cannot delete team because it has related data (seasons, sponsors, etc.). Remove related data first.',
        });
        return;
      }

      // Delete the team
      await prisma.teams.delete({
        where: {
          id: teamId,
        },
      });

      res.json({
        success: true,
        data: {
          message: `Team "${teamName}" has been deleted`,
        },
      });
    } catch (error) {
      logAndRethrow('deleting team', error);
    }
  },
);

/**
 * GET /api/accounts/:accountId/fields
 * Get all fields for an account (public endpoint)
 */
router.get('/:accountId/fields', async (req: Request, res: Response): Promise<void> => {
  try {
    const accountId = BigInt(req.params.accountId);

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
  } catch (error) {
    logAndRethrow('fetching fields', error);
  }
});

/**
 * POST /api/accounts/:accountId/fields
 * Create a new field for an account
 */
router.post(
  '/:accountId/fields',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const { name, address } = req.body;

      if (!name || typeof name !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Field name is required',
        });
        return;
      }

      // Check if field with same name already exists for this account
      const existingField = await prisma.availablefields.findFirst({
        where: {
          accountid: accountId,
          name: name.trim(),
        },
      });

      if (existingField) {
        res.status(400).json({
          success: false,
          message: 'A field with this name already exists for this account',
        });
        return;
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
    } catch (error) {
      logAndRethrow('creating field', error);
    }
  },
);

/**
 * PUT /api/accounts/:accountId/fields/:fieldId
 * Update a field
 */
router.put(
  '/:accountId/fields/:fieldId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const fieldId = BigInt(req.params.fieldId);
      const { name, address } = req.body;

      if (!name || typeof name !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Field name is required',
        });
        return;
      }

      // Check if field exists and belongs to this account
      const existingField = await prisma.availablefields.findFirst({
        where: {
          id: fieldId,
          accountid: accountId,
        },
      });

      if (!existingField) {
        res.status(404).json({
          success: false,
          message: 'Field not found',
        });
        return;
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
        res.status(400).json({
          success: false,
          message: 'A field with this name already exists for this account',
        });
        return;
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
    } catch (error) {
      logAndRethrow('updating field', error);
    }
  },
);

/**
 * DELETE /api/accounts/:accountId/fields/:fieldId
 * Delete a field
 */
router.delete(
  '/:accountId/fields/:fieldId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const fieldId = BigInt(req.params.fieldId);

      // Check if field exists and belongs to this account
      const field = await prisma.availablefields.findFirst({
        where: {
          id: fieldId,
          accountid: accountId,
        },
      });

      if (!field) {
        res.status(404).json({
          success: false,
          message: 'Field not found',
        });
        return;
      }

      // Check if field is being used in any games
      const gamesUsingField = await prisma.leagueschedule.findFirst({
        where: {
          fieldid: fieldId,
        },
      });

      if (gamesUsingField) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete field because it is being used in scheduled games',
        });
        return;
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
    } catch (error) {
      logAndRethrow('deleting field', error);
    }
  },
);

export default router;
