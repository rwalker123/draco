// Account Settings & Metadata Routes
// Handles URLs, Twitter settings, account types, and affiliations

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import {
  AccountBlueskySettingsSchema,
  AccountInstagramSettingsSchema,
  AccountTwitterSettingsSchema,
  CreateAccountUrlSchema,
  AccountSettingUpdateRequestSchema,
  AccountSettingKeySchema,
} from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const accountsService = ServiceFactory.getAccountsService();
const accountSettingsService = ServiceFactory.getAccountSettingsService();

/**
 * GET /api/accounts/:accountId/settings/public
 * Publicly accessible account settings (read-only, no auth)
 */
router.get(
  '/:accountId/settings/public',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const settings = await accountSettingsService.getAccountSettings(accountId);
    res.json(settings);
  }),
);

/**
 * GET /api/accounts/:accountId/settings
 * Returns account-level feature toggle configuration + metadata (requires auth)
 */
router.get(
  '/:accountId/settings',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.settings.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const settings = await accountSettingsService.getAccountSettings(accountId);
    res.json(settings);
  }),
);

/**
 * PUT /api/accounts/:accountId/settings/:settingKey
 * Updates a single account setting and returns the full settings payload
 */
router.put(
  '/:accountId/settings/:settingKey',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.settings.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const parsedKey = AccountSettingKeySchema.parse(req.params.settingKey);
    const payload = AccountSettingUpdateRequestSchema.parse(req.body);

    const setting = await accountSettingsService.updateAccountSetting(
      accountId,
      parsedKey,
      payload.value,
    );

    res.json(setting);
  }),
);

/**
 * GET /api/accounts/types
 * Get all account types
 */
router.get(
  '/types',
  authenticateToken,
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    return accountsService.getAccountTypes().then((accountTypes) => {
      res.json(accountTypes);
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
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    return accountsService.getAccountAffiliations().then((affiliations) => {
      res.json(affiliations);
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
    const twitterSettings = AccountTwitterSettingsSchema.parse(req.body);

    return accountsService
      .updateAccountTwitterSettings(accountId, twitterSettings)
      .then((updatedAccount) => {
        res.json(updatedAccount);
      });
  }),
);

/**
 * PUT /api/accounts/:accountId/instagram
 * Update Instagram settings (Account Admin or Administrator)
 */
router.put(
  '/:accountId/instagram',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const instagramSettings = AccountInstagramSettingsSchema.parse(req.body);

    return accountsService
      .updateAccountInstagramSettings(accountId, instagramSettings)
      .then((updatedAccount) => {
        res.json(updatedAccount);
      });
  }),
);

/**
 * PUT /api/accounts/:accountId/bluesky
 * Update Bluesky settings (Account Admin or Administrator)
 */
router.put(
  '/:accountId/bluesky',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const blueskySettings = AccountBlueskySettingsSchema.parse(req.body);

    return accountsService
      .updateAccountBlueskySettings(accountId, blueskySettings)
      .then((updatedAccount) => {
        res.json(updatedAccount);
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
    return accountsService.getAccountUrls(accountId).then((urls) => {
      res.json(urls);
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
    const urlData = CreateAccountUrlSchema.parse(req.body);

    return accountsService.addAccountUrl(accountId, urlData).then((createdUrl) => {
      res.status(201).json(createdUrl);
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
    const urlData = CreateAccountUrlSchema.parse(req.body);

    return accountsService.updateAccountUrl(accountId, urlId, urlData).then((updatedUrl) => {
      res.json(updatedUrl);
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

    await accountsService.deleteAccountUrl(accountId, urlId);

    res.status(204).send();
  }),
);

export default router;
