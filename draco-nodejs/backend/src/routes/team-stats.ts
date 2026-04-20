import { Router, Request, Response, NextFunction } from 'express';
import { extractTeamParams, ParamsObject } from '../utils/paramExtraction.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { PaginationHelper } from '../utils/pagination.js';
import { ValidationError } from '../utils/customErrors.js';
import {
  RecentGamesQuerySchema,
  RecentGamesType,
  TeamSeasonRecordType,
} from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const teamStatsService = ServiceFactory.getTeamStatsService();
const teamService = ServiceFactory.getTeamService();
const scheduleService = ServiceFactory.getScheduleService();

const parseTeamParams = (params: ParamsObject) => {
  try {
    return extractTeamParams(params);
  } catch {
    throw new ValidationError('Invalid accountId, seasonId, or teamSeasonId');
  }
};

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/record
 * Get win/loss/tie record for a team season
 */
router.get(
  '/:teamSeasonId/record',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = parseTeamParams(req.params);

    const result: TeamSeasonRecordType = await teamService.getTeamSeasonDetails(
      teamSeasonId,
      seasonId,
      accountId,
    );

    res.json(result);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/games
 * Get upcoming and/or recent games for a team season
 */
router.get(
  '/:teamSeasonId/games',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = parseTeamParams(req.params);
    const { limit, upcoming, recent } = RecentGamesQuerySchema.parse(req.query);

    // Validate team/season/account relationship first
    await teamService.validateTeamSeasonBasic(teamSeasonId, seasonId, accountId);

    const response: RecentGamesType = await teamStatsService.getTeamGames(
      teamSeasonId,
      seasonId,
      accountId,
      {
        includeUpcoming: upcoming,
        includeRecent: recent,
        limit: limit,
      },
    );

    res.json(response);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/schedule
 * Get the full season schedule for a team season with optional date and recap filters
 */
router.get(
  '/:teamSeasonId/schedule',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = parseTeamParams(req.params);
    const { startDate, endDate, hasRecap } = req.query;

    await teamService.validateTeamSeasonBasic(teamSeasonId, seasonId, accountId);

    const paginationParams = PaginationHelper.parseParams(req.query);

    const parsedStartDate = startDate ? new Date(String(startDate)) : undefined;
    const parsedEndDate = endDate ? new Date(String(endDate)) : undefined;

    if (parsedStartDate && Number.isNaN(parsedStartDate.getTime())) {
      throw new ValidationError('Invalid startDate');
    }

    if (parsedEndDate && Number.isNaN(parsedEndDate.getTime())) {
      throw new ValidationError('Invalid endDate');
    }

    const includeRecaps = String(hasRecap) === 'true';

    const response = await scheduleService.listSeasonGames(
      seasonId,
      {
        page: paginationParams.page,
        limit: paginationParams.limit,
        skip: paginationParams.skip,
        sortOrder: paginationParams.sortOrder,
      },
      {
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        teamId: teamSeasonId,
        hasRecap: includeRecaps ? true : undefined,
      },
    );

    res.json(response);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/batting-stats
 * Get batting statistics for a specific team
 */
router.get(
  '/:teamSeasonId/batting-stats',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = parseTeamParams(req.params);

    // Verify the team season exists and belongs to this account and season
    await teamService.validateTeamSeasonBasic(teamSeasonId, seasonId, accountId);

    const battingStats = await teamStatsService.getTeamBattingStats(teamSeasonId, accountId);
    res.json(battingStats);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/pitching-stats
 * Get pitching statistics for a specific team
 */
router.get(
  '/:teamSeasonId/pitching-stats',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = parseTeamParams(req.params);

    // Verify the team season exists and belongs to this account and season
    await teamService.validateTeamSeasonBasic(teamSeasonId, seasonId, accountId);

    const pitchingStats = await teamStatsService.getTeamPitchingStats(
      teamSeasonId,
      seasonId,
      accountId,
    );

    res.json(pitchingStats);
  }),
);

export default router;
