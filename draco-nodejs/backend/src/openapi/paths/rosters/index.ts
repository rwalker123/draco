import { RegisterContext } from '../../openapiTypes.js';

export const registerRostersEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    RosterMemberSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  // PUT /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster/{rosterMemberId}
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster/{rosterMemberId}',
    description: 'Update a roster entry for a team season',
    operationId: 'updateRosterMember',
    summary: 'Update roster entry',
    security: [{ bearerAuth: [] }],
    tags: ['Rosters'],
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
    request: {
      body: {
        content: {
          'application/json': {
            schema: RosterMemberSchemaRef.partial(),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Roster entry updated',
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
        description: 'Roster member or team not found',
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

export default registerRostersEndpoints;
