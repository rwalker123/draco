import { RegisterContext } from '../../openapiTypes.js';
import { z } from 'zod';

const registerLiveScoringEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
    LiveScoringStateSchemaRef,
    LiveSessionStatusSchemaRef,
    LiveHoleScoreSchemaRef,
    StartLiveScoringSchemaRef,
    SubmitLiveHoleScoreSchemaRef,
    AdvanceHoleSchemaRef,
    FinalizeLiveScoringSchemaRef,
    StopLiveScoringSchemaRef,
    SseTicketResponseSchemaRef,
  } = schemaRefs;

  const AccountIdParam = {
    name: 'accountId',
    in: 'path' as const,
    required: true,
    schema: { type: 'string' as const, format: 'number' as const },
  };

  const MatchIdParam = {
    name: 'matchId',
    in: 'path' as const,
    required: true,
    schema: { type: 'string' as const, format: 'number' as const },
  };

  const ActiveSessionsListSchemaRef = z
    .array(
      z.object({
        matchId: z.string(),
        sessionId: z.string(),
      }),
    )
    .openapi({
      title: 'ActiveSessionsList',
      description: 'List of matches with active live scoring sessions',
    });

  const SuccessResponseSchemaRef = z
    .object({
      success: z.literal(true),
    })
    .openapi({
      title: 'SuccessResponse',
      description: 'Simple success response',
    });

  // GET /api/accounts/{accountId}/golf/matches/{matchId}/live/status
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/matches/{matchId}/live/status',
    description: 'Check if a match has an active live scoring session',
    operationId: 'getLiveSessionStatus',
    summary: 'Get live session status',
    tags: ['Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam, MatchIdParam],
    responses: {
      200: {
        description: 'Live session status',
        content: {
          'application/json': {
            schema: LiveSessionStatusSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  // GET /api/accounts/{accountId}/golf/matches/{matchId}/live
  // Public endpoint - allows guests to view live scoring state (read-only)
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/matches/{matchId}/live',
    description:
      'Get the current state of a live scoring session. This is a public endpoint for read-only access.',
    operationId: 'getLiveScoringState',
    summary: 'Get live scoring state',
    tags: ['Live Scoring'],
    security: [],
    parameters: [AccountIdParam, MatchIdParam],
    responses: {
      200: {
        description: 'Current live scoring state',
        content: {
          'application/json': {
            schema: LiveScoringStateSchemaRef,
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

  // POST /api/accounts/{accountId}/golf/matches/{matchId}/live/ticket
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/matches/{matchId}/live/ticket',
    description: 'Get a short-lived ticket for SSE subscription authentication',
    operationId: 'getLiveScoringTicket',
    summary: 'Get SSE connection ticket',
    tags: ['Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam, MatchIdParam],
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

  // POST /api/accounts/{accountId}/golf/matches/{matchId}/live/start
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/matches/{matchId}/live/start',
    description: 'Start a new live scoring session for a match',
    operationId: 'startLiveScoringSession',
    summary: 'Start live scoring',
    tags: ['Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam, MatchIdParam],
    request: {
      body: {
        content: {
          'application/json': {
            schema: StartLiveScoringSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Live scoring session started',
        content: {
          'application/json': {
            schema: LiveScoringStateSchemaRef,
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
        description: 'Not authorized (not a match participant)',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Match not found',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  // POST /api/accounts/{accountId}/golf/matches/{matchId}/live/scores
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/matches/{matchId}/live/scores',
    description: 'Submit a score for a specific hole during live scoring',
    operationId: 'submitLiveHoleScore',
    summary: 'Submit hole score',
    tags: ['Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam, MatchIdParam],
    request: {
      body: {
        content: {
          'application/json': {
            schema: SubmitLiveHoleScoreSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Score submitted successfully',
        content: {
          'application/json': {
            schema: LiveHoleScoreSchemaRef,
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

  // POST /api/accounts/{accountId}/golf/matches/{matchId}/live/advance
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/matches/{matchId}/live/advance',
    description: 'Advance to a specific hole number',
    operationId: 'advanceLiveHole',
    summary: 'Advance hole',
    tags: ['Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam, MatchIdParam],
    request: {
      body: {
        content: {
          'application/json': {
            schema: AdvanceHoleSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Hole advanced successfully',
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

  // POST /api/accounts/{accountId}/golf/matches/{matchId}/live/finalize
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/matches/{matchId}/live/finalize',
    description: 'Finalize the live scoring session and save scores permanently',
    operationId: 'finalizeLiveScoringSession',
    summary: 'Finalize live scoring',
    tags: ['Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam, MatchIdParam],
    request: {
      body: {
        content: {
          'application/json': {
            schema: FinalizeLiveScoringSchemaRef,
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

  // POST /api/accounts/{accountId}/golf/matches/{matchId}/live/stop
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/matches/{matchId}/live/stop',
    description: 'Stop the live scoring session without saving scores',
    operationId: 'stopLiveScoringSession',
    summary: 'Stop live scoring',
    tags: ['Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam, MatchIdParam],
    request: {
      body: {
        content: {
          'application/json': {
            schema: StopLiveScoringSchemaRef,
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

  // GET /api/accounts/{accountId}/golf/matches/live/active
  // Public endpoint - no auth required (allows guests to see active live sessions)
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/matches/live/active',
    description:
      'Get all matches with active live scoring sessions for the account. This is a public endpoint.',
    operationId: 'getActiveLiveScoringSessions',
    summary: 'List active live sessions',
    tags: ['Live Scoring'],
    security: [],
    parameters: [AccountIdParam],
    responses: {
      200: {
        description: 'List of active sessions',
        content: {
          'application/json': {
            schema: ActiveSessionsListSchemaRef,
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

export default registerLiveScoringEndpoints;
