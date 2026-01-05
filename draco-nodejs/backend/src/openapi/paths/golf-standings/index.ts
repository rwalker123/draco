import { RegisterContext } from '../../openapiTypes.js';

export const registerGolfStandingsEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    GolfLeagueStandingsSchemaRef,
    GolfFlightStandingsSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
  } = schemaRefs;

  // GET /api/accounts/{accountId}/golf/standings/season/{seasonId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/standings/season/{seasonId}',
    description: 'Get golf league standings for a season',
    operationId: 'getGolfSeasonStandings',
    summary: 'Get league standings for season',
    tags: ['Golf Standings'],
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
    responses: {
      200: {
        description: 'Golf league standings',
        content: {
          'application/json': {
            schema: GolfLeagueStandingsSchemaRef,
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
        description: 'Access denied',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Season not found or no flights for season',
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

  // GET /api/accounts/{accountId}/golf/standings/flight/{flightId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/standings/flight/{flightId}',
    description: 'Get golf standings for a specific flight',
    operationId: 'getGolfFlightStandings',
    summary: 'Get standings for flight',
    tags: ['Golf Standings'],
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
        description: 'Golf flight standings',
        content: {
          'application/json': {
            schema: GolfFlightStandingsSchemaRef,
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
        description: 'Access denied',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Flight not found',
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

export default registerGolfStandingsEndpoints;
