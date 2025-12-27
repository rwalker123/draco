import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import {
  CreateGolfPlayerSchema,
  UpdateGolfPlayerSchema,
  SignPlayerSchema,
  ReleasePlayerSchema,
} from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const golfRosterService = ServiceFactory.getGolfRosterService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/team/:teamSeasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const roster = await golfRosterService.getRoster(teamSeasonId);
    res.json(roster);
  }),
);

router.get(
  '/substitutes/season/:seasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { seasonId } = extractBigIntParams(req.params, 'seasonId');
    const subs = await golfRosterService.getSubstitutesForSeason(seasonId);
    res.json(subs);
  }),
);

router.get(
  '/substitutes/flight/:flightId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flightId } = extractBigIntParams(req.params, 'flightId');
    const subs = await golfRosterService.getSubstitutesForFlight(flightId);
    res.json(subs);
  }),
);

router.get(
  '/available/:seasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { seasonId } = extractBigIntParams(req.params, 'seasonId');
    const players = await golfRosterService.getAvailablePlayers(accountId, seasonId);
    res.json(players);
  }),
);

router.get(
  '/:rosterId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rosterId } = extractBigIntParams(req.params, 'rosterId');
    const entry = await golfRosterService.getRosterEntry(rosterId);
    res.json(entry);
  }),
);

router.post(
  '/team/:teamSeasonId/create',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const seasonId = BigInt(req.body.seasonId);
    const playerData = CreateGolfPlayerSchema.parse(req.body);
    const entry = await golfRosterService.createAndSignPlayer(
      teamSeasonId,
      accountId,
      seasonId,
      playerData,
    );
    res.status(201).json(entry);
  }),
);

router.post(
  '/team/:teamSeasonId/sign',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const seasonId = BigInt(req.body.seasonId);
    const signData = SignPlayerSchema.parse(req.body);
    const entry = await golfRosterService.signPlayer(teamSeasonId, accountId, seasonId, signData);
    res.status(201).json(entry);
  }),
);

router.put(
  '/:rosterId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rosterId } = extractBigIntParams(req.params, 'rosterId');
    const playerData = UpdateGolfPlayerSchema.parse(req.body);
    const entry = await golfRosterService.updatePlayer(rosterId, playerData);
    res.json(entry);
  }),
);

router.post(
  '/:rosterId/release',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rosterId } = extractBigIntParams(req.params, 'rosterId');
    const seasonId = BigInt(req.body.seasonId);
    const releaseData = ReleasePlayerSchema.parse(req.body);
    await golfRosterService.releasePlayer(rosterId, seasonId, releaseData);
    res.status(204).send();
  }),
);

router.delete(
  '/:rosterId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rosterId } = extractBigIntParams(req.params, 'rosterId');
    await golfRosterService.deletePlayer(rosterId);
    res.status(204).send();
  }),
);

export default router;
