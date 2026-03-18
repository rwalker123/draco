import { RegisterContext } from '../../openapiTypes.js';

export const registerSeasonsGolfSubstitutesEndpoints = ({
  registry,
  schemaRefs,
  z,
}: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    CreateGolfPlayerSchemaRef,
    GolfSubstituteSchemaRef,
    NotFoundErrorSchemaRef,
    SignPlayerSchemaRef,
    UpdateGolfPlayerSchemaRef,
    ValidationErrorSchemaRef,
    InternalServerErrorSchemaRef,
  } = schemaRefs;

  const GolfSubstituteListSchemaRef = z.array(GolfSubstituteSchemaRef).openapi({
    title: 'GolfSubstituteList',
    description: 'List of golf substitutes',
  });

  const leagueSeasonIdParam = {
    name: 'leagueSeasonId',
    in: 'path' as const,
    required: true,
    schema: {
      type: 'string' as const,
      format: 'number',
    },
  };

  const accountIdParam = {
    name: 'accountId',
    in: 'path' as const,
    required: true,
    schema: {
      type: 'string' as const,
      format: 'number',
    },
  };

  const seasonIdParam = {
    name: 'seasonId',
    in: 'path' as const,
    required: true,
    schema: {
      type: 'string' as const,
      format: 'number',
    },
  };

  const subIdParam = {
    name: 'subId',
    in: 'path' as const,
    required: true,
    schema: {
      type: 'string' as const,
      format: 'number',
    },
  };

  // GET /api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/golf/substitutes
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/golf/substitutes',
    description: 'List all substitutes for a league season',
    operationId: 'listGolfSubstitutesForLeague',
    summary: 'List league substitutes',
    tags: ['Golf Substitutes'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParam, seasonIdParam, leagueSeasonIdParam],
    responses: {
      200: {
        description: 'List of substitutes',
        content: {
          'application/json': {
            schema: GolfSubstituteListSchemaRef,
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

  // POST /api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/golf/substitutes
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/golf/substitutes',
    description: 'Create a new substitute player in the league pool',
    operationId: 'createGolfSubstitute',
    summary: 'Create golf substitute',
    tags: ['Golf Substitutes'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParam, seasonIdParam, leagueSeasonIdParam],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateGolfPlayerSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Substitute created',
        content: {
          'application/json': {
            schema: GolfSubstituteSchemaRef,
          },
        },
      },
      400: {
        description: 'Duplicate substitute already exists',
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
        description: 'Access denied',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'League season not found',
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

  // POST /api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/golf/substitutes/sign
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/golf/substitutes/sign',
    description: 'Add an existing contact as a substitute in the league pool',
    operationId: 'signGolfSubstitute',
    summary: 'Sign existing contact as substitute',
    tags: ['Golf Substitutes'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParam, seasonIdParam, leagueSeasonIdParam],
    request: {
      body: {
        content: {
          'application/json': {
            schema: SignPlayerSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Substitute created from existing contact',
        content: {
          'application/json': {
            schema: GolfSubstituteSchemaRef,
          },
        },
      },
      400: {
        description: 'Duplicate substitute already exists',
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
        description: 'Access denied',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'League season or contact not found',
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

  // PATCH /api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/golf/substitutes/{subId}
  registry.registerPath({
    method: 'patch',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/golf/substitutes/{subId}',
    description: 'Update a substitute in the league pool',
    operationId: 'updateGolfSubstitute',
    summary: 'Update golf substitute',
    tags: ['Golf Substitutes'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParam, seasonIdParam, leagueSeasonIdParam, subIdParam],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpdateGolfPlayerSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Substitute updated',
        content: {
          'application/json': {
            schema: GolfSubstituteSchemaRef,
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

  // DELETE /api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/golf/substitutes/{subId}
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/golf/substitutes/{subId}',
    description: 'Delete a substitute from the league pool',
    operationId: 'deleteGolfSubstitute',
    summary: 'Delete golf substitute',
    tags: ['Golf Substitutes'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParam, seasonIdParam, leagueSeasonIdParam, subIdParam],
    responses: {
      204: {
        description: 'Substitute deleted',
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

export default registerSeasonsGolfSubstitutesEndpoints;
