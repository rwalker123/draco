// Core Account Routes for Draco Sports Manager
// Handles basic account operations: search, retrieval, creation, updates, deletion

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { Prisma } from '@prisma/client';
import {
  AccountSearchQuerySchema,
  AccountDomainLookupHeadersSchema,
  AccountDetailsQuerySchema,
} from '@draco/shared-schemas';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError, NotFoundError } from '../utils/customErrors.js';
import { extractAccountParams } from '../utils/paramExtraction.js';
import { getAccountLogoUrl } from '../config/logo.js';
import prisma from '../lib/prisma.js';

const router = Router({ mergeParams: true });
const accountsService = ServiceFactory.getAccountsService();
const routeProtection = ServiceFactory.getRouteProtection();

/**
 * GET /api/accounts/search
 * Search for accounts by name
 */
router.get(
  '/search',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { q } = AccountSearchQuerySchema.parse(req.query);

    const accounts = await accountsService.searchAccounts(q);

    res.json(accounts);
  }),
);

/**
 * GET /api/accounts/by-domain
 * Get account by domain
 */
router.get(
  '/by-domain',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const forwardedHost = req.get('x-forwarded-host');
    const hostHeader = forwardedHost ?? req.get('host') ?? '';

    const { host } = AccountDomainLookupHeadersSchema.parse({ host: hostHeader });

    const account = await accountsService.getAccountByDomain(host);

    res.json(account);
  }),
);

/**
 * GET /api/accounts/my-accounts
 * Return the accounts accessible to the authenticated user using shared schema types
 */
router.get(
  '/my-accounts',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const accounts = await accountsService.getAccountsForUser(userId);
    res.json(accounts);
  }),
);

/**
 * GET /api/accounts/managed
 * Return the accounts managed by the authenticated user (AccountAdmin or Administrator)
 */
router.get(
  '/managed',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const accounts = await accountsService.getManagedAccountsForUser(userId);
    res.json(accounts);
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
    const { includeCurrentSeason } = AccountDetailsQuerySchema.parse(req.query);

    const account = await accountsService.getAccountById(accountId, {
      includeCurrentSeason,
    });

    res.json(account);
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

/**
 * GET /api/accounts/:accountId/name
 *
 * Get account name
 */
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

/**
 * GET /api/accounts/:accountId/header
 * Get account name and logo URL
 */
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
