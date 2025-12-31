import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractLeagueSeasonParams } from '../utils/paramExtraction.js';
import { UpdateGolfLeagueSetupSchema } from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const golfLeagueService = ServiceFactory.getGolfLeagueService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/',
  authenticateToken,
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const accounts = await golfLeagueService.getGolfAccounts();
    res.json(accounts);
  }),
);

router.get(
  '/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/setup',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, leagueSeasonId } = extractLeagueSeasonParams(req.params);
    const setup = await golfLeagueService.getLeagueSetup(accountId, leagueSeasonId);
    res.json(setup);
  }),
);

router.put(
  '/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/setup',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, leagueSeasonId } = extractLeagueSeasonParams(req.params);
    const updateData = UpdateGolfLeagueSetupSchema.parse(req.body);
    const setup = await golfLeagueService.updateLeagueSetup(accountId, leagueSeasonId, updateData);
    res.json(setup);
  }),
);

export default router;
