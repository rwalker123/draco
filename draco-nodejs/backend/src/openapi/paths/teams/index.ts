import { RegisterContext } from '../../openapiTypes.js';

export const registerTeamsEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const { InternalServerErrorSchemaRef, NotFoundErrorSchemaRef } = schemaRefs;

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
