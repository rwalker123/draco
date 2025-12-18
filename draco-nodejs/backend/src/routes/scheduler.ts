import { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams } from '../utils/paramExtraction.js';
import { ValidationError } from '../utils/customErrors.js';
import { SchedulerApplyRequestSchema, SchedulerProblemSpecSchema } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const schedulerEngineService = ServiceFactory.getSchedulerEngineService();
const schedulerApplyService = ServiceFactory.getSchedulerApplyService();

/**
 * POST /api/accounts/:accountId/scheduler/solve
 * Solves a scheduling problem and returns assignments with metrics.
 * Requires `account.games.manage` permission.
 */
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

    const problemSpec = SchedulerProblemSpecSchema.parse(body);
    const rawIdempotencyKey = req.header('Idempotency-Key') ?? req.header('X-Idempotency-Key');
    const idempotencyKey =
      typeof rawIdempotencyKey === 'string' && rawIdempotencyKey.trim().length > 0
        ? rawIdempotencyKey.trim()
        : undefined;
    const result = schedulerEngineService.solve(problemSpec, { accountId, idempotencyKey });

    res.json(result);
  }),
);

router.post(
  '/apply',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const body = req.body;

    if (!body || typeof body !== 'object') {
      throw new ValidationError('Request body must include an apply request');
    }

    const request = SchedulerApplyRequestSchema.parse(body);
    const result = await schedulerApplyService.applyProposal(accountId, request);
    res.json(result);
  }),
);

export default router;
