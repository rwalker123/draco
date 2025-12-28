import {
  CreateGolfPlayerSchema,
  SignPlayerSchema,
  ReleasePlayerSchema,
} from '@draco/shared-schemas';
import { RegisterContext } from '../../openapiTypes.js';

export const registerGolfRostersEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    GolfRosterEntrySchemaRef,
    GolfSubstituteSchemaRef,
    AvailablePlayerSchemaRef,
    UpdateGolfPlayerSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  const GolfRosterEntryListSchemaRef = z.array(GolfRosterEntrySchemaRef).openapi({
    title: 'GolfRosterEntryList',
    description: 'List of golf roster entries',
  });

  const GolfSubstituteListSchemaRef = z.array(GolfSubstituteSchemaRef).openapi({
    title: 'GolfSubstituteList',
    description: 'List of golf substitutes',
  });

  const AvailablePlayerListSchemaRef = z.array(AvailablePlayerSchemaRef).openapi({
    title: 'AvailablePlayerList',
    description: 'List of available players',
  });

  const CreateGolfPlayerWithSeasonSchemaRef = CreateGolfPlayerSchema.extend({
    seasonId: z.string().openapi({ description: 'Season ID for the roster entry' }),
  }).openapi({
    title: 'CreateGolfPlayerWithSeason',
    description: 'Data required to create a new golf player with season context',
  });

  const SignPlayerWithSeasonSchemaRef = SignPlayerSchema.extend({
    seasonId: z.string().openapi({ description: 'Season ID for the roster entry' }),
  }).openapi({
    title: 'SignPlayerWithSeason',
    description: 'Data for signing an existing contact to a golf team with season context',
  });

  const ReleasePlayerWithSeasonSchemaRef = ReleasePlayerSchema.extend({
    seasonId: z.string().openapi({ description: 'Season ID for the roster entry' }),
  }).openapi({
    title: 'ReleasePlayerWithSeason',
    description: 'Options for releasing a player from a team with season context',
  });

  // GET /api/accounts/{accountId}/golf/rosters/team/{teamSeasonId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/rosters/team/{teamSeasonId}',
    description: 'Get roster for a specific team',
    operationId: 'getGolfTeamRoster',
    summary: 'Get team roster',
    tags: ['Golf Rosters'],
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
        description: 'Team roster',
        content: {
          'application/json': {
            schema: GolfRosterEntryListSchemaRef,
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

  // GET /api/accounts/{accountId}/golf/rosters/substitutes/season/{seasonId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/rosters/substitutes/season/{seasonId}',
    description: 'List all substitutes for a season',
    operationId: 'listGolfSubstitutesForSeason',
    summary: 'List season substitutes',
    tags: ['Golf Rosters'],
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

  // GET /api/accounts/{accountId}/golf/rosters/substitutes/flight/{flightId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/rosters/substitutes/flight/{flightId}',
    description: 'List substitutes for a specific flight',
    operationId: 'listGolfSubstitutesForFlight',
    summary: 'List flight substitutes',
    tags: ['Golf Rosters'],
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
        description: 'List of substitutes in the flight',
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

  // GET /api/accounts/{accountId}/golf/rosters/available/{seasonId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/rosters/available/{seasonId}',
    description: 'List contacts available to be signed to a golf team',
    operationId: 'listAvailableGolfPlayers',
    summary: 'List available players',
    tags: ['Golf Rosters'],
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
        description: 'List of available players',
        content: {
          'application/json': {
            schema: AvailablePlayerListSchemaRef,
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

  // GET /api/accounts/{accountId}/golf/rosters/{rosterId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/rosters/{rosterId}',
    description: 'Get a specific roster entry',
    operationId: 'getGolfRosterEntry',
    summary: 'Get roster entry',
    tags: ['Golf Rosters'],
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
        name: 'rosterId',
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
        description: 'Roster entry details',
        content: {
          'application/json': {
            schema: GolfRosterEntrySchemaRef,
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
        description: 'Roster entry not found',
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

  // POST /api/accounts/{accountId}/golf/rosters/team/{teamSeasonId}/create
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/rosters/team/{teamSeasonId}/create',
    description: 'Create a new player and add them to a team roster',
    operationId: 'createAndSignGolfPlayer',
    summary: 'Create and sign player',
    tags: ['Golf Rosters'],
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
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateGolfPlayerWithSeasonSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Player created and signed',
        content: {
          'application/json': {
            schema: GolfRosterEntrySchemaRef,
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

  // POST /api/accounts/{accountId}/golf/rosters/team/{teamSeasonId}/sign
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/rosters/team/{teamSeasonId}/sign',
    description: 'Sign an existing contact to a team roster',
    operationId: 'signGolfPlayer',
    summary: 'Sign player to team',
    tags: ['Golf Rosters'],
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
    request: {
      body: {
        content: {
          'application/json': {
            schema: SignPlayerWithSeasonSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Player signed to team',
        content: {
          'application/json': {
            schema: GolfRosterEntrySchemaRef,
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
        description: 'Team or contact not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Player already on roster',
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

  // PUT /api/accounts/{accountId}/golf/rosters/{rosterId}
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/golf/rosters/{rosterId}',
    description: 'Update a player on the roster',
    operationId: 'updateGolfPlayer',
    summary: 'Update player',
    tags: ['Golf Rosters'],
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
        name: 'rosterId',
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
            schema: UpdateGolfPlayerSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Player updated',
        content: {
          'application/json': {
            schema: GolfRosterEntrySchemaRef,
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
        description: 'Roster entry not found',
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

  // POST /api/accounts/{accountId}/golf/rosters/{rosterId}/release
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/rosters/{rosterId}/release',
    description: 'Release a player from a team',
    operationId: 'releaseGolfPlayer',
    summary: 'Release player',
    tags: ['Golf Rosters'],
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
        name: 'rosterId',
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
            schema: ReleasePlayerWithSeasonSchemaRef,
          },
        },
      },
    },
    responses: {
      204: {
        description: 'Player released',
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
        description: 'Roster entry not found',
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

  // DELETE /api/accounts/{accountId}/golf/rosters/{rosterId}
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/golf/rosters/{rosterId}',
    description: 'Delete a player from the roster entirely',
    operationId: 'deleteGolfPlayer',
    summary: 'Delete player',
    tags: ['Golf Rosters'],
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
        name: 'rosterId',
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
        description: 'Player deleted',
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
        description: 'Roster entry not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Cannot delete player with match scores',
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

export default registerGolfRostersEndpoints;
