import { Router, Request, Response, NextFunction } from 'express';
import { extractTeamParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { TeamRequestValidator } from '../utils/teamValidators.js';
import { StatsResponseFormatter, TeamResponseFormatter } from '../utils/responseFormatters.js';
import { validateTeamSeasonBasic } from '../utils/teamValidation.js';
import prisma from '../lib/prisma.js';
import { ServiceFactory } from '../services/serviceFactory.js';

const router = Router({ mergeParams: true });
const teamStatsService = ServiceFactory.getTeamStatsService();

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/record
 * Get win/loss/tie record for a team season
 */
router.get(
  '/:teamSeasonId/record',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');

      const record = await teamStatsService.getTeamRecord(teamSeasonId);
      const response = TeamResponseFormatter.formatTeamRecordResponse(
        teamSeasonId.toString(),
        record,
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/games
 * Get upcoming and/or recent games for a team season
 */
router.get(
  '/:teamSeasonId/games',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
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
    } catch (error) {
      console.error('Team games route error:', error);
      next(error);
    }
  },
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/batting-stats
 * Get batting statistics for a specific team
 */
router.get(
  '/:teamSeasonId/batting-stats',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

      // Verify the team season exists and belongs to this account and season
      await validateTeamSeasonBasic(prisma, teamSeasonId, seasonId, accountId);

      const battingStats = await teamStatsService.getTeamBattingStats(teamSeasonId, accountId);
      const response = StatsResponseFormatter.formatBattingStatsResponse(battingStats);

      res.json(response);
    } catch (error) {
      console.error('Team batting stats route error:', error);
      next(error);
    }
  },
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/teams/:teamSeasonId/pitching-stats
 * Get pitching statistics for a specific team
 */
router.get(
  '/:teamSeasonId/pitching-stats',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
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
    } catch (error) {
      console.error('Team pitching stats route error:', error);
      next(error);
    }
  },
);

export default router;
