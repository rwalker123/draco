import { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import { SchedulerFieldAvailabilityRuleUpsertSchema } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const schedulerFieldAvailabilityRulesService =
  ServiceFactory.getSchedulerFieldAvailabilityRulesService();

router.get(
  '/field-availability-rules',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractBigIntParams(req.params, 'accountId', 'seasonId');
    const rules = await schedulerFieldAvailabilityRulesService.listRules(accountId, seasonId);
    res.json(rules);
  }),
);

router.post(
  '/field-availability-rules',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractBigIntParams(req.params, 'accountId', 'seasonId');
    const input = SchedulerFieldAvailabilityRuleUpsertSchema.parse(req.body);
    const created = await schedulerFieldAvailabilityRulesService.createRule(
      accountId,
      seasonId,
      input,
    );
    res.status(201).json(created);
  }),
);

router.put(
  '/field-availability-rules/:ruleId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, ruleId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'ruleId',
    );
    const input = SchedulerFieldAvailabilityRuleUpsertSchema.parse(req.body);
    const updated = await schedulerFieldAvailabilityRulesService.updateRule(
      accountId,
      seasonId,
      ruleId,
      input,
    );
    res.json(updated);
  }),
);

router.delete(
  '/field-availability-rules/:ruleId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, ruleId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'ruleId',
    );
    const deleted = await schedulerFieldAvailabilityRulesService.deleteRule(
      accountId,
      seasonId,
      ruleId,
    );
    res.json(deleted);
  }),
);

export default router;
