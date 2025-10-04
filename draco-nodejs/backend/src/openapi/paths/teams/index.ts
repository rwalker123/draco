import { RegisterContext } from '../../openapiTypes.js';

export const registerTeamsEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    LeagueSchemaRef,
    NotFoundErrorSchemaRef,
    TeamSeasonRecordSchemaRef,
    TeamSeasonSchemaRef,
    UpsertTeamSeasonSchemaRef,
    UpsertTeamSeasonWithLogoSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  // GET /api/accounts/{accountId}/seasons/{seasonId}/teams
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams',
    operationId: 'listSeasonTeams',
    summary: 'List teams for a season',
    description: 'Retrieves all teams configured for the specified season.',
    tags: ['Teams'],
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
        description: 'Teams retrieved successfully.',
        content: {
          'application/json': {
            schema: TeamSeasonSchemaRef.array(),
          },
        },
      },
      404: {
        description: 'Season not found for the provided identifiers.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while retrieving teams.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/league
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/league',
    operationId: 'getTeamSeasonLeague',
    summary: 'Get team league details',
    description: 'Retrieves the league information linked to the specified team season.',
    tags: ['Teams'],
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
        description: 'League information retrieved successfully.',
        content: {
          'application/json': {
            schema: LeagueSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Account admin permission required.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'League information not found for the provided team season.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while retrieving league information.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}',
    operationId: 'getTeamSeasonDetails',
    summary: 'Get team season details',
    description: 'Retrieves detailed information and the current record for a team season.',
    tags: ['Teams'],
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
        description: 'Team season details retrieved successfully.',
        content: {
          'application/json': {
            schema: TeamSeasonRecordSchemaRef,
          },
        },
      },
      404: {
        description: 'Team season not found for the provided identifiers.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while retrieving team season details.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // PUT /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}',
    operationId: 'updateTeamSeason',
    summary: 'Update team season',
    description:
      'Updates team season metadata such as name and linked media. Supports optional logo uploads.',
    tags: ['Teams'],
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
            schema: UpsertTeamSeasonSchemaRef,
          },
          'multipart/form-data': {
            schema: UpsertTeamSeasonWithLogoSchemaRef,
            encoding: {
              logo: {
                contentType: 'image/*',
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Team season updated successfully.',
        content: {
          'application/json': {
            schema: TeamSeasonSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid update payload provided.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: "Missing 'account.manage' permission for the target account.",
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Team season not found for the provided identifiers.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while updating the team season.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/logo
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/logo',
    operationId: 'getTeamSeasonLogo',
    summary: 'Get team season logo',
    description: 'Retrieves the logo for the specified team season.',
    tags: ['Teams'],
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
        description: 'Logo retrieved successfully',
        content: {
          'image/png': {
            schema: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
      404: {
        description: 'Team logo not found',
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

export default registerTeamsEndpoints;
