import { CreateGolfPlayerSchema, SignPlayerSchema } from '@draco/shared-schemas';
import { RegisterContext } from '../../openapiTypes.js';

export const registerSeasonsGolfTeamRosterEndpoints = ({
  registry,
  schemaRefs,
  z,
}: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    GolfRosterEntrySchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  const GolfRosterEntryListSchemaRef = z.array(GolfRosterEntrySchemaRef).openapi({
    title: 'GolfRosterEntryList',
    description: 'List of golf roster entries',
  });

  const CreateGolfPlayerSchemaRef = CreateGolfPlayerSchema.openapi({
    title: 'CreateGolfPlayer',
    description: 'Data required to create a new golf player',
  });

  const SignPlayerSchemaRef = SignPlayerSchema.openapi({
    title: 'SignPlayer',
    description: 'Data for signing an existing contact to a golf team',
  });

  // GET /api/accounts/{accountId}/seasons/{seasonId}/golf/teams/{teamSeasonId}/roster
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/golf/teams/{teamSeasonId}/roster',
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

  // POST /api/accounts/{accountId}/seasons/{seasonId}/golf/teams/{teamSeasonId}/roster
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/golf/teams/{teamSeasonId}/roster',
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
            schema: CreateGolfPlayerSchemaRef,
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

  // POST /api/accounts/{accountId}/seasons/{seasonId}/golf/teams/{teamSeasonId}/roster/sign
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/golf/teams/{teamSeasonId}/roster/sign',
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
            schema: SignPlayerSchemaRef,
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
};

export default registerSeasonsGolfTeamRosterEndpoints;
