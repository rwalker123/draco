import { RegisterContext } from '../../openapiTypes.js';

export const registerExportsEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    NotFoundErrorSchemaRef,
    InternalServerErrorSchemaRef,
  } = schemaRefs;

  const pathParams = [
    {
      name: 'accountId',
      in: 'path' as const,
      required: true,
      schema: { type: 'string' as const, format: 'number' },
    },
    {
      name: 'seasonId',
      in: 'path' as const,
      required: true,
      schema: { type: 'string' as const, format: 'number' },
    },
  ];

  const csvResponse = {
    200: {
      description: 'CSV file export',
      content: {
        'text/csv': {
          schema: { type: 'string' as const, format: 'binary' },
        },
      },
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
      description: 'Resource not found',
      content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
    },
  };

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster/export',
    description: 'Export team roster to CSV file',
    summary: 'Export team roster',
    operationId: 'exportTeamRoster',
    security: [{ bearerAuth: [] }],
    tags: ['Exports'],
    parameters: [
      ...pathParams,
      {
        name: 'teamSeasonId',
        in: 'path' as const,
        required: true,
        schema: { type: 'string' as const, format: 'number' },
      },
    ],
    responses: csvResponse,
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/roster/export',
    description: 'Export league roster to CSV file (deduplicated by contact)',
    summary: 'Export league roster',
    operationId: 'exportLeagueRoster',
    security: [{ bearerAuth: [] }],
    tags: ['Exports'],
    parameters: [
      ...pathParams,
      {
        name: 'leagueSeasonId',
        in: 'path' as const,
        required: true,
        schema: { type: 'string' as const, format: 'number' },
      },
    ],
    responses: csvResponse,
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/managers/export',
    description: 'Export league managers to CSV file',
    summary: 'Export league managers',
    operationId: 'exportLeagueManagers',
    security: [{ bearerAuth: [] }],
    tags: ['Exports'],
    parameters: [
      ...pathParams,
      {
        name: 'leagueSeasonId',
        in: 'path' as const,
        required: true,
        schema: { type: 'string' as const, format: 'number' },
      },
    ],
    responses: csvResponse,
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/roster/export',
    description: 'Export season roster to CSV file (all players, deduplicated)',
    summary: 'Export season roster',
    operationId: 'exportSeasonRoster',
    security: [{ bearerAuth: [] }],
    tags: ['Exports'],
    parameters: pathParams,
    responses: csvResponse,
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/managers/export',
    description: 'Export season managers to CSV file',
    summary: 'Export season managers',
    operationId: 'exportSeasonManagers',
    security: [{ bearerAuth: [] }],
    tags: ['Exports'],
    parameters: pathParams,
    responses: csvResponse,
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/contacts/export',
    description: 'Export account contacts to CSV file with optional filtering',
    summary: 'Export contacts',
    operationId: 'exportContacts',
    security: [{ bearerAuth: [] }],
    tags: ['Exports'],
    parameters: [
      {
        name: 'accountId',
        in: 'path' as const,
        required: true,
        schema: { type: 'string' as const, format: 'number' },
      },
      {
        name: 'searchTerm',
        in: 'query' as const,
        required: false,
        schema: { type: 'string' as const },
        description: 'Optional search term to filter contacts by name or email',
      },
      {
        name: 'onlyWithRoles',
        in: 'query' as const,
        required: false,
        schema: { type: 'string' as const, enum: ['true', 'false'] },
        description: 'If true, only export contacts that have roles assigned',
      },
    ],
    responses: csvResponse,
  });
};

export default registerExportsEndpoints;
