import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { CreateGolfClosestToPinSchema, UpdateGolfClosestToPinSchema } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const golfClosestToPinService = ServiceFactory.getGolfClosestToPinService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/match/:matchId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    const entries = await golfClosestToPinService.getForMatch(matchId);
    res.json(entries);
  }),
);

router.get(
  '/flight/:flightId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flightId } = extractBigIntParams(req.params, 'flightId');
    const entries = await golfClosestToPinService.getForFlight(flightId);
    res.json(entries);
  }),
);

router.post(
  '/match/:matchId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    const data = CreateGolfClosestToPinSchema.parse(req.body);
    const userId = req.user!.id;
    const entry = await golfClosestToPinService.create(matchId, data, userId);
    res.status(201).json(entry);
  }),
);

router.put(
  '/:ctpId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { ctpId } = extractBigIntParams(req.params, 'ctpId');
    const data = UpdateGolfClosestToPinSchema.parse(req.body);
    const entry = await golfClosestToPinService.update(ctpId, data, accountId);
    res.json(entry);
  }),
);

router.delete(
  '/:ctpId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { ctpId } = extractBigIntParams(req.params, 'ctpId');
    await golfClosestToPinService.delete(ctpId, accountId);
    res.sendStatus(204);
  }),
);

export default router;
