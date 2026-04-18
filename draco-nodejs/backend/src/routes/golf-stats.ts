import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import {
  extractAccountParams,
  extractBigIntParams,
  extractContactParams,
} from '../utils/paramExtraction.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/customErrors.js';
import { RegenerateStatsRequestSchema } from '@draco/shared-schemas';

function parseScoreType(value: unknown): 'actual' | 'net' {
  if (value === 'net') return 'net';
  return 'actual';
}

function parsePositiveInt(value: unknown, defaultValue: number, max: number): number {
  if (value === undefined || value === null || value === '') return defaultValue;
  const parsed = parseInt(String(value), 10);
  if (isNaN(parsed) || parsed < 1 || parsed > max) {
    throw new ValidationError(`Invalid numeric parameter: ${String(value)}`);
  }
  return parsed;
}

function parseOptionalPositiveInt(value: unknown, max: number): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = parseInt(String(value), 10);
  if (isNaN(parsed) || parsed < 1 || parsed > max) {
    throw new ValidationError(`Invalid numeric parameter: ${String(value)}`);
  }
  return parsed;
}

const MAX_LEADERBOARD_LIMIT = 100;
const MAX_WEEK_NUMBER = 52;

const router = Router({ mergeParams: true });
const golfStatsService = ServiceFactory.getGolfStatsService();
const golfPlayerStatsService = ServiceFactory.getGolfPlayerStatsService();
const routeProtection = ServiceFactory.getRouteProtection();
const golfLeagueRepository = RepositoryFactory.getGolfLeagueRepository();

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
    const type = parseScoreType(req.query.type);
    const limit = parsePositiveInt(req.query.limit, 10, MAX_LEADERBOARD_LIMIT);
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
    const limit = parsePositiveInt(req.query.limit, 20, MAX_LEADERBOARD_LIMIT);
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
    const type = parseScoreType(req.query.type);
    const weekNumber = parseOptionalPositiveInt(req.query.weekNumber, MAX_WEEK_NUMBER);
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
    const weekNumber = parseOptionalPositiveInt(req.query.weekNumber, MAX_WEEK_NUMBER);
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
    const { accountId } = extractAccountParams(req.params);
    const data = RegenerateStatsRequestSchema.parse(req.body);

    const leagueSetup = await golfLeagueRepository.findByLeagueSeasonId(
      BigInt(data.leagueSeasonId),
    );
    if (!leagueSetup || leagueSetup.accountid !== accountId) {
      throw new AuthorizationError('League season does not belong to this account');
    }

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
