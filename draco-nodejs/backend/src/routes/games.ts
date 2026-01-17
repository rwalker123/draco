import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { PaginationHelper } from '../utils/pagination.js';
import {
  extractGameOnlyParams,
  extractGameParams,
  extractRecapParams,
  extractSeasonParams,
  ParamsObject,
} from '../utils/paramExtraction.js';
import { ValidationError, AuthenticationError } from '../utils/customErrors.js';
import {
  UpdateGameResultsSchema,
  UpsertGameRecapSchema,
  UpsertGameSchema,
} from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const scheduleService = ServiceFactory.getScheduleService();

const parseSeasonParams = (params: ParamsObject) => {
  try {
    return extractSeasonParams(params);
  } catch {
    throw new ValidationError('Invalid seasonId');
  }
};

const parseGameParams = (params: ParamsObject) => {
  try {
    return extractGameParams(params);
  } catch {
    throw new ValidationError('Invalid gameId');
  }
};

const parseGameOnlyParams = (params: ParamsObject) => {
  try {
    return extractGameOnlyParams(params);
  } catch {
    throw new ValidationError('Invalid gameId');
  }
};

/**
 * PUT /api/accounts/:accountId/games/:gameId/results
 * Update the results for a game
 */
router.put(
  '/:gameId/results',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, gameId } = parseGameOnlyParams(req.params);
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('User ID is required to update game results');
    }
    const input = UpdateGameResultsSchema.parse(req.body);

    const result = await scheduleService.updateGameResults(accountId, gameId, input, userId);

    res.json(result);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/games
 * Get games for a season
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { seasonId } = parseSeasonParams(req.params);
    const { startDate, endDate, teamId, hasRecap } = req.query;

    const paginationParams = PaginationHelper.parseParams(req.query);

    let parsedTeamId: bigint | undefined;
    if (teamId) {
      try {
        parsedTeamId = BigInt(String(teamId));
      } catch {
        throw new ValidationError('Invalid teamId');
      }
    }

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
        teamId: parsedTeamId,
        hasRecap: includeRecaps ? true : undefined,
      },
    );

    res.json(response);
  }),
);

// Create a new game
router.post(
  '/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = parseSeasonParams(req.params);
    const input = UpsertGameSchema.parse(req.body);

    const result = await scheduleService.createGame(accountId, seasonId, input);

    res.json(result);
  }),
);

// Update a game
router.put(
  '/:gameId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, gameId } = parseGameParams(req.params);
    const input = UpsertGameSchema.parse(req.body);

    const result = await scheduleService.updateGame(accountId, seasonId, gameId, input);

    res.json(result);
  }),
);

// Delete a game
router.delete(
  '/:gameId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, gameId } = parseGameParams(req.params);

    const result = await scheduleService.deleteGame(accountId, seasonId, gameId);

    res.json(result);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/games/:gameId/recap/:teamSeasonId
 * Get the recap for the current user's team for a specific game
 * Only accessible to team admins/coaches for the home or away team
 */
router.get(
  '/:gameId/recap/:teamSeasonId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, gameId, teamSeasonId } = extractRecapParams(req.params);

    const recap = await scheduleService.getGameRecap(accountId, seasonId, gameId, teamSeasonId);

    res.json(recap);
  }),
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/games/:gameId/recap/:teamSeasonId
 * Create or update the recap for the specified team for a specific game
 * Only accessible to team admins (contactrole) or team managers (teamseasonmanager) for the specified team
 * Body: { recap: string }
 */
router.put(
  '/:gameId/recap/:teamSeasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.enforceTeamBoundary(),
  routeProtection.requirePermission('team.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, gameId, teamSeasonId } = extractRecapParams(req.params);
    const userId = req.user?.id;

    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const input = UpsertGameRecapSchema.parse(req.body);

    const recap = await scheduleService.upsertGameRecap(
      accountId,
      seasonId,
      gameId,
      teamSeasonId,
      userId,
      input,
    );

    res.json(recap);
  }),
);

export default router;
