// Core Account Routes
// Handles basic account operations: search, retrieval, creation, updates, deletion

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { accountCreationRateLimit, signupRateLimit } from '../middleware/rateLimitMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import {
  AccountDomainLookupHeadersSchema,
  AccountDetailsQuerySchema,
  AccountSearchQuerySchema,
  CreateAccountSchema,
  UpdateAccountSchema,
  ContactValidationWithSignInSchema,
  CreateIndividualGolfAccountSchema,
  CreateAuthenticatedGolfAccountSchema,
} from '@draco/shared-schemas';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/customErrors.js';
import { extractAccountParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const accountsService = ServiceFactory.getAccountsService();
const routeProtection = ServiceFactory.getRouteProtection();
const registrationService = ServiceFactory.getRegistrationService();
const turnstileService = ServiceFactory.getTurnstileService();

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
 * Create new account (Administrator only with Turnstile verification)
 */
router.post(
  '/',
  authenticateToken,
  routeProtection.requireAdministrator(),
  accountCreationRateLimit,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await turnstileService.assertValid(req.get(turnstileService.getHeaderName()), req.ip);

    const createRequest = CreateAccountSchema.parse(req.body);

    if (!createRequest.ownerContact) {
      throw new ValidationError('Owner contact information is required');
    }

    const createdAccount = await accountsService.createAccount(
      req!.user!.id,
      req!.user!.username,
      createRequest,
    );

    res.status(201).json(createdAccount);
  }),
);

/**
 * POST /api/accounts/individual-golf
 * Create individual golf account with user registration (unauthenticated)
 */
router.post(
  '/individual-golf',
  signupRateLimit,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await turnstileService.assertValid(req.get(turnstileService.getHeaderName()), req.ip);

    const payload = CreateIndividualGolfAccountSchema.parse(req.body);
    const result = await accountsService.createIndividualGolfAccount(payload);

    res.status(201).json(result);
  }),
);

/**
 * POST /api/accounts/individual-golf/authenticated
 * Create individual golf account for an already authenticated user
 */
router.post(
  '/individual-golf/authenticated',
  authenticateToken,
  accountCreationRateLimit,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const payload = CreateAuthenticatedGolfAccountSchema.parse(req.body);
    const result = await accountsService.createAuthenticatedGolfAccount(
      req.user!.id,
      req.user!.username,
      payload,
    );

    res.status(201).json(result);
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
    const updateRequest = UpdateAccountSchema.parse(req.body);

    const hasUpdates = Object.values(updateRequest).some((value) => value !== undefined);

    if (!hasUpdates) {
      throw new ValidationError('At least one field to update is required');
    }

    const updatedAccount = await accountsService.updateAccount(accountId, updateRequest);

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
  routeProtection.enforceAccountOwner(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    await accountsService.deleteAccount(accountId);

    res.status(204).send();
  }),
);

/**
 * DELETE /api/accounts/:accountId/individual-golf
 * Delete an individual golf account (and optionally the user)
 */
router.delete(
  '/:accountId/individual-golf',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const userId = req.user!.id;
    const { deleteUser } = z.object({ deleteUser: z.boolean().optional() }).parse(req.body);

    await accountsService.deleteIndividualGolfAccount(accountId, userId, deleteUser ?? false);
    res.status(200).json({ success: true, message: 'Account deleted successfully' });
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

/**
 * POST /api/accounts/:accountId/registration
 * Register a new user or existing user
 * Query param "mode" must be 'newUser' or 'existingUser'
 * Body must match ContactValidationWithSignInSchema
 */
router.post(
  '/:accountId/registration',
  signupRateLimit,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { mode } = req.query || {};

    if (mode !== 'newUser' && mode !== 'existingUser') {
      throw new ValidationError("Mode must be 'newUser' or 'existingUser'");
    }

    const input = ContactValidationWithSignInSchema.parse(req.body);

    if (mode === 'newUser') {
      await turnstileService.assertValid(req.get(turnstileService.getHeaderName()), req.ip);
      const result = await registrationService.registerAndCreateContactNewUser(accountId, input);
      res.status(201).json(result);
    } else {
      const result = await registrationService.loginAndCreateContactExistingUser(accountId, input);
      res.status(201).json(result);
    }
  }),
);

export default router;
