import { RegisterContext } from '../../openapiTypes.js';

const registerAdminUsersEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AdminUserListResponseSchemaRef,
    AuthenticationErrorSchemaRef,
    ConflictErrorSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  registry.registerPath({
    method: 'get',
    path: '/api/admin/users',
    operationId: 'listAdminUsers',
    summary: 'List authentication users for global Administrator login management.',
    description:
      'Returns paged aspnetusers rows along with a per-user contact count. Filter to orphan users (zero linked contacts) via `orphansOnly=true`.',
    tags: ['Admin'],
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        search: z.string().trim().max(200).optional(),
        orphansOnly: z.coerce.boolean().optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
        offset: z.coerce.number().int().min(0).optional(),
      }),
    },
    responses: {
      200: {
        description: 'Paged admin user summaries.',
        content: {
          'application/json': {
            schema: AdminUserListResponseSchemaRef,
          },
        },
      },
      400: {
        description: 'Query parameters are invalid.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected error while listing admin users.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/admin/users/{userId}',
    operationId: 'deleteAdminUser',
    summary: 'Delete an authentication user (orphans only).',
    description:
      'Permanently removes an aspnetusers row. Refused with 409 when the user is still linked to one or more contacts.',
    tags: ['Admin'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        userId: z.string(),
      }),
    },
    responses: {
      204: {
        description: 'User deleted successfully.',
      },
      401: {
        description: 'Authentication required.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'User not found.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'User is still linked to one or more contacts.',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected error while deleting the user.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });
};

export default registerAdminUsersEndpoints;
