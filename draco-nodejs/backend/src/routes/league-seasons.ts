// LeagueSeason Management Routes
// Handles league-season relationships, divisions, and teams within leagues

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  extractBigIntParams,
  extractLeagueSeasonParams,
  extractSeasonParams,
  getStringParam,
} from '../utils/paramExtraction.js';
import { ValidationError } from '../utils/customErrors.js';
import { LeagueSeasonQueryParamsSchema, UpsertDivisionSeasonSchema } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const leagueService = ServiceFactory.getLeagueService();
const teamService = ServiceFactory.getTeamService();

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/leagues
 * Get leagues for a specific season with optional teams and divisions data
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);

    const queryParams = LeagueSeasonQueryParamsSchema.parse(req.query);
    const includeTeams = Boolean(queryParams.includeTeams);

    const leagueSetup = await leagueService.getSeasonLeagueSetup(accountId, seasonId, {
      includeTeams,
      includeUnassignedTeams: Boolean(queryParams.includeUnassignedTeams),
      includePlayerCounts: Boolean(queryParams.includePlayerCounts),
      includeManagerCounts: Boolean(queryParams.includeManagerCounts),
    });

    res.json(leagueSetup);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId
 * Get specific league season with its divisions and teams
 */
router.get(
  '/:leagueSeasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId } = extractLeagueSeasonParams(req.params);

    const leagueSeason = await leagueService.getLeagueSeason(accountId, seasonId, leagueSeasonId);

    res.json(leagueSeason);
  }),
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/leagues
 * Add a league to a season
 */
router.post(
  '/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);
    const { leagueId } = req.body as { leagueId?: string | number | bigint };

    if (leagueId === undefined || leagueId === null) {
      throw new ValidationError('League ID is required');
    }

    let normalizedLeagueId: bigint;
    try {
      normalizedLeagueId = BigInt(leagueId);
    } catch {
      throw new ValidationError('League ID is invalid');
    }

    const result = await leagueService.addLeagueToSeason(accountId, seasonId, normalizedLeagueId);

    res.status(201).json(result);
  }),
);

/**
 * DELETE /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId
 * Remove a league from a season
 */
router.delete(
  '/:leagueSeasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId } = extractLeagueSeasonParams(req.params);

    const result = await leagueService.removeLeagueFromSeason(accountId, seasonId, leagueSeasonId);

    res.json(result);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions
 * Get all divisions for a league season
 */
router.get(
  '/:leagueSeasonId/divisions',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId } = extractLeagueSeasonParams(req.params);

    const divisions = await leagueService.listDivisionSeasons(accountId, seasonId, leagueSeasonId);

    res.json(divisions);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/games
 * Get all games for a specific league season
 */
router.get(
  '/:leagueSeasonId/games',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId } = extractLeagueSeasonParams(req.params);
    const startDate = getStringParam(req.query.startDate);
    const endDate = getStringParam(req.query.endDate);
    const teamId = getStringParam(req.query.teamId);

    const options: {
      startDate?: Date;
      endDate?: Date;
      teamId?: bigint;
    } = {};

    if (startDate && endDate) {
      options.startDate = new Date(startDate);
      options.endDate = new Date(endDate);
    }

    if (teamId) {
      try {
        options.teamId = BigInt(teamId);
      } catch {
        throw new ValidationError('teamId must be a valid number');
      }
    }

    const games = await leagueService.listLeagueSeasonGames(
      accountId,
      seasonId,
      leagueSeasonId,
      options,
    );

    res.json(games);
  }),
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions
 * Add a division to a league season (supports both existing divisions and creating new ones)
 */
router.post(
  '/:leagueSeasonId/divisions',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId } = extractLeagueSeasonParams(req.params);

    const input = UpsertDivisionSeasonSchema.parse(req.body);

    const result = await leagueService.addDivisionSeason(
      accountId,
      seasonId,
      leagueSeasonId,
      input,
    );

    res.status(201).json(result);
  }),
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions/:divisionSeasonId
 * Update a division's name and priority within a league season
 */
router.put(
  '/:leagueSeasonId/divisions/:divisionSeasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId, divisionSeasonId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'leagueSeasonId',
      'divisionSeasonId',
    );

    const input = UpsertDivisionSeasonSchema.parse(req.body);

    const result = await leagueService.updateDivisionSeason(
      accountId,
      seasonId,
      leagueSeasonId,
      divisionSeasonId,
      input,
    );

    res.status(200).json(result);
  }),
);

/**
 * DELETE /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions/:divisionSeasonId
 * Remove a division from a league season
 */
router.delete(
  '/:leagueSeasonId/divisions/:divisionSeasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId, divisionSeasonId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'leagueSeasonId',
      'divisionSeasonId',
    );

    await leagueService.removeDivisionSeason(accountId, seasonId, leagueSeasonId, divisionSeasonId);

    res.json(true);
  }),
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/teams
 * Create a new team within a league season.
 */
router.post(
  '/:leagueSeasonId/teams',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId } = extractLeagueSeasonParams(req.params);
    const { name } = req.body as { name?: string };

    const teamSeason = await teamService.createTeamSeason(
      accountId,
      seasonId,
      leagueSeasonId,
      name ?? '',
    );

    res.status(201).json(teamSeason);
  }),
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/teams/:teamSeasonId/assign-division
 * Assign a team to a division within a league season
 */
router.put(
  '/:leagueSeasonId/teams/:teamSeasonId/assign-division',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId, teamSeasonId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'leagueSeasonId',
      'teamSeasonId',
    );

    const { divisionSeasonId } = req.body as { divisionSeasonId?: string | number | bigint };

    if (divisionSeasonId === undefined || divisionSeasonId === null) {
      throw new ValidationError('DivisionSeasonId is required');
    }

    let normalizedDivisionSeasonId: bigint;
    try {
      normalizedDivisionSeasonId = BigInt(divisionSeasonId);
    } catch {
      throw new ValidationError('DivisionSeasonId must be a valid number');
    }

    await leagueService.assignTeamToDivision(
      accountId,
      seasonId,
      leagueSeasonId,
      teamSeasonId,
      normalizedDivisionSeasonId,
    );

    res.json(true);
  }),
);

/**
 * DELETE /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/teams/:teamSeasonId/remove-from-division
 * Remove a team from its current division (make it unassigned)
 */
router.delete(
  '/:leagueSeasonId/teams/:teamSeasonId/remove-from-division',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId, teamSeasonId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'leagueSeasonId',
      'teamSeasonId',
    );

    await leagueService.removeTeamFromDivision(accountId, seasonId, leagueSeasonId, teamSeasonId);

    res.json(true);
  }),
);

export default router;
