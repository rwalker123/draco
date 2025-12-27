import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { CreateGolfTeamSchema, UpdateGolfTeamSchema } from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const golfTeamService = ServiceFactory.getGolfTeamService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/season/:seasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { seasonId } = extractBigIntParams(req.params, 'seasonId');
    const teams = await golfTeamService.getTeamsForSeason(seasonId);
    res.json(teams);
  }),
);

router.get(
  '/season/:seasonId/unassigned',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { seasonId } = extractBigIntParams(req.params, 'seasonId');
    const teams = await golfTeamService.getUnassignedTeams(seasonId);
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
  '/:teamSeasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const team = await golfTeamService.getTeamById(teamSeasonId);
    res.json(team);
  }),
);

router.get(
  '/:teamSeasonId/roster',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const team = await golfTeamService.getTeamWithRoster(teamSeasonId);
    res.json(team);
  }),
);

router.post(
  '/season/:seasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { seasonId } = extractBigIntParams(req.params, 'seasonId');
    const teamData = CreateGolfTeamSchema.parse(req.body);
    const team = await golfTeamService.createTeam(seasonId, accountId, teamData);
    res.status(201).json(team);
  }),
);

router.put(
  '/:teamSeasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const teamData = UpdateGolfTeamSchema.parse(req.body);
    const team = await golfTeamService.updateTeam(teamSeasonId, accountId, teamData);
    res.json(team);
  }),
);

router.put(
  '/:teamSeasonId/flight/:flightId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { teamSeasonId, flightId } = extractBigIntParams(req.params, 'teamSeasonId', 'flightId');
    const team = await golfTeamService.assignTeamToFlight(teamSeasonId, flightId);
    res.json(team);
  }),
);

router.delete(
  '/:teamSeasonId/flight',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const team = await golfTeamService.assignTeamToFlight(teamSeasonId, null);
    res.json(team);
  }),
);

router.delete(
  '/:teamSeasonId',
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
