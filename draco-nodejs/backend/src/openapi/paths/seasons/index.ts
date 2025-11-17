import { RegisterContext } from '../../openapiTypes.js';

export const registerSeasonEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    ConflictErrorSchemaRef,
    InternalServerErrorSchemaRef,
    LeagueSeasonWithDivisionSchemaRef,
    NotFoundErrorSchemaRef,
    SeasonCopyResponseSchemaRef,
    SeasonParticipantCountDataSchemaRef,
    CurrentSeasonResponseSchemaRef,
    SeasonSchemaRef,
    UpsertSeasonSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  /**
   * GET /api/accounts/:accountId/seasons
   * Retrieve all seasons for an account with optional division information.
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons',
    operationId: 'listAccountSeasons',
    summary: 'List account seasons',
    description:
      'Fetch all seasons for the account. Optionally include division assignments for each league season.',
    tags: ['Seasons'],
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
        name: 'includeDivisions',
        in: 'query',
        required: false,
        schema: {
          type: 'boolean',
          default: false,
        },
        description: 'Include division assignments for each league season when true.',
      },
    ],
    responses: {
      200: {
        description: 'Seasons for the account with optional league and division data.',
        content: {
          'application/json': {
            schema: LeagueSeasonWithDivisionSchemaRef.array(),
          },
        },
      },
      500: {
        description: 'Unexpected error while listing seasons.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/seasons/current
   * Retrieve the current season for an account.
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/current',
    operationId: 'getCurrentSeason',
    summary: 'Get current season',
    description:
      "Return the account's current season. League assignments can be included with the includeLeagues query parameter.",
    tags: ['Seasons'],
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
        name: 'includeLeagues',
        in: 'query',
        required: false,
        schema: {
          type: 'boolean',
          default: false,
        },
        description: 'Include league assignments for the season when true.',
      },
      {
        name: 'includeDivisions',
        in: 'query',
        required: false,
        schema: {
          type: 'boolean',
          default: false,
        },
        description: 'Include division assignments for each league when includeLeagues is true.',
      },
    ],
    responses: {
      200: {
        description: 'Current season for the account.',
        content: {
          'application/json': {
            schema: CurrentSeasonResponseSchemaRef,
          },
        },
      },
      404: {
        description: 'No current season is configured for the account.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected error while retrieving the current season.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/seasons/:seasonId
   * Retrieve a specific season within an account.
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}',
    operationId: 'getAccountSeason',
    summary: 'Get season',
    description: 'Fetch a season and its league assignments within the account.',
    tags: ['Seasons'],
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
        description: 'Season and its league assignments.',
        content: {
          'application/json': {
            schema: LeagueSeasonWithDivisionSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required to access the season.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions to view the season.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Season not found for the account.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected error while retrieving the season.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * POST /api/accounts/:accountId/seasons
   * Create a new season for an account.
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons',
    operationId: 'createAccountSeason',
    summary: 'Create season',
    description:
      'Create a season for the account. Only account administrators may perform this action.',
    tags: ['Seasons'],
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
        content: {
          'application/json': {
            schema: UpsertSeasonSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Season created successfully.',
        content: {
          'application/json': {
            schema: LeagueSeasonWithDivisionSchemaRef,
          },
        },
      },
      400: {
        description: 'Season name is missing or invalid.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required to create a season.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions to create a season.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'A season with the same name already exists for the account.',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected error while creating the season.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * PUT /api/accounts/:accountId/seasons/:seasonId
   * Update the name of a season.
   */
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/seasons/{seasonId}',
    operationId: 'updateAccountSeason',
    summary: 'Update season',
    description:
      'Rename a season in the account. Only account administrators may perform this action.',
    tags: ['Seasons'],
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
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpsertSeasonSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Season updated successfully.',
        content: {
          'application/json': {
            schema: SeasonSchemaRef,
          },
        },
      },
      400: {
        description: 'Season name is missing or invalid.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required to update the season.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions to update the season.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Season not found for the account.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Another season with the requested name already exists.',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected error while updating the season.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * POST /api/accounts/:accountId/seasons/:seasonId/copy
   * Create a copy of a season.
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/copy',
    operationId: 'copyAccountSeason',
    summary: 'Copy season',
    description:
      'Copy an existing season including leagues, divisions, team seasons, active rosters, and manager assignments.',
    tags: ['Seasons'],
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
      201: {
        description:
          'Season copied successfully with duplicated leagues, divisions, teams, active rosters, and team managers.',
        content: {
          'application/json': {
            schema: SeasonCopyResponseSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required to copy the season.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions to copy the season.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Source season not found for the account.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'A copied season with the generated name already exists.',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected error while copying the season.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * POST /api/accounts/:accountId/seasons/:seasonId/set-current
   * Mark a season as the current season for an account.
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/set-current',
    operationId: 'setCurrentAccountSeason',
    summary: 'Set current season',
    description: 'Designate a season as the current season for the account.',
    tags: ['Seasons'],
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
        description: 'Season has been set as current.',
        content: {
          'application/json': {
            schema: SeasonSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required to set the current season.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions to set the current season.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Season not found for the account.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected error while setting the current season.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * DELETE /api/accounts/:accountId/seasons/:seasonId
   * Delete a season from the account.
   */
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/seasons/{seasonId}',
    operationId: 'deleteAccountSeason',
    summary: 'Delete season',
    description:
      'Delete a season from the account. The season must not be the current season and may fail if related data exists.',
    tags: ['Seasons'],
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
        description: 'Season deleted successfully.',
        content: {
          'application/json': {
            schema: z.boolean(),
          },
        },
      },
      400: {
        description: 'Season cannot be deleted in its current state.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required to delete the season.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions to delete the season.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Season not found for the account.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected error while deleting the season.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/seasons/:seasonId/participants/count
   * Retrieve the participant count for a season.
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/participants/count',
    operationId: 'getSeasonParticipantCount',
    summary: 'Get season participant count',
    description: 'Return the number of participants (contacts) assigned to the season.',
    tags: ['Seasons'],
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
        description: 'Participant count for the season.',
        content: {
          'application/json': {
            schema: SeasonParticipantCountDataSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required to view the participant count.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions to view the participant count.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Season not found for the account.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected error while retrieving the participant count.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });
};

export default registerSeasonEndpoints;
