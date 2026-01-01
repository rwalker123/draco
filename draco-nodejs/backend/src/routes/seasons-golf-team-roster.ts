import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { CreateGolfPlayerSchema, SignPlayerSchema } from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const golfRosterService = ServiceFactory.getGolfRosterService();
const routeProtection = ServiceFactory.getRouteProtection();

// GET /api/accounts/{accountId}/seasons/{seasonId}/golf/teams/{teamSeasonId}/roster
router.get(
  '/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const roster = await golfRosterService.getRoster(teamSeasonId);
    res.json(roster);
  }),
);

// POST /api/accounts/{accountId}/seasons/{seasonId}/golf/teams/{teamSeasonId}/roster
router.post(
  '/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamSeasonId, seasonId } = extractBigIntParams(req.params, 'teamSeasonId', 'seasonId');
    const playerData = CreateGolfPlayerSchema.parse(req.body);
    const entry = await golfRosterService.createAndSignPlayer(
      teamSeasonId,
      accountId,
      seasonId,
      playerData,
    );
    res.status(201).json(entry);
  }),
);

// POST /api/accounts/{accountId}/seasons/{seasonId}/golf/teams/{teamSeasonId}/roster/sign
router.post(
  '/sign',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamSeasonId, seasonId } = extractBigIntParams(req.params, 'teamSeasonId', 'seasonId');
    const signData = SignPlayerSchema.parse(req.body);
    const entry = await golfRosterService.signPlayer(teamSeasonId, accountId, seasonId, signData);
    res.status(201).json(entry);
  }),
);

export default router;
