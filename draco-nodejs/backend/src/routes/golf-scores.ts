import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import { SubmitMatchScoresSchema } from '@draco/shared-schemas';
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
  '/player/:contactId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { contactId } = extractBigIntParams(req.params, 'contactId');
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const scores = await golfScoreService.getScoresForPlayer(contactId, limit);
    res.json(scores);
  }),
);

router.get(
  '/player/:contactId/season/:seasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { contactId, seasonId } = extractBigIntParams(req.params, 'contactId', 'seasonId');
    const scores = await golfScoreService.getPlayerSeasonScores(contactId, seasonId);
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

router.post(
  '/match/:matchId/team/:teamId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId, teamId } = extractBigIntParams(req.params, 'matchId', 'teamId');
    const scoresData = SubmitMatchScoresSchema.parse(req.body);
    const scores = await golfScoreService.submitMatchScores(matchId, teamId, scoresData);
    res.status(201).json(scores);
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
