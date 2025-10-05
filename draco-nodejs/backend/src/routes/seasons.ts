import { Router, Request, Response } from 'express';
import { UpsertSeasonSchema } from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractSeasonParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const seasonService = ServiceFactory.getSeasonService();

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const includeDivisions = req.query.includeDivisions === 'true';

    const seasons = await seasonService.listAccountSeasons(accountId, includeDivisions);

    res.json(seasons);
  }),
);

router.get(
  '/current',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    const season = await seasonService.getCurrentSeason(accountId);

    res.json(season);
  }),
);

router.get(
  '/:seasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);

    const season = await seasonService.getSeason(accountId, seasonId);

    res.json(season);
  }),
);

router.post(
  '/',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const seasonInput = UpsertSeasonSchema.parse(req.body);

    const season = await seasonService.createSeason(accountId, seasonInput);

    res.status(201).json(season);
  }),
);

router.put(
  '/:seasonId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);
    const seasonInput = UpsertSeasonSchema.parse(req.body);

    const season = await seasonService.updateSeason(accountId, seasonId, seasonInput);

    res.json(season);
  }),
);

router.post(
  '/:seasonId/copy',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);

    const season = await seasonService.copySeason(accountId, seasonId);

    res.status(201).json(season);
  }),
);

router.post(
  '/:seasonId/set-current',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);

    const season = await seasonService.setCurrentSeason(accountId, seasonId);

    res.json(season);
  }),
);

router.delete(
  '/:seasonId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);

    await seasonService.deleteSeason(accountId, seasonId);

    res.json(true);
  }),
);

router.get(
  '/:seasonId/participants/count',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);

    const participantCount = await seasonService.getSeasonParticipantCount(accountId, seasonId);

    res.json(participantCount);
  }),
);

export default router;
