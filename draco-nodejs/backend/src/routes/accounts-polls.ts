import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  extractAccountParams,
  extractBigIntParams,
  ParamsObject,
} from '../utils/paramExtraction.js';
import {
  AccountPollType,
  CreatePollSchema,
  CreatePollType,
  PollVoteRequestSchema,
  PollVoteRequestType,
  UpdatePollSchema,
  UpdatePollType,
} from '@draco/shared-schemas';
import { ValidationError } from '../utils/customErrors.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const pollService = ServiceFactory.getPollService();

const extractPollParams = (params: ParamsObject) => {
  const { accountId, pollId } = extractBigIntParams(params, 'accountId', 'pollId');
  return { accountId, pollId };
};

/**
 * Lists all polls for the specified account. Only callers with poll manager
 * privileges (Account Admins or Team Admins) can access this endpoint.
 */
router.get(
  '/:accountId/polls',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePollManagerAccess(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const polls: AccountPollType[] = await pollService.listAccountPolls(accountId);
    res.json(polls);
  }),
);

/**
 * Creates a new poll for the account using the supplied question and options.
 * Requires poll manager privileges scoped to the account boundary.
 */
router.post(
  '/:accountId/polls',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePollManagerAccess(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload: CreatePollType = CreatePollSchema.parse(req.body);
    const poll = await pollService.createPoll(accountId, payload);
    res.status(201).json(poll);
  }),
);

/**
 * Updates the poll identified by pollId, allowing changes to the question,
 * activation status, option text, and option ordering. Poll manager access is
 * required.
 */
router.put(
  '/:accountId/polls/:pollId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePollManagerAccess(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, pollId } = extractPollParams(req.params);
    const payload: UpdatePollType = UpdatePollSchema.parse(req.body);
    const poll = await pollService.updatePoll(accountId, pollId, payload);
    res.json(poll);
  }),
);

/**
 * Deletes the specified poll. Only poll managers for the account may perform
 * this destructive action.
 */
router.delete(
  '/:accountId/polls/:pollId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePollManagerAccess(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, pollId } = extractPollParams(req.params);
    await pollService.deletePoll(accountId, pollId);
    res.status(204).send();
  }),
);

/**
 * Returns the set of active polls for the authenticated contact within the
 * account. The caller must resolve to a contact for the account boundary.
 */
router.get(
  '/:accountId/polls/active',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const contactId = req.accountBoundary?.contactId;

    if (!contactId) {
      throw new ValidationError('Contact context is required to view polls');
    }

    const polls = await pollService.listActivePolls(accountId, contactId);
    res.json(polls);
  }),
);

/**
 * Records or updates the authenticated contact's vote on the specified poll.
 * Enforces the account boundary to ensure the voter belongs to the account.
 */
router.post(
  '/:accountId/polls/:pollId/vote',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, pollId } = extractPollParams(req.params);
    const contactId = req.accountBoundary?.contactId;

    if (!contactId) {
      throw new ValidationError('Contact context is required to vote');
    }

    const payload: PollVoteRequestType = PollVoteRequestSchema.parse(req.body);
    const optionId = BigInt(payload.optionId);
    const poll = await pollService.castVote(accountId, pollId, contactId, optionId);
    res.json(poll);
  }),
);

export default router;
