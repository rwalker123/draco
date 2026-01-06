import { RegisterContext } from '../../openapiTypes.js';

export const registerGolfFlightsEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    GolfFlightSchemaRef,
    GolfFlightWithTeamCountSchemaRef,
    CreateGolfFlightSchemaRef,
    UpdateGolfFlightSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  const GolfFlightWithTeamCountListSchemaRef = z.array(GolfFlightWithTeamCountSchemaRef).openapi({
    title: 'GolfFlightWithTeamCountList',
    description: 'List of golf flights with team counts',
  });

  // GET /api/accounts/{accountId}/golf/flights/season/{seasonId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/flights/season/{seasonId}',
    description: 'List all flights for a golf season',
    operationId: 'listGolfFlights',
    summary: 'List flights for season',
    tags: ['Golf Flights'],
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
        description: 'List of flights with team counts',
        content: {
          'application/json': {
            schema: GolfFlightWithTeamCountListSchemaRef,
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

  // GET /api/accounts/{accountId}/golf/flights/{flightId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/flights/{flightId}',
    description: 'Get a specific golf flight by ID',
    operationId: 'getGolfFlight',
    summary: 'Get flight',
    tags: ['Golf Flights'],
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
        description: 'Flight details',
        content: {
          'application/json': {
            schema: GolfFlightSchemaRef,
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

  // POST /api/accounts/{accountId}/golf/flights/season/{seasonId}
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/flights/season/{seasonId}',
    description: 'Create a new flight in a season',
    operationId: 'createGolfFlight',
    summary: 'Create flight',
    tags: ['Golf Flights'],
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
            schema: CreateGolfFlightSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Flight created',
        content: {
          'application/json': {
            schema: GolfFlightSchemaRef,
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

  // PUT /api/accounts/{accountId}/golf/flights/{flightId}
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/golf/flights/{flightId}',
    description: 'Update an existing golf flight',
    operationId: 'updateGolfFlight',
    summary: 'Update flight',
    tags: ['Golf Flights'],
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
            schema: UpdateGolfFlightSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Flight updated',
        content: {
          'application/json': {
            schema: GolfFlightSchemaRef,
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

  // DELETE /api/accounts/{accountId}/golf/flights/{flightId}
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/golf/flights/{flightId}',
    description: 'Delete a golf flight',
    operationId: 'deleteGolfFlight',
    summary: 'Delete flight',
    tags: ['Golf Flights'],
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
      204: {
        description: 'Flight deleted',
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
      409: {
        description: 'Cannot delete flight because it has teams assigned',
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

export default registerGolfFlightsEndpoints;
