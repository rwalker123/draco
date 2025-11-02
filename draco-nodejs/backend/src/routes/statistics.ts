import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/customErrors.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import {
  BattingStatisticsFiltersSchema,
  LeaderCategoriesType,
  LeaderStatisticsFiltersSchema,
  PitchingStatisticsFiltersSchema,
} from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const statisticsService = ServiceFactory.getStatisticsService();

/**
 * GET /api/accounts/:accountId/statistics/leader-categories
 * Get configured leader categories for an account (public endpoint)
 */
router.get(
  '/leader-categories',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    const result: LeaderCategoriesType = await statisticsService.getLeaderCategories(accountId);

    res.json(result);
  }),
);

/**
 * GET /api/accounts/:accountId/statistics/batting/:leagueId
 * Get batting statistics for a league (public endpoint)
 */
router.get(
  '/batting/:leagueId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, leagueId } = extractBigIntParams(req.params, 'accountId', 'leagueId');

    const filters = BattingStatisticsFiltersSchema.parse(req.query);
    filters.leagueId = leagueId;

    const battingStats = await statisticsService.getBattingStats(accountId, filters);

    res.json(battingStats);
  }),
);

/**
 * GET /api/accounts/:accountId/statistics/pitching/:leagueId
 * Get pitching statistics for a league
 */
router.get(
  '/pitching/:leagueId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, leagueId } = extractBigIntParams(req.params, 'accountId', 'leagueId');

    const filters = PitchingStatisticsFiltersSchema.parse(req.query);
    filters.leagueId = leagueId;

    const pitchingStats = await statisticsService.getPitchingStats(accountId, filters);

    res.json(pitchingStats);
  }),
);

/**
 * GET /api/accounts/:accountId/statistics/players/:playerId
 * Retrieve career statistics for a single player
 */
router.get(
  '/players/:playerId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, playerId } = extractBigIntParams(req.params, 'accountId', 'playerId');

    const playerStats = await statisticsService.getPlayerCareerStatistics(accountId, playerId);

    res.json(playerStats);
  }),
);

/**
 * GET /api/accounts/:accountId/statistics/leaders/:leagueId
 *
 * Get statistical leaders for a specified category within a league.
 * Supports optional filtering by division and historical data.
 * The number of leaders returned can be limited via a query parameter.
 * This is a public endpoint.
 */
router.get(
  '/leaders/:leagueId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, leagueId } = extractBigIntParams(req.params, 'accountId', 'leagueId');
    const category = req.query.category as string;

    if (!category) {
      throw new ValidationError('Category parameter is required');
    }

    const filters = LeaderStatisticsFiltersSchema.parse(req.query);
    filters.leagueId = leagueId;

    const leaders = await statisticsService.getLeaders(accountId, category, filters);

    res.json(leaders);
  }),
);

export default router;
