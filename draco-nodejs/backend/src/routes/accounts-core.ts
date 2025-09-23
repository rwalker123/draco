// Core Account Routes for Draco Sports Manager
// Handles basic account operations: search, retrieval, creation, updates, deletion

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import {
  AccountDomainLookupHeadersSchema,
  AccountDetailsQuerySchema,
  AccountSearchQuerySchema,
  AccountSocialsSchema,
} from '@draco/shared-schemas';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/customErrors.js';
import { extractAccountParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const accountsService = ServiceFactory.getAccountsService();
const routeProtection = ServiceFactory.getRouteProtection();

const stringIdSchema = z.preprocess((value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return value.toString();
  }

  return value;
}, z.string().min(1));

const numericYearSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
}, z.number().int().optional());

const booleanLikeSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  return value;
}, z.boolean().optional());

const urlEntrySchema = z.union([
  z.string().trim().min(1),
  z.object({ url: z.string().trim().min(1) }),
]);

const createAccountRequestSchema = z.object({
  name: z.string().trim().min(1, { message: 'Name is required' }),
  accountTypeId: stringIdSchema,
  ownerUserId: stringIdSchema,
  affiliationId: stringIdSchema.optional().default('1'),
  timezoneId: z.string().trim().min(1).default('UTC'),
  firstYear: numericYearSchema,
  urls: z
    .array(urlEntrySchema)
    .default([])
    .transform((urls) => urls.map((entry) => (typeof entry === 'string' ? entry : entry.url))),
  socials: AccountSocialsSchema.partial().optional(),
});

const optionalNullableStringSchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return value.toString();
  }

  return value;
}, z.string().nullable().optional());

const updateAccountRequestSchema = z.object({
  name: z.string().trim().min(1).optional(),
  accountTypeId: stringIdSchema.optional(),
  affiliationId: stringIdSchema.optional(),
  timezoneId: z.string().trim().min(1).optional(),
  firstYear: numericYearSchema,
  youtubeUserId: optionalNullableStringSchema,
  facebookFanPage: optionalNullableStringSchema,
  defaultVideo: optionalNullableStringSchema,
  autoPlayVideo: booleanLikeSchema,
  socials: AccountSocialsSchema.partial().optional(),
  twitterAccountName: optionalNullableStringSchema,
});

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
    const createRequest = createAccountRequestSchema.parse(req.body);

    const createdAccount = await accountsService.createAccount({
      name: createRequest.name,
      accountTypeId: createRequest.accountTypeId,
      ownerUserId: createRequest.ownerUserId,
      affiliationId: createRequest.affiliationId,
      timezoneId: createRequest.timezoneId,
      firstYear: createRequest.firstYear,
      urls: createRequest.urls,
      socials: createRequest.socials,
    });

    res.status(201).json(createdAccount);
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
    const updateRequest = updateAccountRequestSchema.parse(req.body);

    const normalizedUpdate = {
      name: updateRequest.name,
      accountTypeId: updateRequest.accountTypeId,
      affiliationId: updateRequest.affiliationId,
      timezoneId: updateRequest.timezoneId,
      firstYear: updateRequest.firstYear,
      youtubeUserId:
        updateRequest.youtubeUserId ?? updateRequest.socials?.youtubeUserId ?? undefined,
      facebookFanPage:
        updateRequest.facebookFanPage ?? updateRequest.socials?.facebookFanPage ?? undefined,
      defaultVideo:
        updateRequest.defaultVideo ?? updateRequest.socials?.defaultVideo ?? undefined,
      autoPlayVideo:
        updateRequest.autoPlayVideo ?? updateRequest.socials?.autoPlayVideo ?? undefined,
      twitterAccountName:
        updateRequest.twitterAccountName ?? updateRequest.socials?.twitterAccountName ?? undefined,
    };

    const hasUpdates = Object.values(normalizedUpdate).some((value) => value !== undefined);

    if (!hasUpdates) {
      throw new ValidationError('At least one field to update is required');
    }

    const updatedAccount = await accountsService.updateAccount(accountId, normalizedUpdate);

    res.json(updatedAccount);
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
    await accountsService.deleteAccount(accountId);

    res.status(204).send();
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
    const accountName = await accountsService.getAccountName(accountId);

    res.json(accountName);
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
    const accountHeader = await accountsService.getAccountHeader(accountId);

    res.json(accountHeader);
  }),
);

export default router;
