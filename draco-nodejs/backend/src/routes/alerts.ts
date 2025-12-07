import { Router, Request, Response } from 'express';
import { UpsertAlertSchema } from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';

const router = Router();
const routeProtection = ServiceFactory.getRouteProtection();
const alertService = ServiceFactory.getAlertService();

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const alerts = await alertService.listActiveAlerts();
    res.json({ alerts });
  }),
);

router.get(
  '/all',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const alerts = await alertService.listAlerts();
    res.json({ alerts });
  }),
);

router.get(
  '/:alertId',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { alertId } = extractBigIntParams(req.params, 'alertId');
    const alert = await alertService.getAlert(alertId);
    res.json(alert);
  }),
);

router.post(
  '/',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const payload = UpsertAlertSchema.parse(req.body);
    const alert = await alertService.createAlert(payload);
    res.status(201).json(alert);
  }),
);

router.put(
  '/:alertId',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { alertId } = extractBigIntParams(req.params, 'alertId');
    const payload = UpsertAlertSchema.parse(req.body);

    const alert = await alertService.updateAlert(alertId, payload);
    res.json(alert);
  }),
);

router.delete(
  '/:alertId',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { alertId } = extractBigIntParams(req.params, 'alertId');

    await alertService.deleteAlert(alertId);
    res.status(204).send();
  }),
);

export default router;
