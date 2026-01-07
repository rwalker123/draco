import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const golfStandingsService = ServiceFactory.getGolfStandingsService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/flight/:flightId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flightId } = extractBigIntParams(req.params, 'flightId');
    const standings = await golfStandingsService.getFlightStandings(flightId);
    res.json(standings);
  }),
);

router.get(
  '/season/:seasonId',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { seasonId } = extractBigIntParams(req.params, 'seasonId');
    const standings = await golfStandingsService.getLeagueStandings(seasonId);
    res.json(standings);
  }),
);

router.get(
  '/match/:matchId/points',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    const points = await golfStandingsService.calculateMatchPoints(matchId);
    res.json(points);
  }),
);

export default router;
