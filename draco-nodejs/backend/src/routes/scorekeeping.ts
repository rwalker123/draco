import { Router, type Request, type Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/customErrors.js';
import { extractGameOnlyParams } from '../utils/paramExtraction.js';
import type {
  ScoreMutationRequest,
  ScoreMutationAudit,
  ScoreEventPayload,
} from '../services/scorekeepingService.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();

function parseAudit(input: unknown): ScoreMutationAudit {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Missing mutation audit metadata');
  }

  const audit = input as Record<string, unknown>;
  const userName = audit.userName;
  const deviceId = audit.deviceId;
  const timestamp = audit.timestamp;

  if (typeof userName !== 'string' || !userName) {
    throw new ValidationError('Invalid audit userName');
  }
  if (typeof deviceId !== 'string' || !deviceId) {
    throw new ValidationError('Invalid audit deviceId');
  }
  if (typeof timestamp !== 'string' || !timestamp) {
    throw new ValidationError('Invalid audit timestamp');
  }

  return { userName, deviceId, timestamp };
}

function parseEvent(input: unknown): ScoreEventPayload {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Invalid score event payload');
  }

  const event = input as Record<string, unknown>;
  const requiredString = (value: unknown, field: string) => {
    if (typeof value !== 'string' || !value) {
      throw new ValidationError(`Invalid event field: ${field}`);
    }
    return value;
  };

  const requiredNumber = (value: unknown, field: string) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new ValidationError(`Invalid event field: ${field}`);
    }
    return value;
  };

  const basesAfter = event.basesAfter;
  if (!basesAfter || typeof basesAfter !== 'object') {
    throw new ValidationError('Invalid event basesAfter');
  }

  return {
    id: requiredString(event.id, 'id'),
    clientEventId: typeof event.clientEventId === 'string' ? event.clientEventId : undefined,
    serverId: typeof event.serverId === 'string' ? event.serverId : undefined,
    sequence: requiredNumber(event.sequence, 'sequence'),
    gameId: requiredString(event.gameId, 'gameId'),
    createdAt: requiredString(event.createdAt, 'createdAt'),
    createdBy: requiredString(event.createdBy, 'createdBy'),
    deviceId: requiredString(event.deviceId, 'deviceId'),
    notation: requiredString(event.notation, 'notation'),
    summary: requiredString(event.summary, 'summary'),
    input: event.input,
    inning: requiredNumber(event.inning, 'inning'),
    half: event.half === 'top' || event.half === 'bottom' ? event.half : (() => {
      throw new ValidationError('Invalid event half');
    })(),
    outsBefore: requiredNumber(event.outsBefore, 'outsBefore'),
    outsAfter: requiredNumber(event.outsAfter, 'outsAfter'),
    scoreAfter: event.scoreAfter as { home: number; away: number },
    basesAfter: basesAfter as ScoreEventPayload['basesAfter'],
  };
}

function parseMutationRequest(body: unknown): ScoreMutationRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Invalid mutation payload');
  }

  const payload = body as Record<string, unknown>;
  const type = payload.type;
  const clientEventId = payload.clientEventId;
  const serverEventId = payload.serverEventId;
  const sequence = payload.sequence;
  const audit = parseAudit(payload.audit);

  if (type !== 'create' && type !== 'update' && type !== 'delete') {
    throw new ValidationError('Invalid mutation type');
  }

  if (typeof clientEventId !== 'string' || !clientEventId) {
    throw new ValidationError('Invalid clientEventId');
  }

  if (typeof sequence !== 'number' || Number.isNaN(sequence)) {
    throw new ValidationError('Invalid sequence value');
  }

  let event: ScoreEventPayload | undefined;
  if (payload.event !== undefined) {
    event = parseEvent(payload.event);
  } else if (type !== 'delete') {
    throw new ValidationError('Event payload required');
  }

  return {
    type,
    clientEventId,
    serverEventId: typeof serverEventId === 'string' ? serverEventId : undefined,
    sequence,
    event,
    audit,
  };
}

router.post(
  '/:gameId/score-events',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, gameId } = extractGameOnlyParams(req.params);
    const mutation = parseMutationRequest(req.body);
    const service = ServiceFactory.getScorekeepingService();

    const result = service.ingestMutation(accountId, gameId, mutation);
    res.status(mutation.type === 'create' ? 201 : 200).json(result);
  }),
);

export default router;
