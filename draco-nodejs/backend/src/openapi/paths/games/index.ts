import { RegisterContext } from '../../openapiTypes.js';

export const registerGamesEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    ConflictErrorSchemaRef,
    GameResultSchemaRef,
    GamesWithRecapsSchemaRef,
    GameSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    UpdateGameResultsSchemaRef,
    UpsertGameSchemaRef,
    UpsertGameRecapSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  /**
   * PUT /api/accounts/:accountId/seasons/:seasonId/games/:gameId/results
   * Update the results for a game
   */
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/games/{gameId}/results',
    operationId: 'updateGameResults',
    summary: 'Update game results',
    description: 'Update the final score and status for a specific game.',
    tags: ['Games'],
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
        name: 'gameId',
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
        required: true,
        content: {
          'application/json': {
            schema: UpdateGameResultsSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Game results updated',
        content: {
          'application/json': {
            schema: GameResultSchemaRef,
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
        description: 'Insufficient permissions to update results',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Game not found within the account/season',
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

  /**
   * GET /api/accounts/:accountId/seasons/:seasonId/games
   * Get games for a season
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/games',
    operationId: 'listSeasonGames',
    summary: 'List season games',
    description: 'Retrieve games for a season with optional team, date, and recap filters.',
    tags: ['Games'],
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
        description: 'Return games occurring on or after this ISO date.',
      },
      {
        name: 'endDate',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'date-time',
        },
        description: 'Return games occurring on or before this ISO date.',
      },
      {
        name: 'teamId',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'number',
        },
        description: 'Filter to games where the given team season participates.',
      },
      {
        name: 'hasRecap',
        in: 'query',
        required: false,
        schema: {
          type: 'boolean',
        },
        description: 'Only include games that have at least one recap when true.',
      },
      {
        name: 'page',
        in: 'query',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
        },
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 50,
        },
      },
      {
        name: 'sortOrder',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          enum: ['asc', 'desc'],
          default: 'asc',
        },
      },
    ],
    responses: {
      200: {
        description: 'List of games with pagination metadata',
        content: {
          'application/json': {
            schema: GamesWithRecapsSchemaRef,
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

  /**
   * POST /api/accounts/:accountId/seasons/:seasonId/games
   * Create a new game
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/games',
    operationId: 'createGame',
    summary: 'Create game',
    description: 'Create a new game within the specified league season.',
    tags: ['Games'],
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
        required: true,
        content: {
          'application/json': {
            schema: UpsertGameSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Game created',
        content: {
          'application/json': {
            schema: GameSchemaRef,
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
        description: 'Insufficient permissions to manage games',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'League season or teams not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Scheduling conflict for the field',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
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

  /**
   * PUT /api/accounts/:accountId/seasons/:seasonId/games/:gameId
   * Update a game
   */
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/games/{gameId}',
    operationId: 'updateGame',
    summary: 'Update game',
    description: 'Update scheduling details, officials, and metadata for an existing game.',
    tags: ['Games'],
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
        name: 'gameId',
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
        required: true,
        content: {
          'application/json': {
            schema: UpsertGameSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Game updated',
        content: {
          'application/json': {
            schema: GameSchemaRef,
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
        description: 'Insufficient permissions to manage games',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Game not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Scheduling conflict for the field',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
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

  /**
   * DELETE /api/accounts/:accountId/seasons/:seasonId/games/:gameId
   * Delete a game
   */
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/games/{gameId}',
    operationId: 'deleteGame',
    summary: 'Delete game',
    description: 'Remove a scheduled game.',
    tags: ['Games'],
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
        name: 'gameId',
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
        description: 'Game deleted',
        content: {
          'application/json': {
            schema: z.boolean(),
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
        description: 'Insufficient permissions to delete games',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Game not found',
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

  /**
   * GET /api/accounts/:accountId/seasons/:seasonId/games/:gameId/recap/:teamSeasonId
   * Get recap content for a team in a game
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/games/{gameId}/recap/{teamSeasonId}',
    operationId: 'getGameRecap',
    summary: 'Get game recap for team',
    description: 'Return the recap text submitted for the specified team and game.',
    tags: ['Games'],
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
        name: 'gameId',
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
        description: 'Recap text',
        content: {
          'application/json': {
            schema: z.string(),
          },
        },
      },
      404: {
        description: 'Game or recap not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid team assignment for the game',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
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

  /**
   * PUT /api/accounts/:accountId/seasons/:seasonId/games/:gameId/recap/:teamSeasonId
   * Upsert recap content for a team in a game
   */
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/games/{gameId}/recap/{teamSeasonId}',
    operationId: 'upsertGameRecap',
    summary: 'Upsert game recap for team',
    description: 'Create or update the recap text for a team participating in a game.',
    tags: ['Games'],
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
        name: 'gameId',
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
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: UpsertGameRecapSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Recap saved',
        content: {
          'application/json': {
            schema: z.string(),
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
        description: 'Insufficient permissions to manage recaps',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Game not found for the provided context',
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

export default registerGamesEndpoints;
