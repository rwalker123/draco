import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { getSSEManager } from '../services/sseManager.js';
import { getSseTicketManager } from '../services/sseTicketManager.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import {
  StartLiveScoringSchema,
  SubmitLiveHoleScoreSchema,
  AdvanceHoleSchema,
  FinalizeLiveScoringSchema,
  StopLiveScoringSchema,
  GetLiveScoringTicketSchema,
} from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
const liveScoringService = ServiceFactory.getLiveScoringService();
const routeProtection = ServiceFactory.getRouteProtection();

router.get(
  '/:matchId/live/status',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    const status = await liveScoringService.getSessionStatus(matchId);
    res.json(status);
  }),
);

// Public endpoint - allows guests to view live scoring state (read-only)
router.get(
  '/:matchId/live',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    const state = await liveScoringService.getSessionState(matchId);
    if (!state) {
      res.status(404).json({ error: 'No active live scoring session for this match' });
      return;
    }
    res.json(state);
  }),
);

router.post(
  '/:matchId/live/ticket',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const userId = req.user!.id;
    const data = GetLiveScoringTicketSchema.parse(req.body);

    const ticketManager = getSseTicketManager();
    const { ticket, expiresIn } = ticketManager.createTicket(userId, matchId, accountId, data.role);

    res.status(201).json({ ticket, expiresIn });
  }),
);

router.get(
  '/:matchId/live/subscribe',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId, accountId } = extractBigIntParams(req.params, 'matchId', 'accountId');
    const ticket = req.query.ticket as string | undefined;

    if (!ticket) {
      res.status(401).json({ error: 'Ticket required for SSE subscription' });
      return;
    }

    const ticketManager = getSseTicketManager();
    const validation = ticketManager.validateTicket(ticket, matchId);

    if (!validation.valid) {
      res.status(401).json({ error: validation.reason });
      return;
    }

    if (validation.accountId !== accountId) {
      res.status(403).json({ error: 'Ticket not valid for this account' });
      return;
    }

    const userId = validation.userId;
    const role = validation.role;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.flushHeaders();

    const clientId = uuidv4();
    const sseManager = getSSEManager();

    sseManager.addClient(clientId, res, userId, matchId, role);

    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ clientId, matchId: matchId.toString() })}\n\n`);

    const sessionState = await liveScoringService.getSessionState(matchId);
    if (sessionState) {
      res.write(`event: state\n`);
      res.write(`data: ${JSON.stringify(sessionState)}\n\n`);
    } else {
      res.write(`event: no_session\n`);
      res.write(`data: ${JSON.stringify({ matchId: matchId.toString() })}\n\n`);
    }

    req.on('close', () => {
      sseManager.removeClient(clientId);
    });
  }),
);

router.post(
  '/:matchId/live/start',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const userId = req.user!.id;

    const data = StartLiveScoringSchema.parse(req.body);
    const state = await liveScoringService.startSession(matchId, userId, accountId, data);
    res.status(201).json(state);
  }),
);

router.post(
  '/:matchId/live/scores',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const userId = req.user!.id;

    const data = SubmitLiveHoleScoreSchema.parse(req.body);
    const score = await liveScoringService.submitScore(matchId, userId, accountId, data);
    res.status(201).json(score);
  }),
);

router.post(
  '/:matchId/live/advance',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const userId = req.user!.id;

    const data = AdvanceHoleSchema.parse(req.body);
    await liveScoringService.advanceHole(matchId, userId, accountId, data.holeNumber);
    res.status(200).json({ success: true });
  }),
);

router.post(
  '/:matchId/live/finalize',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const userId = req.user!.id;

    FinalizeLiveScoringSchema.parse(req.body);
    await liveScoringService.finalizeSession(matchId, userId, accountId);
    res.status(200).json({ success: true });
  }),
);

router.post(
  '/:matchId/live/stop',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = extractBigIntParams(req.params, 'matchId');
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const userId = req.user!.id;

    StopLiveScoringSchema.parse(req.body);
    await liveScoringService.stopSession(matchId, userId, accountId);
    res.status(200).json({ success: true });
  }),
);

// Public endpoint - no auth required (allows guests to see active live sessions)
router.get(
  '/live/active',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const sessions = await liveScoringService.getActiveSessionsForAccount(accountId);
    res.json(sessions);
  }),
);

export default router;
