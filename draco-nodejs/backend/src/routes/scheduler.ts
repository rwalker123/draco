import { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams } from '../utils/paramExtraction.js';
import { ValidationError } from '../utils/customErrors.js';
import type { SchedulerProblemSpec } from '../types/scheduler.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const schedulerEngineService = ServiceFactory.getSchedulerEngineService();

router.post(
  '/solve',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const body = req.body;

    if (!body || typeof body !== 'object') {
      throw new ValidationError('Request body must include a problem specification');
    }

    const problemSpec = body as SchedulerProblemSpec;
    const runId = problemSpec.runId ?? `account_${accountId}_${Date.now()}`;

    const result = schedulerEngineService.solve({ ...problemSpec, runId });

    res.json(result);
  }),
);

export default router;
