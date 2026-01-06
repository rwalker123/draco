import { RegisterContext } from '../../openapiTypes.js';

export const registerGolfTeamsEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    GolfTeamSchemaRef,
    GolfTeamWithPlayerCountSchemaRef,
    GolfTeamWithRosterSchemaRef,
    CreateGolfTeamSchemaRef,
    UpdateGolfTeamSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  const GolfTeamListSchemaRef = z.array(GolfTeamSchemaRef).openapi({
    title: 'GolfTeamList',
    description: 'List of golf teams',
  });

  const GolfTeamWithPlayerCountListSchemaRef = z.array(GolfTeamWithPlayerCountSchemaRef).openapi({
    title: 'GolfTeamWithPlayerCountList',
    description: 'List of golf teams with player counts',
  });

  // GET /api/accounts/{accountId}/golf/teams/season/{seasonId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/teams/season/{seasonId}',
    description: 'List all teams for a golf season',
    operationId: 'listGolfTeams',
    summary: 'List teams for season',
    tags: ['Golf Teams'],
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
        description: 'List of teams',
        content: {
          'application/json': {
            schema: GolfTeamListSchemaRef,
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

  // GET /api/accounts/{accountId}/golf/teams/flight/{flightId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/teams/flight/{flightId}',
    description: 'List teams in a specific flight',
    operationId: 'listGolfTeamsForFlight',
    summary: 'List teams in flight',
    tags: ['Golf Teams'],
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
        description: 'List of teams in the flight with player counts',
        content: {
          'application/json': {
            schema: GolfTeamWithPlayerCountListSchemaRef,
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

  // GET /api/accounts/{accountId}/golf/teams/season/{seasonId}/team/{teamSeasonId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/teams/season/{seasonId}/team/{teamSeasonId}',
    description: 'Get a specific golf team by ID',
    operationId: 'getGolfTeam',
    summary: 'Get team',
    tags: ['Golf Teams'],
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
        description: 'Team details',
        content: {
          'application/json': {
            schema: GolfTeamSchemaRef,
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
        description: 'Team not found',
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

  // GET /api/accounts/{accountId}/golf/teams/season/{seasonId}/team/{teamSeasonId}/roster
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/teams/season/{seasonId}/team/{teamSeasonId}/roster',
    description: 'Get a golf team with its full roster',
    operationId: 'getGolfTeamWithRoster',
    summary: 'Get team with roster',
    tags: ['Golf Teams'],
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
        description: 'Team with roster',
        content: {
          'application/json': {
            schema: GolfTeamWithRosterSchemaRef,
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
        description: 'Team not found',
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

  // POST /api/accounts/{accountId}/golf/teams/flight/{flightId}
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/teams/flight/{flightId}',
    description: 'Create a new golf team in a flight',
    operationId: 'createGolfTeam',
    summary: 'Create team',
    tags: ['Golf Teams'],
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
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateGolfTeamSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Team created',
        content: {
          'application/json': {
            schema: GolfTeamSchemaRef,
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

  // PUT /api/accounts/{accountId}/golf/teams/season/{seasonId}/team/{teamSeasonId}
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/golf/teams/season/{seasonId}/team/{teamSeasonId}',
    description: 'Update an existing golf team',
    operationId: 'updateGolfTeam',
    summary: 'Update team',
    tags: ['Golf Teams'],
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
            schema: UpdateGolfTeamSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Team updated with player count',
        content: {
          'application/json': {
            schema: GolfTeamWithPlayerCountSchemaRef,
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
        description: 'Team not found',
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

  // DELETE /api/accounts/{accountId}/golf/teams/season/{seasonId}/team/{teamSeasonId}
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/golf/teams/season/{seasonId}/team/{teamSeasonId}',
    description: 'Delete a golf team',
    operationId: 'deleteGolfTeam',
    summary: 'Delete team',
    tags: ['Golf Teams'],
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
      204: {
        description: 'Team deleted',
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
        description: 'Team not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Cannot delete team because it has roster members or is in matches',
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
};

export default registerGolfTeamsEndpoints;
