// Account Settings & Metadata Routes for Draco Sports Manager
// Handles URLs, Twitter settings, account types, and affiliations

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { Prisma } from '@prisma/client';
import { isValidAccountUrl, normalizeUrl } from '../utils/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/customErrors.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import prisma from '../lib/prisma.js';
import { AccountUrl } from '../interfaces/accountInterfaces.js';
import { AccountType, AccountAffiliationType } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();

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

    type AccountTypeQuery = Prisma.accounttypesGetPayload<{ select: typeof accountTypeSelect }>;

    const typesData: Partial<AccountType>[] = accountTypes.map((type: AccountTypeQuery) => ({
      id: type.id.toString(),
      name: type.name,
      filePath: type.filepath,
    }));

    res.json(typesData);
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

    type AffiliationQuery = Prisma.affiliationsGetPayload<{ select: typeof affiliationSelect }>;

    const affiliationData: AccountAffiliationType[] = affiliations.map(
      (affiliation: AffiliationQuery) => ({
        id: affiliation.id.toString(),
        name: affiliation.name,
        url: affiliation.url,
      }),
    );

    res.json(affiliationData);
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

    type AccountUrlQuery = Prisma.accountsurlGetPayload<{ select: typeof urlSelect }>;

    const urlData: AccountUrl[] = urls.map((url: AccountUrlQuery) => ({
      id: url.id.toString(),
      url: url.url,
    }));

    res.json({
      success: true,
      data: {
        urls: urlData,
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

    const urlResponse: AccountUrl = {
      id: accountUrl.id.toString(),
      url: accountUrl.url,
    };

    res.status(201).json({
      success: true,
      data: {
        url: urlResponse,
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

    const urlResponse: AccountUrl = {
      id: updatedUrl.id.toString(),
      url: updatedUrl.url,
    };

    res.json({
      success: true,
      data: {
        url: urlResponse,
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

export default router;
