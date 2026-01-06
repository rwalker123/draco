import { RegisterContext } from '../../openapiTypes.js';

export const registerGolfMatchesEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    CreateGolfMatchSchemaRef,
    GolfMatchSchemaRef,
    GolfMatchWithScoresSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    SubmitMatchResultsSchemaRef,
    UpdateGolfMatchSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  const GolfMatchListSchemaRef = z.array(GolfMatchSchemaRef).openapi({
    title: 'GolfMatchList',
    description: 'List of golf matches',
  });

  // GET /api/accounts/{accountId}/golf/matches/season/{seasonId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/matches/season/{seasonId}',
    description: 'List all golf matches for a season',
    operationId: 'listGolfMatchesForSeason',
    summary: 'List season matches',
    tags: ['Golf Matches'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'seasonId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'startDate',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'date-time',
        },
        description: 'Return matches occurring on or after this ISO date.',
      },
      {
        name: 'endDate',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'date-time',
        },
        description: 'Return matches occurring on or before this ISO date.',
      },
    ],
    responses: {
      200: {
        description: 'List of matches for the season',
        content: {
          'application/json': {
            schema: GolfMatchListSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/{accountId}/golf/matches/season/{seasonId}/upcoming
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/matches/season/{seasonId}/upcoming',
    description: 'List upcoming golf matches for a season',
    operationId: 'listUpcomingGolfMatches',
    summary: 'List upcoming matches',
    tags: ['Golf Matches'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'seasonId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        schema: {
          type: 'integer',
          default: 10,
        },
      },
    ],
    responses: {
      200: {
        description: 'List of upcoming matches',
        content: {
          'application/json': {
            schema: GolfMatchListSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/{accountId}/golf/matches/season/{seasonId}/completed
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/matches/season/{seasonId}/completed',
    description: 'List completed golf matches for a season',
    operationId: 'listCompletedGolfMatches',
    summary: 'List completed matches',
    tags: ['Golf Matches'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'seasonId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        schema: {
          type: 'integer',
          default: 10,
        },
      },
    ],
    responses: {
      200: {
        description: 'List of completed matches',
        content: {
          'application/json': {
            schema: GolfMatchListSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/{accountId}/golf/matches/season/{seasonId}/date/{date}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/matches/season/{seasonId}/date/{date}',
    description: 'List golf matches for a specific date',
    operationId: 'listGolfMatchesByDate',
    summary: 'List matches by date',
    tags: ['Golf Matches'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'seasonId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'date',
        in: 'path',
        required: true,
        description: 'Date in YYYY-MM-DD format',
        schema: {
          type: 'string',
          format: 'date',
        },
      },
    ],
    responses: {
      200: {
        description: 'List of matches for the date',
        content: {
          'application/json': {
            schema: GolfMatchListSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/{accountId}/golf/matches/flight/{flightId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/matches/flight/{flightId}',
    description: 'List golf matches for a flight',
    operationId: 'listGolfMatchesForFlight',
    summary: 'List flight matches',
    tags: ['Golf Matches'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'flightId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      200: {
        description: 'List of matches for the flight',
        content: {
          'application/json': {
            schema: GolfMatchListSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/{accountId}/golf/matches/team/{teamSeasonId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/matches/team/{teamSeasonId}',
    description: 'List golf matches for a team',
    operationId: 'listGolfMatchesForTeam',
    summary: 'List team matches',
    tags: ['Golf Matches'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'teamSeasonId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      200: {
        description: 'List of matches for the team',
        content: {
          'application/json': {
            schema: GolfMatchListSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/{accountId}/golf/matches/{matchId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/matches/{matchId}',
    description: 'Get a single golf match by ID',
    operationId: 'getGolfMatch',
    summary: 'Get golf match',
    tags: ['Golf Matches'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'matchId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      200: {
        description: 'Golf match details',
        content: {
          'application/json': {
            schema: GolfMatchSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Match not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/{accountId}/golf/matches/{matchId}/scores
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/matches/{matchId}/scores',
    description: 'Get a golf match with all scores',
    operationId: 'getGolfMatchWithScores',
    summary: 'Get match with scores',
    tags: ['Golf Matches'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'matchId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      200: {
        description: 'Golf match with scores',
        content: {
          'application/json': {
            schema: GolfMatchWithScoresSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Match not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // POST /api/accounts/{accountId}/golf/matches/{matchId}/results
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/matches/{matchId}/results',
    description: 'Submit scores for all players in a match',
    operationId: 'submitGolfMatchResults',
    summary: 'Submit match results',
    tags: ['Golf Matches'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'matchId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: SubmitMatchResultsSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Match results submitted successfully',
        content: {
          'application/json': {
            schema: GolfMatchSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Access denied - account management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Match not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // POST /api/accounts/{accountId}/golf/matches/season/{seasonId}
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/matches/season/{seasonId}',
    description: 'Create a new golf match',
    operationId: 'createGolfMatch',
    summary: 'Create golf match',
    tags: ['Golf Matches'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'seasonId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateGolfMatchSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Match created',
        content: {
          'application/json': {
            schema: GolfMatchSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Access denied - account management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // PUT /api/accounts/{accountId}/golf/matches/{matchId}
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/golf/matches/{matchId}',
    description: 'Update an existing golf match',
    operationId: 'updateGolfMatch',
    summary: 'Update golf match',
    tags: ['Golf Matches'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'matchId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpdateGolfMatchSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Match updated',
        content: {
          'application/json': {
            schema: GolfMatchSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Access denied - account management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Match not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // PUT /api/accounts/{accountId}/golf/matches/{matchId}/status
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/golf/matches/{matchId}/status',
    description: 'Update the status of a golf match',
    operationId: 'updateGolfMatchStatus',
    summary: 'Update match status',
    tags: ['Golf Matches'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'matchId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              status: z.number().int().min(0).max(4),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Match status updated',
        content: {
          'application/json': {
            schema: GolfMatchSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Access denied - account management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Match not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // DELETE /api/accounts/{accountId}/golf/matches/{matchId}
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/golf/matches/{matchId}',
    description: 'Delete a golf match',
    operationId: 'deleteGolfMatch',
    summary: 'Delete golf match',
    tags: ['Golf Matches'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'matchId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      204: {
        description: 'Match deleted',
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Access denied - account management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Match not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });
};

export default registerGolfMatchesEndpoints;
