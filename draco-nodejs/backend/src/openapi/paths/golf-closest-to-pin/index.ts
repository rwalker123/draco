import { RegisterContext } from '../../openapiTypes.js';

export const registerGolfClosestToPinEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    GolfClosestToPinEntrySchemaRef,
    CreateGolfClosestToPinSchemaRef,
    UpdateGolfClosestToPinSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
  } = schemaRefs;

  const GolfClosestToPinEntryListSchemaRef = z.array(GolfClosestToPinEntrySchemaRef).openapi({
    title: 'GolfClosestToPinEntryList',
    description: 'List of closest to pin entries',
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/closest-to-pin/match/{matchId}',
    description: 'Get closest to pin entries for a match',
    operationId: 'getGolfClosestToPinForMatch',
    summary: 'Get match closest to pin entries',
    tags: ['Golf Closest To Pin'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'matchId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Closest to pin entries for the match',
        content: { 'application/json': { schema: GolfClosestToPinEntryListSchemaRef } },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Access denied',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/closest-to-pin/flight/{flightId}',
    description: 'Get closest to pin entries for a flight',
    operationId: 'getGolfClosestToPinForFlight',
    summary: 'Get flight closest to pin entries',
    tags: ['Golf Closest To Pin'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'flightId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Closest to pin entries for the flight',
        content: { 'application/json': { schema: GolfClosestToPinEntryListSchemaRef } },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Access denied',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/closest-to-pin/match/{matchId}',
    description: 'Create a closest to pin entry for a match',
    operationId: 'createGolfClosestToPin',
    summary: 'Create closest to pin entry',
    tags: ['Golf Closest To Pin'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'matchId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        content: { 'application/json': { schema: CreateGolfClosestToPinSchemaRef } },
      },
    },
    responses: {
      201: {
        description: 'Closest to pin entry created',
        content: { 'application/json': { schema: GolfClosestToPinEntrySchemaRef } },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Access denied',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/golf/closest-to-pin/{ctpId}',
    description: 'Update a closest to pin entry',
    operationId: 'updateGolfClosestToPin',
    summary: 'Update closest to pin entry',
    tags: ['Golf Closest To Pin'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'ctpId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        content: { 'application/json': { schema: UpdateGolfClosestToPinSchemaRef } },
      },
    },
    responses: {
      200: {
        description: 'Closest to pin entry updated',
        content: { 'application/json': { schema: GolfClosestToPinEntrySchemaRef } },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Access denied',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Entry not found',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/golf/closest-to-pin/{ctpId}',
    description: 'Delete a closest to pin entry',
    operationId: 'deleteGolfClosestToPin',
    summary: 'Delete closest to pin entry',
    tags: ['Golf Closest To Pin'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'ctpId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      204: {
        description: 'Closest to pin entry deleted',
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Access denied',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Entry not found',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });
};

export default registerGolfClosestToPinEndpoints;
