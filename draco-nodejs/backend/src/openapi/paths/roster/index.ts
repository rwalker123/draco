import { RegisterContext } from '../../openapiTypes.js';

export const registerRosterEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    RosterMemberSchemaRef,
    SignRosterMemberSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  // POST /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster',
    description: 'Sign a player to the team roster',
    operationId: 'signPlayer',
    summary: 'Sing player to roster',
    security: [{ bearerAuth: [] }],
    tags: ['Roster'],
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
            schema: SignRosterMemberSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Player signed to roster',
        content: {
          'application/json': {
            schema: RosterMemberSchemaRef,
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
        description: 'Contact not found',
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

  // PUT /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster/{rosterMemberId}/release
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster/{rosterMemberId}/release',
    description: 'Release a player from the team for the given season',
    operationId: 'releasePlayer',
    security: [{ bearerAuth: [] }],
    tags: ['Roster'],
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
        name: 'rosterMemberId',
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
        description: 'Player released',
        content: {
          'application/json': {
            schema: RosterMemberSchemaRef,
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
        description: 'Player not found',
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

  // PUT /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster/{rosterMemberId}/activate
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster/{rosterMemberId}/activate',
    description: 'Activate a released player from the team for the given season',
    operationId: 'activatePlayer',
    security: [{ bearerAuth: [] }],
    tags: ['Roster'],
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
        name: 'rosterMemberId',
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
        description: 'Player activated',
        content: {
          'application/json': {
            schema: RosterMemberSchemaRef,
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
        description: 'Player not found',
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

  // DELETE /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster/{rosterMemberId}/activate
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster/{rosterMemberId}',
    description:
      'Delete a player from the team for the given season. This is a permanent action and cannot be undone. Use releasePlayer if you want to keep the player stats for the given team season.',
    operationId: 'deletePlayer',
    security: [{ bearerAuth: [] }],
    tags: ['Roster'],
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
        name: 'rosterMemberId',
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
        description: 'Player deleted',
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
        description: 'Player not found',
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

export default registerRosterEndpoints;
