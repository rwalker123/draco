import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';

const router = Router();
const routeProtection = ServiceFactory.getRouteProtection();
const adminAnalyticsService = ServiceFactory.getAdminAnalyticsService();

router.get(
  '/summary',
  authenticateToken,
  routeProtection.requireAdministrator(),
  asyncHandler(async (_req: Request, res: Response) => {
    const summary = await adminAnalyticsService.getSummary();

    res.json(summary);
  }),
);

export default router;
