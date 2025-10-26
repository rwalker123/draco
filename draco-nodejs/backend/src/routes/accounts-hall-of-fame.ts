import { Router, Request, Response } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { hofNominationRateLimit } from '../middleware/rateLimitMiddleware.js';
import {
  CreateHofMemberSchema,
  CreateHofMemberType,
  HofEligibleContactsQuerySchema,
  HofNominationQuerySchema,
  HofNominationInductSchema,
  HofNominationInductType,
  SubmitHofNominationSchema,
  SubmitHofNominationType,
  UpdateHofMemberSchema,
  UpdateHofMemberType,
  UpdateHofNominationSetupSchema,
  UpdateHofNominationSetupType,
  UpdateHofNominationSchema,
  UpdateHofNominationType,
} from '@draco/shared-schemas';
import { ValidationError } from '../utils/customErrors.js';

const router = Router({ mergeParams: true });

const routeProtection = ServiceFactory.getRouteProtection();
const hallOfFameService = ServiceFactory.getHallOfFameService();
const hofNominationService = ServiceFactory.getHofNominationService();
const hofSetupService = ServiceFactory.getHofSetupService();
const turnstileService = ServiceFactory.getTurnstileService();

const extractMemberParams = (params: Record<string, string | undefined>) => {
  const { accountId, memberId } = extractBigIntParams(params, 'accountId', 'memberId');
  return { accountId, memberId };
};

const extractNominationParams = (params: Record<string, string | undefined>) => {
  const { accountId, nominationId } = extractBigIntParams(params, 'accountId', 'nominationId');
  return { accountId, nominationId };
};

router.get(
  '/:accountId/hall-of-fame/classes',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const classes = await hallOfFameService.listClasses(accountId);
    res.json(classes);
  }),
);

router.get(
  '/:accountId/hall-of-fame/classes/:year',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const year = Number(req.params.year);
    if (!Number.isInteger(year)) {
      throw new ValidationError('Year must be an integer value.');
    }

    const hofClass = await hallOfFameService.getClass(accountId, year);
    res.json(hofClass);
  }),
);

router.get(
  '/:accountId/hall-of-fame/random-member',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const member = await hallOfFameService.getRandomMember(accountId);
    res.json(member);
  }),
);

router.get(
  '/:accountId/hall-of-fame/eligible-contacts',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const query = HofEligibleContactsQuerySchema.parse({
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    const eligibleContacts = await hallOfFameService.listEligibleContacts(accountId, query);
    res.json(eligibleContacts);
  }),
);

router.post(
  '/:accountId/hall-of-fame/members',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload: CreateHofMemberType = CreateHofMemberSchema.parse(req.body);
    const member = await hallOfFameService.createMember(accountId, payload);
    res.status(201).json(member);
  }),
);

router.put(
  '/:accountId/hall-of-fame/members/:memberId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, memberId } = extractMemberParams(req.params);
    const payload: UpdateHofMemberType = UpdateHofMemberSchema.parse(req.body);
    const member = await hallOfFameService.updateMember(accountId, memberId, payload);
    res.json(member);
  }),
);

router.delete(
  '/:accountId/hall-of-fame/members/:memberId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, memberId } = extractMemberParams(req.params);
    await hallOfFameService.deleteMember(accountId, memberId);
    res.status(204).send();
  }),
);

router.post(
  '/:accountId/hall-of-fame/nominations',
  hofNominationRateLimit,
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload: SubmitHofNominationType = SubmitHofNominationSchema.parse(req.body);
    const token = req.get(turnstileService.getHeaderName());
    await turnstileService.assertValid(token, req.ip);
    await hofNominationService.submitNomination(accountId, payload);
    res.status(201).send();
  }),
);

router.get(
  '/:accountId/hall-of-fame/nominations',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const query = HofNominationQuerySchema.parse({
      page: req.query.page,
      pageSize: req.query.pageSize,
    });
    const nominations = await hofNominationService.listNominations(accountId, query);
    res.json(nominations);
  }),
);

router.put(
  '/:accountId/hall-of-fame/nominations/:nominationId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, nominationId } = extractNominationParams(req.params);
    const payload: UpdateHofNominationType = UpdateHofNominationSchema.parse(req.body);
    const nomination = await hofNominationService.updateNomination(
      accountId,
      nominationId,
      payload,
    );
    res.json(nomination);
  }),
);

router.post(
  '/:accountId/hall-of-fame/nominations/:nominationId/induct',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, nominationId } = extractNominationParams(req.params);
    const payload: HofNominationInductType = HofNominationInductSchema.parse(req.body);
    const member = await hofNominationService.inductNomination(accountId, nominationId, payload);
    res.json(member);
  }),
);

router.delete(
  '/:accountId/hall-of-fame/nominations/:nominationId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, nominationId } = extractNominationParams(req.params);
    await hofNominationService.deleteNomination(accountId, nominationId);
    res.status(204).send();
  }),
);

router.get(
  '/:accountId/hall-of-fame/nomination-setup',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const setup = await hofSetupService.getSetup(accountId);
    res.json(setup);
  }),
);

router.put(
  '/:accountId/hall-of-fame/nomination-setup',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload: UpdateHofNominationSetupType = UpdateHofNominationSetupSchema.parse(req.body);
    const setup = await hofSetupService.updateSetup(accountId, payload);
    res.json(setup);
  }),
);

export default router;
