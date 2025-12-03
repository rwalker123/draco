// League Management Routes
// Handles league CRUD operations and provides available leagues for account management

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { UpsertLeagueSchema } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const leagueService = ServiceFactory.getLeagueService();

/**
 * GET /api/accounts/:accountId/leagues
 * Returns all leagues for the specified account (requires authentication).
 */
router.get(
  '/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    const leagues = await leagueService.listAccountLeagues(accountId);

    res.json(leagues);
  }),
);

/**
 * GET /api/accounts/:accountId/leagues/all-time
 * Get unique leagues for all-time statistics (public endpoint)
 */
router.get(
  '/all-time',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    const leagues = await leagueService.listLeaguesWithSeasons(accountId);

    res.json(leagues);
  }),
);

/**
 * GET /api/accounts/:accountId/leagues/:leagueId
 * Retrieves details for a single league within the account.
 */
router.get(
  '/:leagueId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, leagueId } = extractBigIntParams(req.params, 'accountId', 'leagueId');

    const league = await leagueService.getLeague(accountId, leagueId);

    res.json(league);
  }),
);

/**
 * POST /api/accounts/:accountId/leagues
 * Creates a new league for the account (requires account admin privileges).
 */
router.post(
  '/',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    const input = UpsertLeagueSchema.parse(req.body);

    const league = await leagueService.createLeague(accountId, input);

    res.status(201).json(league);
  }),
);

/**
 * PUT /api/accounts/:accountId/leagues/:leagueId
 * Update league name (requires AccountAdmin or Administrator)
 */
router.put(
  '/:leagueId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, leagueId } = extractBigIntParams(req.params, 'accountId', 'leagueId');

    const input = UpsertLeagueSchema.parse(req.body);

    const league = await leagueService.updateLeague(accountId, leagueId, input);

    res.json(league);
  }),
);

/**
 * DELETE /api/accounts/:accountId/leagues/:leagueId
 * Delete a league (requires AccountAdmin or Administrator)
 * Note: This will fail if the league has any related data
 */
router.delete(
  '/:leagueId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, leagueId } = extractBigIntParams(req.params, 'accountId', 'leagueId');

    await leagueService.deleteLeague(accountId, leagueId);

    res.json(true);
  }),
);

export default router;
