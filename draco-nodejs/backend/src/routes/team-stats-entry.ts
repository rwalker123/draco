import { Router, Request, Response } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import {
  CreateGameBattingStatSchema,
  CreateGamePitchingStatSchema,
  UpdateGameAttendanceSchema,
  UpdateGameBattingStatSchema,
  UpdateGamePitchingStatSchema,
} from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const statsEntryService = ServiceFactory.getStatsEntryService();
const routeProtection = ServiceFactory.getRouteProtection();

const teamStatMiddlewares = [
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.enforceTeamBoundary(),
  routeProtection.requirePermission('team.manage'),
];

const teamStatReadMiddlewares = [optionalAuth];

router.get(
  '/:teamSeasonId/stat-entry/games',
  teamStatReadMiddlewares,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
    );

    const games = await statsEntryService.listCompletedGames(accountId, seasonId, teamSeasonId);
    res.json(games);
  }),
);

router.get(
  '/:teamSeasonId/stat-entry/games/:gameId/batting',
  teamStatReadMiddlewares,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, teamSeasonId, gameId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
      'gameId',
    );

    const stats = await statsEntryService.getGameBattingStats(
      accountId,
      seasonId,
      teamSeasonId,
      gameId,
    );
    res.json(stats);
  }),
);

router.post(
  '/:teamSeasonId/stat-entry/games/:gameId/batting',
  teamStatMiddlewares,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, teamSeasonId, gameId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
      'gameId',
    );
    const payload = CreateGameBattingStatSchema.parse(req.body);

    const stat = await statsEntryService.createGameBattingStat(
      accountId,
      seasonId,
      teamSeasonId,
      gameId,
      payload,
    );
    res.status(201).json(stat);
  }),
);

router.put(
  '/:teamSeasonId/stat-entry/games/:gameId/batting/:statId',
  teamStatMiddlewares,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, teamSeasonId, gameId, statId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
      'gameId',
      'statId',
    );
    const payload = UpdateGameBattingStatSchema.parse(req.body);

    const stat = await statsEntryService.updateGameBattingStat(
      accountId,
      seasonId,
      teamSeasonId,
      gameId,
      statId,
      payload,
    );
    res.json(stat);
  }),
);

router.delete(
  '/:teamSeasonId/stat-entry/games/:gameId/batting/:statId',
  teamStatMiddlewares,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, teamSeasonId, gameId, statId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
      'gameId',
      'statId',
    );

    await statsEntryService.deleteGameBattingStat(
      accountId,
      seasonId,
      teamSeasonId,
      gameId,
      statId,
    );
    res.status(204).send();
  }),
);

router.get(
  '/:teamSeasonId/stat-entry/games/:gameId/pitching',
  teamStatReadMiddlewares,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, teamSeasonId, gameId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
      'gameId',
    );

    const stats = await statsEntryService.getGamePitchingStats(
      accountId,
      seasonId,
      teamSeasonId,
      gameId,
    );
    res.json(stats);
  }),
);

router.post(
  '/:teamSeasonId/stat-entry/games/:gameId/pitching',
  teamStatMiddlewares,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, teamSeasonId, gameId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
      'gameId',
    );
    const payload = CreateGamePitchingStatSchema.parse(req.body);

    const stat = await statsEntryService.createGamePitchingStat(
      accountId,
      seasonId,
      teamSeasonId,
      gameId,
      payload,
    );
    res.status(201).json(stat);
  }),
);

router.put(
  '/:teamSeasonId/stat-entry/games/:gameId/pitching/:statId',
  teamStatMiddlewares,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, teamSeasonId, gameId, statId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
      'gameId',
      'statId',
    );
    const payload = UpdateGamePitchingStatSchema.parse(req.body);

    const stat = await statsEntryService.updateGamePitchingStat(
      accountId,
      seasonId,
      teamSeasonId,
      gameId,
      statId,
      payload,
    );
    res.json(stat);
  }),
);

router.delete(
  '/:teamSeasonId/stat-entry/games/:gameId/pitching/:statId',
  teamStatMiddlewares,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, teamSeasonId, gameId, statId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
      'gameId',
      'statId',
    );

    await statsEntryService.deleteGamePitchingStat(
      accountId,
      seasonId,
      teamSeasonId,
      gameId,
      statId,
    );
    res.status(204).send();
  }),
);

router.get(
  '/:teamSeasonId/stat-entry/games/:gameId/attendance',
  teamStatReadMiddlewares,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, teamSeasonId, gameId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
      'gameId',
    );

    const attendance = await statsEntryService.getGameAttendance(
      accountId,
      seasonId,
      teamSeasonId,
      gameId,
    );
    res.json(attendance);
  }),
);

router.put(
  '/:teamSeasonId/stat-entry/games/:gameId/attendance',
  teamStatMiddlewares,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, teamSeasonId, gameId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
      'gameId',
    );
    const payload = UpdateGameAttendanceSchema.parse(req.body);

    const attendance = await statsEntryService.updateGameAttendance(
      accountId,
      seasonId,
      teamSeasonId,
      gameId,
      payload,
    );
    res.json(attendance);
  }),
);

export default router;
