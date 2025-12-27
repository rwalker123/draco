import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const golfStatsService = ServiceFactory.getGolfStatsService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/flight/:flightId/leaders',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flightId } = extractBigIntParams(req.params, 'flightId');
    const leaders = await golfStatsService.getFlightLeaders(flightId);
    res.json(leaders);
  }),
);

router.get(
  '/flight/:flightId/low-scores',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flightId } = extractBigIntParams(req.params, 'flightId');
    const type = (req.query.type as 'actual' | 'net') || 'actual';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const lowScores = await golfStatsService.getLowScoreLeaders(flightId, type, limit);
    res.json(lowScores);
  }),
);

router.get(
  '/flight/:flightId/scoring-averages',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flightId } = extractBigIntParams(req.params, 'flightId');
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const averages = await golfStatsService.getScoringAverages(flightId, limit);
    res.json(averages);
  }),
);

router.get(
  '/flight/:flightId/skins',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flightId } = extractBigIntParams(req.params, 'flightId');
    const skins = await golfStatsService.getSkinsLeaders(flightId);
    res.json(skins);
  }),
);

export default router;
