import { RegisterContext } from '../../openapiTypes.js';

export const registerGolfScoresEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    GolfScoreWithDetailsSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    PlayerSeasonScoresResponseSchemaRef,
  } = schemaRefs;

  const GolfScoreWithDetailsListSchemaRef = z.array(GolfScoreWithDetailsSchemaRef).openapi({
    title: 'GolfScoreWithDetailsList',
    description: 'List of golf scores with player and tee details',
  });

  // GET /api/accounts/{accountId}/golf/scores/match/{matchId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/scores/match/{matchId}',
    description: 'Get all scores for a golf match',
    operationId: 'getGolfMatchScores',
    summary: 'Get match scores',
    tags: ['Golf Scores'],
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
        description: 'Scores for the match',
        content: {
          'application/json': {
            schema: GolfScoreWithDetailsListSchemaRef,
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

  // GET /api/accounts/{accountId}/golf/scores/match/{matchId}/team/{teamId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/scores/match/{matchId}/team/{teamId}',
    description: 'Get scores for a specific team in a match',
    operationId: 'getGolfTeamMatchScores',
    summary: 'Get team match scores',
    tags: ['Golf Scores'],
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
      {
        name: 'teamId',
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
        description: 'Team scores for the match',
        content: {
          'application/json': {
            schema: GolfScoreWithDetailsListSchemaRef,
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

  // GET /api/accounts/{accountId}/golf/scores/player/{contactId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/scores/player/{contactId}',
    description: 'Get scores for a specific player by contact ID',
    operationId: 'getGolfPlayerScores',
    summary: 'Get player scores',
    tags: ['Golf Scores'],
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
        name: 'contactId',
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
          default: 20,
        },
        description: 'Maximum number of scores to return',
      },
    ],
    responses: {
      200: {
        description: 'Player scores',
        content: {
          'application/json': {
            schema: GolfScoreWithDetailsListSchemaRef,
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

  // GET /api/accounts/{accountId}/golf/season/{seasonId}/player/{contactId}/scores
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/season/{seasonId}/player/{contactId}/scores',
    description: 'Get scores for a player in a specific season',
    operationId: 'getGolfPlayerSeasonScores',
    summary: 'Get player season scores',
    tags: ['Golf Scores'],
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
        name: 'contactId',
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
        description: 'Player scores for the season with initial handicap info',
        content: {
          'application/json': {
            schema: PlayerSeasonScoresResponseSchemaRef,
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

  // GET /api/accounts/{accountId}/golf/scores/{scoreId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/scores/{scoreId}',
    description: 'Get a specific golf score by ID',
    operationId: 'getGolfScore',
    summary: 'Get golf score',
    tags: ['Golf Scores'],
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
        name: 'scoreId',
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
        description: 'Golf score details',
        content: {
          'application/json': {
            schema: GolfScoreWithDetailsSchemaRef,
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
        description: 'Score not found',
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

  // DELETE /api/accounts/{accountId}/golf/scores/match/{matchId}
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/golf/scores/match/{matchId}',
    description: 'Delete all scores for a match',
    operationId: 'deleteGolfMatchScores',
    summary: 'Delete match scores',
    tags: ['Golf Scores'],
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
        description: 'Scores deleted',
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

export default registerGolfScoresEndpoints;
