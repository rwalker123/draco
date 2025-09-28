import prisma from '../lib/prisma.js';
import { Router, Request, Response, NextFunction } from 'express';
import { extractTeamParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { TeamRequestValidator } from '../utils/teamValidators.js';
import { StatsResponseFormatter } from '../responseFormatters/index.js';
import { validateTeamSeasonBasic } from '../utils/teamValidation.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '@/utils/asyncHandler.js';

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
    const { accountId } = extractTeamParams(req.params);
    const { seasonId, teamSeasonId } = extractBigIntParams(req.params, 'seasonId', 'teamSeasonId');

    const team = await teamService.getTeamSeasonDetails(teamSeasonId, seasonId, accountId);
    const record = await teamStatsService.getTeamRecord(teamSeasonId);

    res.json({
      ...team,
      record,
    });
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
    const { limitNum, includeUpcoming, includeRecent } =
      TeamRequestValidator.validateGameQueryParams(req);

    // Validate team/season/account relationship first
    await validateTeamSeasonBasic(prisma, teamSeasonId, seasonId, accountId);

    const gamesData = await teamStatsService.getTeamGames(teamSeasonId, seasonId, accountId, {
      includeUpcoming,
      includeRecent,
      limit: limitNum,
    });

    const response = StatsResponseFormatter.formatTeamGamesResponse(gamesData);
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
    await validateTeamSeasonBasic(prisma, teamSeasonId, seasonId, accountId);

    const battingStats = await teamStatsService.getTeamBattingStats(teamSeasonId, accountId);
    const response = StatsResponseFormatter.formatBattingStatsResponse(battingStats);

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
    await validateTeamSeasonBasic(prisma, teamSeasonId, seasonId, accountId);

    const pitchingStats = await teamStatsService.getTeamPitchingStats(
      teamSeasonId,
      seasonId,
      accountId,
    );
    const response = StatsResponseFormatter.formatPitchingStatsResponse(pitchingStats);

    res.json(response);
  }),
);

export default router;
