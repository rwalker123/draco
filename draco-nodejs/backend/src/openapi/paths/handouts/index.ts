import { RegisterContext } from '../../openapiTypes.js';

export const registerHandoutsEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    HandoutListSchemaRef,
    HandoutSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    UpsertHandoutSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  const handoutMultipartSchema = UpsertHandoutSchemaRef.extend({
    file: z.string().openapi({
      type: 'string',
      format: 'binary',
      description: 'Handout file to upload',
    }),
  });

  const handoutMultipartOptionalSchema = UpsertHandoutSchemaRef.extend({
    file: z
      .string()
      .openapi({
        type: 'string',
        format: 'binary',
        description: 'Optional replacement file for the handout',
      })
      .optional(),
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/handouts',
    summary: 'List account handouts',
    description: 'Retrieve all handouts published for an account.',
    operationId: 'listAccountHandouts',
    tags: ['Handouts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Handouts available to the account.',
        content: {
          'application/json': {
            schema: HandoutListSchemaRef,
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
    path: '/api/accounts/{accountId}/handouts',
    summary: 'Create account handout',
    description:
      'Upload a new handout for the account. Requires account handout management permissions.',
    operationId: 'createAccountHandout',
    tags: ['Handouts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: handoutMultipartSchema,
            encoding: {
              file: { contentType: 'application/octet-stream' },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Handout created successfully.',
        content: {
          'application/json': { schema: HandoutSchemaRef },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': { schema: AuthenticationErrorSchemaRef },
        },
      },
      403: {
        description: 'Permission denied',
        content: {
          'application/json': { schema: AuthorizationErrorSchemaRef },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/handouts/{handoutId}',
    summary: 'Update account handout',
    description: 'Update the description or replace the file for an existing account handout.',
    operationId: 'updateAccountHandout',
    tags: ['Handouts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'handoutId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: handoutMultipartOptionalSchema,
            encoding: {
              file: { contentType: 'application/octet-stream' },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated handout metadata.',
        content: {
          'application/json': { schema: HandoutSchemaRef },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': { schema: AuthenticationErrorSchemaRef },
        },
      },
      403: {
        description: 'Permission denied',
        content: {
          'application/json': { schema: AuthorizationErrorSchemaRef },
        },
      },
      404: {
        description: 'Handout not found',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/handouts/{handoutId}',
    summary: 'Delete account handout',
    description: 'Remove an account handout and its associated file.',
    operationId: 'deleteAccountHandout',
    tags: ['Handouts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'handoutId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      204: {
        description: 'Handout deleted successfully.',
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': { schema: AuthenticationErrorSchemaRef },
        },
      },
      403: {
        description: 'Permission denied',
        content: {
          'application/json': { schema: AuthorizationErrorSchemaRef },
        },
      },
      404: {
        description: 'Handout not found',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/handouts/{handoutId}/download',
    summary: 'Download account handout',
    description: 'Download the binary content of an account handout.',
    operationId: 'downloadAccountHandout',
    tags: ['Handouts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'handoutId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Handout file stream.',
        content: {
          'application/octet-stream': {
            schema: { type: 'string', format: 'binary' },
          },
        },
      },
      404: {
        description: 'Handout not found',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/teams/{teamId}/handouts',
    summary: 'List team handouts',
    description: 'Retrieve all handouts shared with a team.',
    operationId: 'listTeamHandouts',
    tags: ['Handouts'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      { name: 'teamId', in: 'path', required: true, schema: { type: 'string', format: 'number' } },
    ],
    responses: {
      200: {
        description: 'Handouts available to the team.',
        content: {
          'application/json': { schema: HandoutListSchemaRef },
        },
      },
      404: {
        description: 'Team not found',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/teams/{teamId}/handouts',
    summary: 'Create team handout',
    description:
      'Upload a handout that will be available to a specific team. Requires team handout management permissions.',
    operationId: 'createTeamHandout',
    tags: ['Handouts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      { name: 'teamId', in: 'path', required: true, schema: { type: 'string', format: 'number' } },
    ],
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: handoutMultipartSchema,
            encoding: {
              file: { contentType: 'application/octet-stream' },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Handout created for the team.',
        content: {
          'application/json': { schema: HandoutSchemaRef },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': { schema: AuthenticationErrorSchemaRef },
        },
      },
      403: {
        description: 'Permission denied',
        content: {
          'application/json': { schema: AuthorizationErrorSchemaRef },
        },
      },
      404: {
        description: 'Team not found',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/teams/{teamId}/handouts/{handoutId}',
    summary: 'Update team handout',
    description: 'Update metadata or replace the file for a team handout.',
    operationId: 'updateTeamHandout',
    tags: ['Handouts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      { name: 'teamId', in: 'path', required: true, schema: { type: 'string', format: 'number' } },
      {
        name: 'handoutId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: handoutMultipartOptionalSchema,
            encoding: {
              file: { contentType: 'application/octet-stream' },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated handout metadata.',
        content: {
          'application/json': { schema: HandoutSchemaRef },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': { schema: AuthenticationErrorSchemaRef },
        },
      },
      403: {
        description: 'Permission denied',
        content: {
          'application/json': { schema: AuthorizationErrorSchemaRef },
        },
      },
      404: {
        description: 'Handout or team not found',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/teams/{teamId}/handouts/{handoutId}',
    summary: 'Delete team handout',
    description: 'Remove a team handout and its associated file.',
    operationId: 'deleteTeamHandout',
    tags: ['Handouts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      { name: 'teamId', in: 'path', required: true, schema: { type: 'string', format: 'number' } },
      {
        name: 'handoutId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      204: {
        description: 'Handout deleted successfully.',
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': { schema: AuthenticationErrorSchemaRef },
        },
      },
      403: {
        description: 'Permission denied',
        content: {
          'application/json': { schema: AuthorizationErrorSchemaRef },
        },
      },
      404: {
        description: 'Handout or team not found',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/teams/{teamId}/handouts/{handoutId}/download',
    summary: 'Download team handout',
    description: 'Download the binary content of a team handout.',
    operationId: 'downloadTeamHandout',
    tags: ['Handouts'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      { name: 'teamId', in: 'path', required: true, schema: { type: 'string', format: 'number' } },
      {
        name: 'handoutId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Handout file stream.',
        content: {
          'application/octet-stream': {
            schema: { type: 'string', format: 'binary' },
          },
        },
      },
      404: {
        description: 'Handout or team not found',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });
};

export default registerHandoutsEndpoints;
