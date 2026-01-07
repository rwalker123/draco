import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import { CreateGolfTeamSchema, UpdateGolfTeamSchema } from '@draco/shared-schemas';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const golfTeamService = ServiceFactory.getGolfTeamService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/season/:seasonId',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { seasonId } = extractBigIntParams(req.params, 'seasonId');
    const teams = await golfTeamService.getTeamsForSeason(seasonId);
    res.json(teams);
  }),
);

router.get(
  '/flight/:flightId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flightId } = extractBigIntParams(req.params, 'flightId');
    const teams = await golfTeamService.getTeamsForFlight(flightId);
    res.json(teams);
  }),
);

router.get(
  '/season/:seasonId/team/:teamSeasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const team = await golfTeamService.getTeamById(teamSeasonId);
    res.json(team);
  }),
);

router.get(
  '/season/:seasonId/team/:teamSeasonId/roster',
  authenticateToken,
  routeProtection.enforceTeamBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const team = await golfTeamService.getTeamWithRoster(teamSeasonId);
    res.json(team);
  }),
);

router.post(
  '/flight/:flightId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flightId } = extractBigIntParams(req.params, 'flightId');
    const teamData = CreateGolfTeamSchema.parse(req.body);
    const team = await golfTeamService.createTeam(flightId, teamData);
    res.status(201).json(team);
  }),
);

router.put(
  '/season/:seasonId/team/:teamSeasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const teamData = UpdateGolfTeamSchema.parse(req.body);
    const team = await golfTeamService.updateTeam(teamSeasonId, teamData);
    res.json(team);
  }),
);

router.delete(
  '/season/:seasonId/team/:teamSeasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    await golfTeamService.deleteTeam(teamSeasonId);
    res.status(204).send();
  }),
);

export default router;
