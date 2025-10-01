// Account Resources Management Routes for Draco Sports Manager
// Handles teams, leagues, fields, and umpires for accounts

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthenticationError } from '../utils/customErrors.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { PagingSchema, UpsertFieldSchema } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const teamService = ServiceFactory.getTeamService();
const fieldService = ServiceFactory.getFieldService();
const umpireService = ServiceFactory.getUmpireService();

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

    return teamService.getUserTeams(BigInt(accountId), userId).then((teams) => {
      res.json(teams);
    });
  }),
);

/**
 * GET /api/accounts/:accountId/fields
 * Get all fields for an account (public endpoint) - with pagination
 */
router.get(
  '/:accountId/fields',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const pagingParams = PagingSchema.parse(req.query);

    const fields = await fieldService.listFields(accountId, pagingParams);

    res.json(fields);
  }),
);

/**
 * POST /api/accounts/:accountId/fields
 * Create a new field for an account
 */
router.post(
  '/:accountId/fields',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const fieldData = UpsertFieldSchema.parse(req.body);

    const field = await fieldService.createField(accountId, fieldData);

    res.status(201).json(field);
  }),
);

/**
 * PUT /api/accounts/:accountId/fields/:fieldId
 * Update a field
 */
router.put(
  '/:accountId/fields/:fieldId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, fieldId } = extractBigIntParams(req.params, 'accountId', 'fieldId');
    const fieldData = UpsertFieldSchema.parse(req.body);

    const field = await fieldService.updateField(accountId, fieldId, fieldData);

    res.json(field);
  }),
);

/**
 * DELETE /api/accounts/:accountId/fields/:fieldId
 * Delete a field
 */
router.delete(
  '/:accountId/fields/:fieldId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, fieldId } = extractBigIntParams(req.params, 'accountId', 'fieldId');

    const field = await fieldService.deleteField(accountId, fieldId);

    res.json(field);
  }),
);

/**
 * GET /api/accounts/:accountId/umpires
 * Get all umpires for an account - with pagination
 */
router.get(
  '/:accountId/umpires',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.umpires.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const pagingParams = PagingSchema.parse(req.query);

    const umpires = await umpireService.listUmpires(accountId, pagingParams);

    res.json(umpires);
  }),
);

export default router;
