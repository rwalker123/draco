import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { CreateGolfFlightSchema, UpdateGolfFlightSchema } from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const golfFlightService = ServiceFactory.getGolfFlightService();
const golfHandicapService = ServiceFactory.getGolfHandicapService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/season/:seasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { seasonId } = extractBigIntParams(req.params, 'seasonId');
    const flights = await golfFlightService.getFlightsForSeason(seasonId);
    res.json(flights);
  }),
);

router.get(
  '/:flightId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flightId } = extractBigIntParams(req.params, 'flightId');
    const flight = await golfFlightService.getFlightById(flightId);
    res.json(flight);
  }),
);

router.get(
  '/:flightId/handicaps',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flightId } = extractBigIntParams(req.params, 'flightId');
    const handicaps = await golfHandicapService.getLeagueHandicaps(flightId);
    res.json(handicaps);
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
    const flightData = CreateGolfFlightSchema.parse(req.body);
    const flight = await golfFlightService.createFlight(accountId, seasonId, flightData);
    res.status(201).json(flight);
  }),
);

router.put(
  '/:flightId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { flightId } = extractBigIntParams(req.params, 'flightId');
    const flightData = UpdateGolfFlightSchema.parse(req.body);
    const flight = await golfFlightService.updateFlight(flightId, accountId, flightData);
    res.json(flight);
  }),
);

router.delete(
  '/:flightId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flightId } = extractBigIntParams(req.params, 'flightId');
    await golfFlightService.deleteFlight(flightId);
    res.status(204).send();
  }),
);

export default router;
