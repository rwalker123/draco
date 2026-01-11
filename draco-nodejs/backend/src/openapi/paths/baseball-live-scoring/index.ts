import { RegisterContext } from '../../openapiTypes.js';
import { z } from 'zod';

const registerBaseballLiveScoringEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
    BaseballLiveScoringStateSchemaRef,
    BaseballLiveSessionStatusSchemaRef,
    BaseballLiveInningScoreSchemaRef,
    StartBaseballLiveScoringSchemaRef,
    SubmitBaseballLiveInningScoreSchemaRef,
    AdvanceBaseballInningSchemaRef,
    FinalizeBaseballLiveScoringSchemaRef,
    StopBaseballLiveScoringSchemaRef,
    SseTicketResponseSchemaRef,
    GetBaseballLiveScoringTicketSchemaRef,
  } = schemaRefs;

  const AccountIdParam = {
    name: 'accountId',
    in: 'path' as const,
    required: true,
    schema: { type: 'string' as const, format: 'number' as const },
  };

  const GameIdParam = {
    name: 'gameId',
    in: 'path' as const,
    required: true,
    schema: { type: 'string' as const, format: 'number' as const },
  };

  const BaseballActiveSessionsListSchemaRef = z
    .array(
      z.object({
        gameId: z.string(),
        sessionId: z.string(),
      }),
    )
    .openapi({
      title: 'BaseballActiveSessionsList',
      description: 'List of games with active baseball live scoring sessions',
    });

  const SuccessResponseSchemaRef = z
    .object({
      success: z.literal(true),
    })
    .openapi({
      title: 'SuccessResponse',
      description: 'Simple success response',
    });

  // GET /api/accounts/{accountId}/games/{gameId}/live/status
  // Public endpoint - check if game has active session
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/games/{gameId}/live/status',
    description: 'Check if a baseball game has an active live scoring session',
    operationId: 'getBaseballLiveSessionStatus',
    summary: 'Get baseball live session status',
    tags: ['Baseball Live Scoring'],
    security: [],
    parameters: [AccountIdParam, GameIdParam],
    responses: {
      200: {
        description: 'Baseball live session status',
        content: {
          'application/json': {
            schema: BaseballLiveSessionStatusSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  // GET /api/accounts/{accountId}/games/{gameId}/live
  // Public endpoint - allows guests to view live scoring state (read-only)
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/games/{gameId}/live',
    description:
      'Get the current state of a baseball live scoring session. This is a public endpoint for read-only access.',
    operationId: 'getBaseballLiveScoringState',
    summary: 'Get baseball live scoring state',
    tags: ['Baseball Live Scoring'],
    security: [],
    parameters: [AccountIdParam, GameIdParam],
    responses: {
      200: {
        description: 'Current baseball live scoring state',
        content: {
          'application/json': {
            schema: BaseballLiveScoringStateSchemaRef,
          },
        },
      },
      404: {
        description: 'No active session found',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  // POST /api/accounts/{accountId}/games/{gameId}/live/ticket
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/games/{gameId}/live/ticket',
    description: 'Get a short-lived ticket for SSE subscription authentication',
    operationId: 'getBaseballLiveScoringTicket',
    summary: 'Get SSE connection ticket for baseball',
    tags: ['Baseball Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam, GameIdParam],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GetBaseballLiveScoringTicketSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'SSE connection ticket',
        content: {
          'application/json': {
            schema: SseTicketResponseSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Not authorized',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  // POST /api/accounts/{accountId}/games/{gameId}/live/start
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/games/{gameId}/live/start',
    description: 'Start a new baseball live scoring session for a game',
    operationId: 'startBaseballLiveScoringSession',
    summary: 'Start baseball live scoring',
    tags: ['Baseball Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam, GameIdParam],
    request: {
      body: {
        content: {
          'application/json': {
            schema: StartBaseballLiveScoringSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Baseball live scoring session started',
        content: {
          'application/json': {
            schema: BaseballLiveScoringStateSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error or session already active',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Not authorized (not a TeamAdmin or account admin)',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Game not found',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  // POST /api/accounts/{accountId}/games/{gameId}/live/scores
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/games/{gameId}/live/scores',
    description: 'Submit runs for a specific inning and team during baseball live scoring',
    operationId: 'submitBaseballLiveInningScore',
    summary: 'Submit inning score',
    tags: ['Baseball Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam, GameIdParam],
    request: {
      body: {
        content: {
          'application/json': {
            schema: SubmitBaseballLiveInningScoreSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Score submitted successfully',
        content: {
          'application/json': {
            schema: BaseballLiveInningScoreSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Not authorized',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'No active session found',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  // POST /api/accounts/{accountId}/games/{gameId}/live/advance
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/games/{gameId}/live/advance',
    description: 'Advance to a specific inning number',
    operationId: 'advanceBaseballInning',
    summary: 'Advance inning',
    tags: ['Baseball Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam, GameIdParam],
    request: {
      body: {
        content: {
          'application/json': {
            schema: AdvanceBaseballInningSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Inning advanced successfully',
        content: {
          'application/json': {
            schema: SuccessResponseSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Not authorized',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'No active session found',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  // POST /api/accounts/{accountId}/games/{gameId}/live/finalize
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/games/{gameId}/live/finalize',
    description:
      'Finalize the baseball live scoring session and save scores permanently to the game',
    operationId: 'finalizeBaseballLiveScoringSession',
    summary: 'Finalize baseball live scoring',
    tags: ['Baseball Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam, GameIdParam],
    request: {
      body: {
        content: {
          'application/json': {
            schema: FinalizeBaseballLiveScoringSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Session finalized successfully',
        content: {
          'application/json': {
            schema: SuccessResponseSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Not authorized',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'No active session found',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  // POST /api/accounts/{accountId}/games/{gameId}/live/stop
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/games/{gameId}/live/stop',
    description: 'Stop the baseball live scoring session without saving scores',
    operationId: 'stopBaseballLiveScoringSession',
    summary: 'Stop baseball live scoring',
    tags: ['Baseball Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam, GameIdParam],
    request: {
      body: {
        content: {
          'application/json': {
            schema: StopBaseballLiveScoringSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Session stopped successfully',
        content: {
          'application/json': {
            schema: SuccessResponseSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Not authorized',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'No active session found',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  // GET /api/accounts/{accountId}/games/live/active
  // Public endpoint - no auth required (allows guests to see active live sessions)
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/games/live/active',
    description:
      'Get all baseball games with active live scoring sessions for the account. This is a public endpoint.',
    operationId: 'getActiveBaseballLiveScoringSessions',
    summary: 'List active baseball live sessions',
    tags: ['Baseball Live Scoring'],
    security: [],
    parameters: [AccountIdParam],
    responses: {
      200: {
        description: 'List of active sessions',
        content: {
          'application/json': {
            schema: BaseballActiveSessionsListSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });
};

export default registerBaseballLiveScoringEndpoints;
