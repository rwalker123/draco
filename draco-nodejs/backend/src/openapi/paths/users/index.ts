import { RegisterContext } from '../../openapiTypes.js';

export const registerContactsEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    ValidationErrorSchemaRef,
    NotFoundErrorSchemaRef,
    CreateContactRoleSchemaRef,
    ContactRoleSchemaRef,
    ContactWithContactRolesSchemaRef,
    BaseRoleSchemaRef,
    RegisteredUserWithRolesSchemaRef,
    RoleCheckSchemaRef,
    RoleMetadataSchemaRef,
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

  /**
   * GET /api/roles/user-roles
   * Get current user's roles
   */
  registry.registerPath({
    method: 'get',
    path: '/api/roles/user-roles',
    description: "Get current user's roles",
    operationId: 'getCurrentUserRoles',
    security: [{ bearerAuth: [] }],
    tags: ['Users'],
    parameters: [
      {
        name: 'accountId',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      200: {
        description: "Current user's roles",
        content: {
          'application/json': {
            schema: RegisteredUserWithRolesSchemaRef,
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
   * GET /api/roles/check-role
   * Check if current user has a specific role
   */
  registry.registerPath({
    method: 'get',
    path: '/api/roles/check-role',
    description: 'Check if current user has a specific role',
    operationId: 'checkUserRole',
    security: [{ bearerAuth: [] }],
    tags: ['Users'],
    parameters: [
      {
        name: 'roleId',
        in: 'query',
        required: true,
        schema: {
          type: 'string',
        },
      },
      {
        name: 'accountId',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'teamId',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'leagueId',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      200: {
        description: 'Role check result',
        content: {
          'application/json': {
            schema: RoleCheckSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid request parameters',
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
        description: 'Insufficient permissions',
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

  /**
   * GET /api/roles/role-ids
   * Get all available roles
   */
  registry.registerPath({
    method: 'get',
    path: '/api/roles/role-ids',
    description: 'Get all available roles',
    operationId: 'listRoleIdentifiers',
    tags: ['Users'],
    responses: {
      200: {
        description: 'Available roles',
        content: {
          'application/json': {
            schema: BaseRoleSchemaRef.array(),
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
   * GET /api/roles/account-users/:accountId
   * Get all users with roles in a specific account
   */
  registry.registerPath({
    method: 'get',
    path: '/api/roles/account-users/{accountId}',
    description: 'Get all users with roles in a specific account',
    operationId: 'listAccountUsersWithRoles',
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
    ],
    responses: {
      200: {
        description: 'Users with roles for the account',
        content: {
          'application/json': {
            schema: ContactWithContactRolesSchemaRef.array(),
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
        description: 'Insufficient permissions',
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

  /**
   * GET /api/roles/roles/metadata
   * Get role metadata for frontend caching
   */
  registry.registerPath({
    method: 'get',
    path: '/api/roles/roles/metadata',
    description: 'Get role metadata for frontend caching',
    operationId: 'getRoleMetadata',
    security: [{ bearerAuth: [] }],
    tags: ['Users'],
    responses: {
      200: {
        description: 'Role metadata',
        content: {
          'application/json': {
            schema: RoleMetadataSchemaRef,
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
