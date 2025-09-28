// Account Settings & Metadata Routes for Draco Sports Manager
// Handles URLs, Twitter settings, account types, and affiliations

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { AccountTwitterSettingsSchema, CreateAccountUrlSchema } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const accountsService = ServiceFactory.getAccountsService();

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
