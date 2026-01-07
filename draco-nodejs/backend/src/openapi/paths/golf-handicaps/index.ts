import { RegisterContext } from '../../openapiTypes.js';

export default function registerGolfHandicapsEndpoints({ registry, schemaRefs }: RegisterContext) {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
    BatchCourseHandicapRequestSchemaRef,
    BatchCourseHandicapResponseSchemaRef,
    LeagueHandicapsSchemaRef,
  } = schemaRefs;

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/flights/{flightId}/handicaps',
    description: 'Get handicap listing for all players in a flight',
    operationId: 'getFlightHandicaps',
    summary: 'Get flight handicaps',
    tags: ['Golf Handicaps'],
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
        description: 'Handicap listing for all players in the flight',
        content: {
          'application/json': {
            schema: LeagueHandicapsSchemaRef,
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
        description: 'Not authorized to access this account',
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

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/handicaps/batch-course-handicaps',
    description: 'Calculate course handicaps for multiple golfers given a tee',
    operationId: 'calculateBatchCourseHandicaps',
    summary: 'Calculate batch course handicaps',
    tags: ['Golf Handicaps'],
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
            schema: BatchCourseHandicapRequestSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Course handicaps for all requested golfers',
        content: {
          'application/json': {
            schema: BatchCourseHandicapResponseSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid request body',
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
        description: 'Not authorized to access this account',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Tee or course not found',
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
}
