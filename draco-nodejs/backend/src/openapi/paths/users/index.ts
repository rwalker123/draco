import { RegisterContext } from '../../openapiTypes.js';

export const registerContactsEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    CreateContactRoleSchemaRef,
    ContactRoleSchemaRef,
  } = schemaRefs;

  /**`
   * POST /api/accounts/:accountId/users/:contactId/roles
   * Assign role to user in account (Account Admin or Administrator)
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/users/{userId}/roles',
    description: 'Assign role to user in account',
    operationId: 'assignRoleToUser',
    security: [{ bearerAuth: [] }],
    tags: ['Users'],
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
        name: 'userId',
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
            schema: CreateContactRoleSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Role assigned successfully',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
            }),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'User not found',
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

  /**
   * DELETE /api/accounts/:accountId/users/:contactId/roles/:roleId
   * Remove role from user in account (Account Admin or Administrator)
   */
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/users/{userId}/roles/{roleId}',
    description: 'Remove role from user in account',
    operationId: 'removeRoleFromUser',
    security: [{ bearerAuth: [] }],
    tags: ['Users'],
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
        name: 'userId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'roleId',
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
        description: 'Role removed successfully',
        content: {
          'application/json': {
            schema: ContactRoleSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'User not found',
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

export default registerContactsEndpoints;
