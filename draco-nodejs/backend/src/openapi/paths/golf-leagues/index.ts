import { RegisterContext } from '../../openapiTypes.js';

export const registerGolfLeaguesEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    GolfLeagueSetupSchemaRef,
    UpdateGolfLeagueSetupSchemaRef,
    GolfAccountInfoSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  const GolfAccountInfoListSchemaRef = z.array(GolfAccountInfoSchemaRef).openapi({
    title: 'GolfAccountInfoList',
    description: 'List of golf accounts',
  });

  // GET /api/golf/leagues
  registry.registerPath({
    method: 'get',
    path: '/api/golf/leagues',
    description: 'List all golf league accounts',
    operationId: 'listGolfAccounts',
    summary: 'List golf accounts',
    tags: ['Golf Leagues'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'List of golf accounts',
        content: {
          'application/json': {
            schema: GolfAccountInfoListSchemaRef,
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

  // GET /api/golf/leagues/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/setup
  registry.registerPath({
    method: 'get',
    path: '/api/golf/leagues/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/setup',
    description: 'Get golf league setup configuration for a league season',
    operationId: 'getGolfLeagueSetup',
    summary: 'Get league setup',
    tags: ['Golf Leagues'],
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
        name: 'leagueSeasonId',
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
        description: 'Golf league setup configuration',
        content: {
          'application/json': {
            schema: GolfLeagueSetupSchemaRef,
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
        description: 'Golf league setup not found',
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

  // PUT /api/golf/leagues/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/setup
  registry.registerPath({
    method: 'put',
    path: '/api/golf/leagues/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/setup',
    description: 'Update golf league setup configuration for a league season',
    operationId: 'updateGolfLeagueSetup',
    summary: 'Update league setup',
    tags: ['Golf Leagues'],
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
        name: 'leagueSeasonId',
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
            schema: UpdateGolfLeagueSetupSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated golf league setup',
        content: {
          'application/json': {
            schema: GolfLeagueSetupSchemaRef,
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
        description: 'Golf league setup not found',
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

export default registerGolfLeaguesEndpoints;
