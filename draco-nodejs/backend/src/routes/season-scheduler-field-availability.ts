import { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import {
  SchedulerFieldAvailabilityRuleUpsertSchema,
  SchedulerFieldExclusionDateUpsertSchema,
  SchedulerSeasonSolveRequestSchema,
  SchedulerSeasonApplyRequestSchema,
} from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const schedulerFieldAvailabilityRulesService =
  ServiceFactory.getSchedulerFieldAvailabilityRulesService();
const schedulerFieldExclusionDatesService = ServiceFactory.getSchedulerFieldExclusionDatesService();
const schedulerProblemSpecService = ServiceFactory.getSchedulerProblemSpecService();
const schedulerEngineService = ServiceFactory.getSchedulerEngineService();
const schedulerSeasonApplyService = ServiceFactory.getSchedulerSeasonApplyService();

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

router.get(
  '/field-exclusion-dates',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractBigIntParams(req.params, 'accountId', 'seasonId');
    const exclusions = await schedulerFieldExclusionDatesService.listExclusions(
      accountId,
      seasonId,
    );
    res.json(exclusions);
  }),
);

router.get(
  '/problem-spec',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractBigIntParams(req.params, 'accountId', 'seasonId');
    const preview = await schedulerProblemSpecService.buildProblemSpecPreview(accountId, seasonId);
    res.json(preview);
  }),
);

router.post(
  '/solve',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractBigIntParams(req.params, 'accountId', 'seasonId');
    const request = SchedulerSeasonSolveRequestSchema.parse(req.body ?? {});
    const rawIdempotencyKey = req.header('Idempotency-Key') ?? req.header('X-Idempotency-Key');
    const idempotencyKey =
      typeof rawIdempotencyKey === 'string' && rawIdempotencyKey.trim().length > 0
        ? rawIdempotencyKey.trim()
        : undefined;

    const problemSpec = await schedulerProblemSpecService.buildProblemSpec(
      accountId,
      seasonId,
      request,
    );
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
    const { accountId, seasonId } = extractBigIntParams(req.params, 'accountId', 'seasonId');
    const request = SchedulerSeasonApplyRequestSchema.parse(req.body);
    const result = await schedulerSeasonApplyService.applySeasonProposal(
      accountId,
      seasonId,
      request,
    );
    res.json(result);
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

router.post(
  '/field-exclusion-dates',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractBigIntParams(req.params, 'accountId', 'seasonId');
    const input = SchedulerFieldExclusionDateUpsertSchema.parse(req.body);
    const created = await schedulerFieldExclusionDatesService.createExclusion(
      accountId,
      seasonId,
      input,
    );
    res.status(201).json(created);
  }),
);

router.put(
  '/field-exclusion-dates/:exclusionId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, exclusionId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'exclusionId',
    );
    const input = SchedulerFieldExclusionDateUpsertSchema.parse(req.body);
    const updated = await schedulerFieldExclusionDatesService.updateExclusion(
      accountId,
      seasonId,
      exclusionId,
      input,
    );
    res.json(updated);
  }),
);

router.delete(
  '/field-exclusion-dates/:exclusionId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, exclusionId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'exclusionId',
    );
    const deleted = await schedulerFieldExclusionDatesService.deleteExclusion(
      accountId,
      seasonId,
      exclusionId,
    );
    res.json(deleted);
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
