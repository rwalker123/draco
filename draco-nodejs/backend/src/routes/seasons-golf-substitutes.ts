import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { CreateGolfPlayerSchema, UpdateGolfPlayerSchema } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const golfRosterService = ServiceFactory.getGolfRosterService();
const routeProtection = ServiceFactory.getRouteProtection();

// GET /api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/golf/substitutes
router.get(
  '/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { leagueSeasonId } = extractBigIntParams(req.params, 'leagueSeasonId');
    const subs = await golfRosterService.getSubstitutesForLeague(leagueSeasonId);
    res.json(subs);
  }),
);

// POST /api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/golf/substitutes
router.post(
  '/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, leagueSeasonId } = extractBigIntParams(
      req.params,
      'accountId',
      'leagueSeasonId',
    );
    const data = CreateGolfPlayerSchema.parse(req.body);
    const sub = await golfRosterService.createSubstitute(leagueSeasonId, accountId, data);
    res.status(201).json(sub);
  }),
);

// PATCH /api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/golf/substitutes/{subId}
router.patch(
  '/:subId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { subId } = extractBigIntParams(req.params, 'subId');
    const data = UpdateGolfPlayerSchema.parse(req.body);
    const updated = await golfRosterService.updateSubstitute(subId, data);
    res.json(updated);
  }),
);

// DELETE /api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/golf/substitutes/{subId}
router.delete(
  '/:subId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { subId } = extractBigIntParams(req.params, 'subId');
    await golfRosterService.deleteSubstitute(subId);
    res.status(204).send();
  }),
);

export default router;
