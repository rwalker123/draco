import { RegisterContext } from '../../openapiTypes.js';

export const registerContactsEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    ConflictErrorSchemaRef,
    ContactSchemaRef,
    CreateContactSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    RosterPlayerSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/contacts',
    description: 'Create a new contact',
    operationId: 'createContact',
    security: [{ bearerAuth: [] }],
    tags: ['Contacts'],
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
            schema: CreateContactSchemaRef.partial(),
          },
          'multipart/form-data': {
            schema: CreateContactSchemaRef.partial().extend({
              photo: z.string().optional().openapi({
                type: 'string',
                format: 'binary',
                description: 'Contact photo file',
              }),
            }),
            encoding: {
              photo: {
                contentType: 'image/*',
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Contact created',
        content: {
          'application/json': {
            schema: ContactSchemaRef,
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
        description: 'Access denied - Account admin required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Contact not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Conflict error - e.g. duplicate email',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
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

  // PUT /api/accounts/{accountId}/contacts/{contactId}
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/contacts/{contactId}',
    description: 'Update an account contact',
    operationId: 'updateContact',
    summary: 'Update Contact',
    security: [{ bearerAuth: [] }],
    tags: ['Contacts'],
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
        name: 'contactId',
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
            schema: CreateContactSchemaRef.partial(),
          },
          'multipart/form-data': {
            schema: CreateContactSchemaRef.partial().extend({
              photo: z.string().optional().openapi({
                type: 'string',
                format: 'binary',
                description: 'Contact photo file',
              }),
            }),
            encoding: {
              photo: {
                contentType: 'image/*',
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Contact updated',
        content: {
          'application/json': {
            schema: ContactSchemaRef,
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
        description: 'Access denied - Account admin required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Contact not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Conflict error - e.g. duplicate email',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
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

  // DELETE /api/accounts/{accountId}/contacts/{contactId}/photo
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/contacts/{contactId}/photo',
    description: 'Delete a contact photo',
    operationId: 'deleteContactPhoto',
    security: [{ bearerAuth: [] }],
    tags: ['Contacts'],
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
        name: 'contactId',
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
        description: 'Contact photo deleted',
        content: {
          'application/json': {
            schema: z.string(),
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
        description: 'Access denied - Account admin required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Contact not found',
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

  // GET /api/accounts/{accountId}/contacts/{contactId}/roster
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/contacts/{contactId}/roster',
    description:
      'Get a roster entry for a contact. This is information that is global to a player once they are on a team, it is not season specfic',
    operationId: 'getContactRoster',
    tags: ['Contacts'],
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
        name: 'contactId',
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
        description: 'Roster entry found',
        content: {
          'application/json': {
            schema: RosterPlayerSchemaRef,
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
      404: {
        description: 'Roster member or team not found',
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
