import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { getSSEManager } from '../services/sseManager.js';
import { getSseTicketManager } from '../services/sseTicketManager.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import {
  StartBaseballLiveScoringSchema,
  SubmitBaseballLiveInningScoreSchema,
  AdvanceBaseballInningSchema,
  FinalizeBaseballLiveScoringSchema,
  StopBaseballLiveScoringSchema,
} from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { AuthorizationError } from '../utils/customErrors.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const roleService = ServiceFactory.getRoleService();

function getBaseballLiveScoringService() {
  return ServiceFactory.getBaseballLiveScoringService();
}

/**
 * Validates that the user can score this game.
 * User must have account.games.manage permission OR be TeamAdmin for one of the game's teams.
 */
async function validateGameScoringPermission(
  userId: string,
  accountId: bigint,
  gameId: bigint,
): Promise<void> {
  // First check if user has account-level permission
  const hasAccountPermission = await roleService.hasPermission(userId, 'account.games.manage', {
    accountId,
  });
  if (hasAccountPermission) {
    return;
  }

  // Check if user is TeamAdmin for either team in this game
  const scheduleRepository = RepositoryFactory.getScheduleRepository();
  const game = await scheduleRepository.findById(gameId);
  if (!game) {
    throw new AuthorizationError('Game not found');
  }

  // Check TeamAdmin permission for home team
  const hasHomeTeamPermission = await roleService.hasPermission(userId, 'team.manage', {
    accountId,
    teamId: game.hteamid,
  });
  if (hasHomeTeamPermission) {
    return;
  }

  // Check TeamAdmin permission for visitor team
  const hasVisitorTeamPermission = await roleService.hasPermission(userId, 'team.manage', {
    accountId,
    teamId: game.vteamid,
  });
  if (hasVisitorTeamPermission) {
    return;
  }

  throw new AuthorizationError(
    'Must be TeamAdmin for one of the teams or have account.games.manage permission',
  );
}

// GET /api/accounts/:accountId/games/:gameId/live/status
// Public endpoint - check if game has active session
router.get(
  '/:gameId/live/status',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { gameId } = extractBigIntParams(req.params, 'gameId');
    const status = await getBaseballLiveScoringService().getSessionStatus(gameId);
    res.json(status);
  }),
);

// GET /api/accounts/:accountId/games/:gameId/live
// Public endpoint - allows guests to view live scoring state (read-only)
router.get(
  '/:gameId/live',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { gameId } = extractBigIntParams(req.params, 'gameId');
    const state = await getBaseballLiveScoringService().getSessionState(gameId);
    if (!state) {
      res.status(404).json({ error: 'No active live scoring session for this game' });
      return;
    }
    res.json(state);
  }),
);

// POST /api/accounts/:accountId/games/:gameId/live/ticket
// Get SSE subscription ticket (authenticated)
router.post(
  '/:gameId/live/ticket',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { gameId, accountId } = extractBigIntParams(req.params, 'gameId', 'accountId');
    const userId = req.user!.id;

    const ticketManager = getSseTicketManager();
    const { ticket, expiresIn } = ticketManager.createGameTicket(userId, gameId, accountId);

    res.status(201).json({ ticket, expiresIn });
  }),
);

// GET /api/accounts/:accountId/games/:gameId/live/subscribe
// SSE subscription endpoint (ticket-based auth)
router.get(
  '/:gameId/live/subscribe',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { gameId } = extractBigIntParams(req.params, 'gameId');
    const ticket = req.query.ticket as string | undefined;

    if (!ticket) {
      res.status(401).json({ error: 'Ticket required for SSE subscription' });
      return;
    }

    const ticketManager = getSseTicketManager();
    const validation = ticketManager.validateGameTicket(ticket, gameId);

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

    sseManager.addGameClient(clientId, res, userId, gameId);

    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ clientId, gameId: gameId.toString() })}\n\n`);

    const sessionState = await getBaseballLiveScoringService().getSessionState(gameId);
    if (sessionState) {
      res.write(`event: state\n`);
      res.write(`data: ${JSON.stringify(sessionState)}\n\n`);
    } else {
      res.write(`event: no_session\n`);
      res.write(`data: ${JSON.stringify({ gameId: gameId.toString() })}\n\n`);
    }

    req.on('close', () => {
      sseManager.removeClient(clientId);
    });
  }),
);

// POST /api/accounts/:accountId/games/:gameId/live/start
// Start a live scoring session (authenticated + permission required)
router.post(
  '/:gameId/live/start',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { gameId, accountId } = extractBigIntParams(req.params, 'gameId', 'accountId');
    const userId = req.user!.id;

    await validateGameScoringPermission(userId, accountId, gameId);

    StartBaseballLiveScoringSchema.parse(req.body);
    const state = await getBaseballLiveScoringService().startSession(gameId, userId);
    res.status(201).json(state);
  }),
);

// POST /api/accounts/:accountId/games/:gameId/live/scores
// Submit an inning score (authenticated + permission required)
router.post(
  '/:gameId/live/scores',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { gameId, accountId } = extractBigIntParams(req.params, 'gameId', 'accountId');
    const userId = req.user!.id;

    await validateGameScoringPermission(userId, accountId, gameId);

    const data = SubmitBaseballLiveInningScoreSchema.parse(req.body);
    const score = await getBaseballLiveScoringService().submitInningScore(gameId, userId, data);
    res.status(201).json(score);
  }),
);

// POST /api/accounts/:accountId/games/:gameId/live/advance
// Advance to a specific inning (authenticated + permission required)
router.post(
  '/:gameId/live/advance',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { gameId, accountId } = extractBigIntParams(req.params, 'gameId', 'accountId');
    const userId = req.user!.id;

    await validateGameScoringPermission(userId, accountId, gameId);

    const data = AdvanceBaseballInningSchema.parse(req.body);
    await getBaseballLiveScoringService().advanceInning(gameId, userId, data.inningNumber);
    res.status(200).json({ success: true });
  }),
);

// POST /api/accounts/:accountId/games/:gameId/live/finalize
// Finalize the session and save scores (authenticated + permission required)
router.post(
  '/:gameId/live/finalize',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { gameId, accountId } = extractBigIntParams(req.params, 'gameId', 'accountId');
    const userId = req.user!.id;

    await validateGameScoringPermission(userId, accountId, gameId);

    FinalizeBaseballLiveScoringSchema.parse(req.body);
    await getBaseballLiveScoringService().finalizeSession(gameId, userId);
    res.status(200).json({ success: true });
  }),
);

// POST /api/accounts/:accountId/games/:gameId/live/stop
// Stop the session without saving (authenticated + permission required)
router.post(
  '/:gameId/live/stop',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { gameId, accountId } = extractBigIntParams(req.params, 'gameId', 'accountId');
    const userId = req.user!.id;

    await validateGameScoringPermission(userId, accountId, gameId);

    StopBaseballLiveScoringSchema.parse(req.body);
    await getBaseballLiveScoringService().stopSession(gameId, userId);
    res.status(200).json({ success: true });
  }),
);

// GET /api/accounts/:accountId/games/live/active
// Public endpoint - no auth required (allows guests to see active live sessions)
router.get(
  '/live/active',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractBigIntParams(req.params, 'accountId');
    const sessions = await getBaseballLiveScoringService().getActiveSessionsForAccount(accountId);
    res.json(sessions);
  }),
);

export default router;
