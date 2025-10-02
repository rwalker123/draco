import { RegisterContext } from '../../openapiTypes.js';

export const registerLeaguesEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    ConflictErrorSchemaRef,
    InternalServerErrorSchemaRef,
    LeagueSchemaRef,
    NotFoundErrorSchemaRef,
    UpsertLeagueSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  /**
   * GET /api/accounts/:accountId/leagues
   * Returns all leagues for the specified account (requires authentication).
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/leagues',
    operationId: 'listAccountLeagues',
    summary: 'List account leagues',
    description: 'Retrieve all leagues belonging to an account. Requires authentication.',
    tags: ['Leagues'],
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
    ],
    responses: {
      200: {
        description: 'List of leagues for the account',
        content: {
          'application/json': {
            schema: LeagueSchemaRef.array(),
          },
        },
      },
      400: {
        description: 'Invalid account id provided',
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
        description: 'Insufficient permissions to view leagues for the account',
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

  /**
   * GET /api/accounts/:accountId/leagues/all-time
   * Get unique leagues for all-time statistics (public endpoint)
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/leagues/all-time',
    operationId: 'listAllTimeLeagues',
    summary: 'List all-time leagues',
    description:
      'Retrieve leagues that have at least one associated season for public all-time statistics.',
    tags: ['Leagues'],
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
    ],
    responses: {
      200: {
        description: 'List of leagues with seasons for the account',
        content: {
          'application/json': {
            schema: LeagueSchemaRef.array(),
          },
        },
      },
      400: {
        description: 'Invalid account id provided',
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
   * GET /api/accounts/:accountId/leagues/:leagueId
   * Retrieves details for a single league within the account.
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/leagues/{leagueId}',
    operationId: 'getLeague',
    summary: 'Get league',
    description: 'Retrieve the details for a league within the specified account.',
    tags: ['Leagues'],
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
        name: 'leagueId',
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
        description: 'League details',
        content: {
          'application/json': {
            schema: LeagueSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid account or league id',
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
        description: 'Insufficient permissions to access the league',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'League not found',
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
   * POST /api/accounts/:accountId/leagues
   * Creates a new league for the account (requires account admin privileges).
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/leagues',
    operationId: 'createLeague',
    summary: 'Create league',
    description: 'Create a new league for the specified account.',
    tags: ['Leagues'],
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
    ],
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: UpsertLeagueSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'League created',
        content: {
          'application/json': {
            schema: LeagueSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error creating league',
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
        description: 'Account admin privileges required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'A league with this name already exists for the account',
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
   * PUT /api/accounts/:accountId/leagues/:leagueId
   * Update league name (requires AccountAdmin or Administrator)
   */
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/leagues/{leagueId}',
    operationId: 'updateLeague',
    summary: 'Update league',
    description: 'Update the details for a league within the specified account.',
    tags: ['Leagues'],
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
        name: 'leagueId',
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
            schema: UpsertLeagueSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'League updated',
        content: {
          'application/json': {
            schema: LeagueSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error updating league',
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
        description: 'Account admin privileges required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'League not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'A league with this name already exists for the account',
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
   * DELETE /api/accounts/:accountId/leagues/:leagueId
   * Delete a league (requires AccountAdmin or Administrator)
   */
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/leagues/{leagueId}',
    operationId: 'deleteLeague',
    summary: 'Delete league',
    description:
      'Delete a league from the account. The operation fails if related seasons are still associated.',
    tags: ['Leagues'],
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
        name: 'leagueId',
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
        description: 'League deleted',
        content: {
          'application/json': {
            schema: z.boolean(),
          },
        },
      },
      400: {
        description: 'Validation error deleting league',
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
        description: 'Account admin privileges required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'League not found',
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

export default registerLeaguesEndpoints;
