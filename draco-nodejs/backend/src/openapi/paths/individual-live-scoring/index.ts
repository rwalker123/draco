import { RegisterContext } from '../../openapiTypes.js';

const registerIndividualLiveScoringEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
    IndividualLiveScoringStateSchemaRef,
    IndividualLiveSessionStatusSchemaRef,
    IndividualLiveHoleScoreSchemaRef,
    StartIndividualLiveScoringSchemaRef,
    SubmitIndividualLiveHoleScoreSchemaRef,
    AdvanceIndividualLiveHoleSchemaRef,
    IndividualSseTicketResponseSchemaRef,
  } = schemaRefs;

  const AccountIdParam = {
    name: 'accountId',
    in: 'path' as const,
    required: true,
    schema: { type: 'string' as const, format: 'number' as const },
  };

  // GET /api/accounts/{accountId}/golfer/live/status
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golfer/live/status',
    description: 'Check if an individual golfer account has an active live scoring session',
    operationId: 'getIndividualLiveSessionStatus',
    summary: 'Get individual live session status',
    tags: ['Individual Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam],
    responses: {
      200: {
        description: 'Individual live session status',
        content: {
          'application/json': {
            schema: IndividualLiveSessionStatusSchemaRef,
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

  // GET /api/accounts/{accountId}/golfer/live
  // Public endpoint - allows viewers to see live scoring state
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golfer/live',
    description:
      'Get the current state of an individual live scoring session. This is a public endpoint for read-only access.',
    operationId: 'getIndividualLiveScoringState',
    summary: 'Get individual live scoring state',
    tags: ['Individual Live Scoring'],
    security: [],
    parameters: [AccountIdParam],
    responses: {
      200: {
        description: 'Current individual live scoring state',
        content: {
          'application/json': {
            schema: IndividualLiveScoringStateSchemaRef,
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

  // POST /api/accounts/{accountId}/golfer/live/ticket
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golfer/live/ticket',
    description: 'Get a short-lived ticket for SSE subscription authentication',
    operationId: 'getIndividualLiveScoringTicket',
    summary: 'Get SSE connection ticket for individual live scoring',
    tags: ['Individual Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam],
    responses: {
      201: {
        description: 'SSE connection ticket',
        content: {
          'application/json': {
            schema: IndividualSseTicketResponseSchemaRef,
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

  // POST /api/accounts/{accountId}/golfer/live/start
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golfer/live/start',
    description: 'Start a new individual live scoring session',
    operationId: 'startIndividualLiveScoringSession',
    summary: 'Start individual live scoring',
    tags: ['Individual Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam],
    request: {
      body: {
        content: {
          'application/json': {
            schema: StartIndividualLiveScoringSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Individual live scoring session started',
        content: {
          'application/json': {
            schema: IndividualLiveScoringStateSchemaRef,
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
        description: 'Not authorized',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Account not found',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  // POST /api/accounts/{accountId}/golfer/live/scores
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golfer/live/scores',
    description: 'Submit a score for a specific hole during individual live scoring',
    operationId: 'submitIndividualLiveHoleScore',
    summary: 'Submit individual hole score',
    tags: ['Individual Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam],
    request: {
      body: {
        content: {
          'application/json': {
            schema: SubmitIndividualLiveHoleScoreSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Score submitted successfully',
        content: {
          'application/json': {
            schema: IndividualLiveHoleScoreSchemaRef,
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

  // POST /api/accounts/{accountId}/golfer/live/advance
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golfer/live/advance',
    description: 'Advance to a specific hole number in individual live scoring',
    operationId: 'advanceIndividualLiveHole',
    summary: 'Advance individual hole',
    tags: ['Individual Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam],
    request: {
      body: {
        content: {
          'application/json': {
            schema: AdvanceIndividualLiveHoleSchemaRef,
          },
        },
      },
    },
    responses: {
      204: {
        description: 'Hole advanced successfully',
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

  // POST /api/accounts/{accountId}/golfer/live/finalize
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golfer/live/finalize',
    description: 'Finalize the individual live scoring session and save scores permanently',
    operationId: 'finalizeIndividualLiveScoringSession',
    summary: 'Finalize individual live scoring',
    tags: ['Individual Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam],
    responses: {
      204: {
        description: 'Session finalized successfully',
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

  // POST /api/accounts/{accountId}/golfer/live/stop
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golfer/live/stop',
    description: 'Stop the individual live scoring session without saving scores',
    operationId: 'stopIndividualLiveScoringSession',
    summary: 'Stop individual live scoring',
    tags: ['Individual Live Scoring'],
    security: [{ bearerAuth: [] }],
    parameters: [AccountIdParam],
    responses: {
      204: {
        description: 'Session stopped successfully',
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
};

export default registerIndividualLiveScoringEndpoints;
