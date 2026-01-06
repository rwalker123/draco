import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import {
  CreateGolfMatchSchema,
  UpdateGolfMatchSchema,
  SubmitMatchResultsSchema,
} from '@draco/shared-schemas';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const golfMatchService = ServiceFactory.getGolfMatchService();
const golfScoreService = ServiceFactory.getGolfScoreService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/season/:seasonId',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { seasonId } = extractBigIntParams(req.params, 'seasonId');

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const matches = await golfMatchService.getMatchesForSeason(seasonId, startDate, endDate);
    res.json(matches);
  }),
);

router.get(
  '/season/:seasonId/upcoming',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { seasonId } = extractBigIntParams(req.params, 'seasonId');
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const matches = await golfMatchService.getUpcomingMatches(seasonId, limit);
    res.json(matches);
  }),
);

router.get(
  '/season/:seasonId/completed',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { seasonId } = extractBigIntParams(req.params, 'seasonId');
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const matches = await golfMatchService.getCompletedMatches(seasonId, limit);
    res.json(matches);
  }),
);

router.get(
  '/season/:seasonId/date/:date',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { seasonId } = extractBigIntParams(req.params, 'seasonId');
    const { date } = req.params;
    const matches = await golfMatchService.getMatchesByDate(seasonId, date);
    res.json(matches);
  }),
);

router.get(
  '/flight/:flightId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flightId } = extractBigIntParams(req.params, 'flightId');
    const matches = await golfMatchService.getMatchesForFlight(flightId);
    res.json(matches);
  }),
);

router.get(
  '/team/:teamSeasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const matches = await golfMatchService.getMatchesForTeam(teamSeasonId);
    res.json(matches);
  }),
);

router.get(
  '/:matchId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    const match = await golfMatchService.getMatchById(matchId);
    res.json(match);
  }),
);

router.get(
  '/:matchId/scores',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    const match = await golfMatchService.getMatchWithScores(matchId);
    res.json(match);
  }),
);

router.post(
  '/:matchId/results',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    const resultsData = SubmitMatchResultsSchema.parse(req.body);
    const match = await golfScoreService.submitMatchResults(matchId, resultsData);
    res.status(201).json(match);
  }),
);

router.post(
  '/season/:seasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { seasonId } = extractBigIntParams(req.params, 'seasonId');
    const matchData = CreateGolfMatchSchema.parse(req.body);
    const match = await golfMatchService.createMatch(seasonId, matchData);
    res.status(201).json(match);
  }),
);

router.put(
  '/:matchId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    const matchData = UpdateGolfMatchSchema.parse(req.body);
    const match = await golfMatchService.updateMatch(matchId, matchData);
    res.json(match);
  }),
);

router.put(
  '/:matchId/status',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    const { status } = req.body;
    const match = await golfMatchService.updateMatchStatus(matchId, status);
    res.json(match);
  }),
);

router.delete(
  '/:matchId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    await golfMatchService.deleteMatch(matchId);
    res.status(204).send();
  }),
);

export default router;
