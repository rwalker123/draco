import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const golfScoreService = ServiceFactory.getGolfScoreService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/match/:matchId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    const scores = await golfScoreService.getScoresForMatch(matchId);
    res.json(scores);
  }),
);

router.get(
  '/match/:matchId/team/:teamId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId, teamId } = extractBigIntParams(req.params, 'matchId', 'teamId');
    const scores = await golfScoreService.getScoresForTeamInMatch(matchId, teamId);
    res.json(scores);
  }),
);

router.get(
  '/player/:golferId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { golferId } = extractBigIntParams(req.params, 'golferId');
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const scores = await golfScoreService.getScoresForPlayer(golferId, limit);
    res.json(scores);
  }),
);

router.get(
  '/:scoreId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { scoreId } = extractBigIntParams(req.params, 'scoreId');
    const score = await golfScoreService.getScoreById(scoreId);
    res.json(score);
  }),
);

router.delete(
  '/match/:matchId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    await golfScoreService.deleteMatchScores(matchId);
    res.status(204).send();
  }),
);

export default router;
