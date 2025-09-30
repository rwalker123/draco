import { RegisterContext } from '../../openapiTypes.js';

export const registerContactsEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    ConflictErrorSchemaRef,
    ContactSchemaRef,
    BaseContactSchemaRef,
    ContactValidationWithSignInSchemaRef,
    PagedContactSchemaRef,
    RegisteredUserSchemaRef,
    CreateContactSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    RosterPlayerSchemaRef,
    ValidationErrorSchemaRef,
    ContactSearchParamsSchemaRef,
  } = schemaRefs;

  /**
   * GET /api/accounts/:accountId/contacts/me
   * Get current user's contact
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/contacts/me',
    description: "Get current user's contact",
    operationId: 'getCurrentUserContact',
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
    responses: {
      200: {
        description: "Current user's contact",
        content: {
          'application/json': {
            schema: BaseContactSchemaRef,
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
    },
  });

  /**
   * POST /api/accounts/:accountId/contacts/me
   * Self-register a contact
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/contacts/me',
    description: 'Self-register a contact',
    operationId: 'selfRegisterContact',
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
            schema: ContactValidationWithSignInSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Contact created',
        content: {
          'application/json': {
            schema: RegisteredUserSchemaRef,
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

  /**
   * DELETE /api/accounts/:accountId/contacts/:contactId/registration
   * Unlink a contact from a user (clear userid) within an account
   */
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/contacts/{contactId}/registration',
    description: 'Unlink a contact from a user',
    operationId: 'unlinkContactFromUser',
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
      204: {
        description: 'Contact unlinked successfully',
        content: {
          'application/json': {
            schema: BaseContactSchemaRef,
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
    },
  });

  /**
   * GET /api/accounts/:accountId/contacts
   * Search contacts by name for autocomplete
   * Required query parameter: q=searchTerm
   * Optional query parameters:
   *   - roles=true to include contactroles data with role context
   *   - seasonId=123 to filter roles by season context (required for proper team/league role resolution)
   *   - contactDetails=true to include detailed contact information (phone, address, etc.)
   *   - onlyWithRoles=true to filter users who have at least one role
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/contacts',
    description: 'Search contacts by name for autocomplete',
    operationId: 'searchContacts',
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
        name: 'seasonId',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: { query: ContactSearchParamsSchemaRef },
    responses: {
      200: {
        description: 'List of matching contacts',
        content: {
          'application/json': {
            schema: PagedContactSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * POST /api/accounts/:accountId/contacts
   * Create a new contact
   */
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

  /**
   * POST /api/accounts/:accountId/registration
   * Register a new user or existing user
   * Query param "mode" must be 'newUser' or 'existingUser'
   * Body must match ContactValidationWithSignInSchema
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/registration',
    description: 'Register a new user or existing user',
    operationId: 'registerContact',
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
        name: 'mode',
        in: 'query',
        required: true,
        schema: {
          type: 'string',
          enum: ['newUser', 'existingUser'],
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: ContactValidationWithSignInSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Contact registered successfully',
        content: {
          'application/json': {
            schema: RegisteredUserSchemaRef,
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
        description: 'Account not found',
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
