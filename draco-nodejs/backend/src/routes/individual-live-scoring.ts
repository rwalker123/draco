import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { getSSEManager } from '../services/sseManager.js';
import { getSseTicketManager } from '../services/sseTicketManager.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  StartIndividualLiveScoringSchema,
  SubmitIndividualLiveHoleScoreSchema,
  AdvanceIndividualLiveHoleSchema,
} from '@draco/shared-schemas';

const router = Router({ mergeParams: true });

router.get(
  '/golfer/live/status',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const service = ServiceFactory.getIndividualLiveScoringService();
    const status = await service.getSessionStatus(accountId);
    res.json(status);
  }),
);

router.get(
  '/golfer/live',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const service = ServiceFactory.getIndividualLiveScoringService();
    const state = await service.getSessionState(accountId);
    if (!state) {
      res.status(404).json({ error: 'No active live scoring session for this account' });
      return;
    }
    res.json(state);
  }),
);

router.post(
  '/golfer/live/ticket',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const userId = req.user!.id;

    const ticketManager = getSseTicketManager();
    const { ticket, expiresIn } = ticketManager.createAccountTicket(userId, accountId);

    res.status(201).json({ ticket, expiresIn });
  }),
);

router.get(
  '/golfer/live/subscribe',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const ticket = req.query.ticket as string | undefined;

    if (!ticket) {
      res.status(401).json({ error: 'Ticket required for SSE subscription' });
      return;
    }

    const ticketManager = getSseTicketManager();
    const validation = ticketManager.validateAccountTicket(ticket, accountId);

    if (!validation.valid) {
      res.status(401).json({ error: validation.reason });
      return;
    }

    const userId = validation.userId;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.flushHeaders();

    const clientId = uuidv4();
    const sseManager = getSSEManager();

    sseManager.addAccountClient(clientId, res, userId, accountId);

    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ clientId, accountId: accountId.toString() })}\n\n`);

    const service = ServiceFactory.getIndividualLiveScoringService();
    const sessionState = await service.getSessionState(accountId);
    if (sessionState) {
      res.write(`event: state\n`);
      res.write(`data: ${JSON.stringify(sessionState)}\n\n`);
    } else {
      res.write(`event: no_session\n`);
      res.write(`data: ${JSON.stringify({ accountId: accountId.toString() })}\n\n`);
    }

    req.on('close', () => {
      sseManager.removeClient(clientId);
    });
  }),
);

router.post(
  '/golfer/live/start',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const userId = req.user!.id;

    const data = StartIndividualLiveScoringSchema.parse(req.body);
    const service = ServiceFactory.getIndividualLiveScoringService();
    const state = await service.startSession(accountId, userId, data);
    res.status(201).json(state);
  }),
);

router.post(
  '/golfer/live/scores',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const userId = req.user!.id;

    const data = SubmitIndividualLiveHoleScoreSchema.parse(req.body);
    const service = ServiceFactory.getIndividualLiveScoringService();
    const score = await service.submitScore(accountId, userId, data);
    res.status(201).json(score);
  }),
);

router.post(
  '/golfer/live/advance',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const userId = req.user!.id;

    const data = AdvanceIndividualLiveHoleSchema.parse(req.body);
    const service = ServiceFactory.getIndividualLiveScoringService();
    await service.advanceHole(accountId, userId, data.holeNumber);
    res.status(200).json({ success: true });
  }),
);

router.post(
  '/golfer/live/finalize',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const userId = req.user!.id;

    const service = ServiceFactory.getIndividualLiveScoringService();
    await service.finalizeSession(accountId, userId);
    res.status(200).json({ success: true });
  }),
);

router.post(
  '/golfer/live/stop',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const userId = req.user!.id;

    const service = ServiceFactory.getIndividualLiveScoringService();
    await service.stopSession(accountId, userId);
    res.status(200).json({ success: true });
  }),
);

export default router;
