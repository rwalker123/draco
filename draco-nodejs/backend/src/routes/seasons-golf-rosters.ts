import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { UpdateGolfPlayerSchema, ReleasePlayerSchema } from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const golfRosterService = ServiceFactory.getGolfRosterService();
const routeProtection = ServiceFactory.getRouteProtection();

// GET /api/accounts/{accountId}/seasons/{seasonId}/golf/rosters/substitutes
router.get(
  '/substitutes',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { seasonId } = extractBigIntParams(req.params, 'seasonId');
    const subs = await golfRosterService.getSubstitutesForSeason(seasonId);
    res.json(subs);
  }),
);

// GET /api/accounts/{accountId}/seasons/{seasonId}/golf/rosters/available
router.get(
  '/available',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { seasonId } = extractBigIntParams(req.params, 'seasonId');
    const players = await golfRosterService.getAvailablePlayers(accountId, seasonId);
    res.json(players);
  }),
);

// GET /api/accounts/{accountId}/seasons/{seasonId}/golf/rosters/{rosterId}
router.get(
  '/:rosterId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rosterId } = extractBigIntParams(req.params, 'rosterId');
    const entry = await golfRosterService.getRosterEntry(rosterId);
    res.json(entry);
  }),
);

// PUT /api/accounts/{accountId}/seasons/{seasonId}/golf/rosters/{rosterId}
router.put(
  '/:rosterId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rosterId } = extractBigIntParams(req.params, 'rosterId');
    const playerData = UpdateGolfPlayerSchema.parse(req.body);
    const entry = await golfRosterService.updatePlayer(rosterId, playerData);
    res.json(entry);
  }),
);

// POST /api/accounts/{accountId}/seasons/{seasonId}/golf/rosters/{rosterId}/release
router.post(
  '/:rosterId/release',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rosterId, seasonId } = extractBigIntParams(req.params, 'rosterId', 'seasonId');
    const releaseData = ReleasePlayerSchema.parse(req.body);
    await golfRosterService.releasePlayer(rosterId, seasonId, releaseData);
    res.status(204).send();
  }),
);

// DELETE /api/accounts/{accountId}/seasons/{seasonId}/golf/rosters/{rosterId}
router.delete(
  '/:rosterId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rosterId } = extractBigIntParams(req.params, 'rosterId');
    await golfRosterService.deletePlayer(rosterId);
    res.status(204).send();
  }),
);

export default router;
