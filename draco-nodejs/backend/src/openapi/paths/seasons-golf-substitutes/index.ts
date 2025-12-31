import { RegisterContext } from '../../openapiTypes.js';

export const registerSeasonsGolfSubstitutesEndpoints = ({
  registry,
  schemaRefs,
  z,
}: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    GolfSubstituteSchemaRef,
    InternalServerErrorSchemaRef,
  } = schemaRefs;

  const GolfSubstituteListSchemaRef = z.array(GolfSubstituteSchemaRef).openapi({
    title: 'GolfSubstituteList',
    description: 'List of golf substitutes',
  });

  // GET /api/accounts/{accountId}/seasons/{seasonId}/golf/substitutes
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/golf/substitutes',
    description: 'List all substitutes for a season',
    operationId: 'listGolfSubstitutesForSeason',
    summary: 'List season substitutes',
    tags: ['Golf Substitutes'],
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
};

export default registerSeasonsGolfSubstitutesEndpoints;
