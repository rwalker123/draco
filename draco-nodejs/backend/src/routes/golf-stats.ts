import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { extractBigIntParams, extractContactParams } from '../utils/paramExtraction.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { NotFoundError } from '../utils/customErrors.js';
import { RegenerateStatsRequestSchema } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const golfStatsService = ServiceFactory.getGolfStatsService();
const golfPlayerStatsService = ServiceFactory.getGolfPlayerStatsService();
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
    const type = (req.query.type as 'actual' | 'net') || 'actual';
    const weekNumber = req.query.weekNumber
      ? parseInt(req.query.weekNumber as string, 10)
      : undefined;
    const skins =
      type === 'net'
        ? await golfStatsService.calculateNetSkinsLeaders(flightId, weekNumber)
        : await golfStatsService.getSkinsLeaders(flightId, weekNumber);
    res.json(skins);
  }),
);

router.get(
  '/flight/:flightId/score-types',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flightId } = extractBigIntParams(req.params, 'flightId');
    const leaders = await golfStatsService.getScoreTypeLeaders(flightId);
    res.json(leaders);
  }),
);

router.get(
  '/flight/:flightId/putt-contest',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flightId } = extractBigIntParams(req.params, 'flightId');
    const weekNumber = req.query.weekNumber
      ? parseInt(req.query.weekNumber as string, 10)
      : undefined;
    const results = await golfStatsService.getPuttContestResults(flightId, weekNumber);
    res.json(results);
  }),
);

router.get(
  '/player/:contactId/detailed-stats',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, contactId } = extractContactParams(req.params);

    const contact = await ServiceFactory.getContactService().getContact(accountId, contactId);

    const golfer = await RepositoryFactory.getGolferRepository().findByContactId(contactId);
    if (!golfer) {
      throw new NotFoundError('Golfer not found');
    }

    const stats = await golfPlayerStatsService.getPlayerDetailedStats(
      contactId,
      golfer.id,
      contact.firstName,
      contact.lastName,
    );
    res.json(stats);
  }),
);

router.post(
  '/regenerate',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = RegenerateStatsRequestSchema.parse(req.body);
    const result = await golfStatsService.regenerateStats(BigInt(data.leagueSeasonId), {
      regenerateGir: data.regenerateGir,
      regenerateWeekNumbers: data.regenerateWeekNumbers,
      weekBoundary: data.weekBoundary,
      timeZone: data.timeZone,
      recalculateMatchPoints: data.recalculateMatchPoints,
    });
    res.json(result);
  }),
);

export default router;
