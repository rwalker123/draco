import { RegisterContext } from '../../openapiTypes.js';

export const registerManagersEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    UpsertTeamManagerSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    SeasonManagerListSchemaRef,
    TeamManagerSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  // GET `/api/accounts/{accountId}/seasons/{seasonId}/managers`
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/managers',
    description: 'List managers for the given season',
    operationId: 'listSeasonManagers',
    security: [{ bearerAuth: [] }],
    tags: ['Managers'],
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
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'number',
        },
        description: 'Filter managers by league season id',
      },
      {
        name: 'teamSeasonId',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'number',
        },
        description: 'Filter managers by team season id',
      },
      {
        name: 'search',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
        },
        description: 'Filter managers by contact name or email',
      },
    ],
    responses: {
      200: {
        description: 'Season managers retrieved successfully',
        content: {
          'application/json': {
            schema: SeasonManagerListSchemaRef,
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
        description: 'Access denied - Account admin required',
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

  // POST  `/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/managers`,
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/managers',
    description: 'Add a manager to the team for the given season',
    operationId: 'addManager',
    security: [{ bearerAuth: [] }],
    tags: ['Managers'],
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
        content: {
          'application/json': {
            schema: UpsertTeamManagerSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Manager added',
        content: {
          'application/json': {
            schema: TeamManagerSchemaRef,
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
        description: 'Access denied - Account admin required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Manager not found',
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

  // DELETE /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/managers/{managerId}
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/managers/{managerId}',
    description: 'Remove a manager from the team for the given season',
    operationId: 'removeManager',
    security: [{ bearerAuth: [] }],
    tags: ['Managers'],
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
        name: 'teamSeasonId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'managerId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {},
    responses: {
      200: {
        description: 'Manager removed',
        content: {
          'application/json': {
            schema: z.string(),
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
        description: 'Access denied - Account admin required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Manager not found',
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

export default registerManagersEndpoints;
