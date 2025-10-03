import { Router, Request, Response, NextFunction } from 'express';
import { extractTeamParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { StatsResponseFormatter } from '../responseFormatters/index.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  PlayerBattingStatsBriefType,
  PlayerPitchingStatsBriefType,
  RecentGamesQuerySchema,
  RecentGamesType,
  TeamSeasonRecordType,
} from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const teamStatsService = ServiceFactory.getTeamStatsService();
const teamService = ServiceFactory.getTeamService();

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/record
 * Get win/loss/tie record for a team season
 */
router.get(
  '/:teamSeasonId/record',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
    );

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
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);
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
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/batting-stats
 * Get batting statistics for a specific team
 */
router.get(
  '/:teamSeasonId/batting-stats',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

    // Verify the team season exists and belongs to this account and season
    await teamService.validateTeamSeasonBasic(teamSeasonId, seasonId, accountId);

    const battingStats = await teamStatsService.getTeamBattingStats(teamSeasonId, accountId);
    const response: PlayerBattingStatsBriefType[] =
      StatsResponseFormatter.formatBattingStatsResponse(battingStats);

    res.json(response);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/pitching-stats
 * Get pitching statistics for a specific team
 */
router.get(
  '/:teamSeasonId/pitching-stats',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

    // Verify the team season exists and belongs to this account and season
    await teamService.validateTeamSeasonBasic(teamSeasonId, seasonId, accountId);

    const pitchingStats = await teamStatsService.getTeamPitchingStats(
      teamSeasonId,
      seasonId,
      accountId,
    );
    const response: PlayerPitchingStatsBriefType[] =
      StatsResponseFormatter.formatPitchingStatsResponse(pitchingStats);

    res.json(response);
  }),
);

export default router;
