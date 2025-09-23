import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  ContactSchema,
  RosterMemberSchema,
  SignRosterMemberSchema,
  RosterPlayerSchema,
  ValidationErrorSchema,
  AuthenticationErrorSchema,
  AuthorizationErrorSchema,
  NotFoundErrorSchema,
  ConflictErrorSchema,
  InternalServerErrorSchema,
  CreateContactSchema,
  AccountSchema,
  AccountSearchQuerySchema,
  AccountDomainLookupHeadersSchema,
  SponsorSchema,
  SponsorListSchema,
  CreateSponsorSchema,
} from '@draco/shared-schemas';

const registry = new OpenAPIRegistry();

const RosterMemberSchemaRef = registry.register('RosterMember', RosterMemberSchema);
const RosterPlayerSchemaRef = registry.register('RosterPlayer', RosterPlayerSchema);
const SignRosterMemberSchemaRef = registry.register('SignRosterMember', SignRosterMemberSchema);
const ContactSchemaRef = registry.register('Contact', ContactSchema);
const CreateContactSchemaRef = registry.register('CreateContact', CreateContactSchema);
const AccountSchemaRef = registry.register('Account', AccountSchema);
const AccountSearchQuerySchemaRef = registry.register(
  'AccountSearchQuery',
  AccountSearchQuerySchema,
);
const AccountDomainLookupHeadersSchemaRef = registry.register(
  'AccountDomainLookupHeaders',
  AccountDomainLookupHeadersSchema,
);
const SponsorSchemaRef = registry.register('Sponsor', SponsorSchema);
const SponsorListSchemaRef = registry.register('SponsorList', SponsorListSchema);
const SponsorPayloadSchemaRef = registry.register(
  'SponsorPayload',
  CreateSponsorSchema.omit({ teamId: true, photo: true }),
);

// Register error schemas
const ValidationErrorSchemaRef = registry.register('ValidationError', ValidationErrorSchema);
const AuthenticationErrorSchemaRef = registry.register(
  'AuthenticationError',
  AuthenticationErrorSchema,
);
const AuthorizationErrorSchemaRef = registry.register(
  'AuthorizationError',
  AuthorizationErrorSchema,
);
const NotFoundErrorSchemaRef = registry.register('NotFoundError', NotFoundErrorSchema);
const ConflictErrorSchemaRef = registry.register('ConflictError', ConflictErrorSchema);
const InternalServerErrorSchemaRef = registry.register(
  'InternalServerError',
  InternalServerErrorSchema,
);

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// GET /api/accounts/search
registry.registerPath({
  method: 'get',
  path: '/api/accounts/search',
  operationId: 'searchAccounts',
  summary: 'Search accounts',
  description: 'Public search for accounts by name or type',
  tags: ['Accounts'],
  request: {
    query: AccountSearchQuerySchemaRef,
  },
  responses: {
    200: {
      description: 'Accounts matching the search query',
      content: {
        'application/json': {
          schema: AccountSchemaRef.array(),
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

// GET /api/accounts/by-domain
registry.registerPath({
  method: 'get',
  path: '/api/accounts/by-domain',
  operationId: 'getAccountByDomain',
  summary: 'Get account by domain',
  description: 'Public lookup of an account by inbound request host domain.',
  tags: ['Accounts'],
  request: {
    headers: AccountDomainLookupHeadersSchemaRef,
  },
  responses: {
    200: {
      description: 'Account matching the provided domain',
      content: {
        'application/json': {
          schema: AccountSchemaRef,
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
      description: 'Account not found for the provided domain',
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

// POST /api/accounts/{accountId}/contacts
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
// GET /api/accounts/{accountId}/sponsors
registry.registerPath({
  method: 'get',
  path: '/api/accounts/{accountId}/sponsors',
  description: 'List sponsors configured for an account',
  operationId: 'listAccountSponsors',
  summary: 'List account sponsors',
  tags: ['Sponsors'],
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
      description: 'Sponsors for the account',
      content: {
        'application/json': {
          schema: SponsorListSchemaRef,
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

// GET /api/accounts/{accountId}/sponsors/{sponsorId}
registry.registerPath({
  method: 'get',
  path: '/api/accounts/{accountId}/sponsors/{sponsorId}',
  description: 'Retrieve a single account-level sponsor',
  operationId: 'getAccountSponsor',
  summary: 'Get account sponsor',
  tags: ['Sponsors'],
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
      name: 'sponsorId',
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
      description: 'Sponsor details',
      content: {
        'application/json': {
          schema: SponsorSchemaRef,
        },
      },
    },
    404: {
      description: 'Sponsor not found',
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

// POST /api/accounts/{accountId}/sponsors
registry.registerPath({
  method: 'post',
  path: '/api/accounts/{accountId}/sponsors',
  description: 'Create an account sponsor',
  operationId: 'createAccountSponsor',
  summary: 'Create account sponsor',
  tags: ['Sponsors'],
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
        'multipart/form-data': {
          schema: SponsorPayloadSchemaRef.extend({
            photo: z.string().optional().openapi({
              type: 'string',
              format: 'binary',
              description: 'Sponsor photo file',
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
    201: {
      description: 'Sponsor created',
      content: {
        'application/json': {
          schema: SponsorSchemaRef,
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
      description: 'Access denied - sponsor management permission required',
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

// PUT /api/accounts/{accountId}/sponsors/{sponsorId}
registry.registerPath({
  method: 'put',
  path: '/api/accounts/{accountId}/sponsors/{sponsorId}',
  description: 'Update an account sponsor',
  operationId: 'updateAccountSponsor',
  summary: 'Update account sponsor',
  tags: ['Sponsors'],
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
      name: 'sponsorId',
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
        'multipart/form-data': {
          schema: SponsorPayloadSchemaRef.partial().extend({
            photo: z.string().optional().openapi({
              type: 'string',
              format: 'binary',
              description: 'Sponsor photo file',
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
      description: 'Sponsor updated',
      content: {
        'application/json': {
          schema: SponsorSchemaRef,
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
      description: 'Access denied - sponsor management permission required',
      content: {
        'application/json': {
          schema: AuthorizationErrorSchemaRef,
        },
      },
    },
    404: {
      description: 'Sponsor not found',
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

// DELETE /api/accounts/{accountId}/sponsors/{sponsorId}
registry.registerPath({
  method: 'delete',
  path: '/api/accounts/{accountId}/sponsors/{sponsorId}',
  description: 'Delete an account sponsor',
  operationId: 'deleteAccountSponsor',
  summary: 'Delete account sponsor',
  tags: ['Sponsors'],
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
      name: 'sponsorId',
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
      description: 'Sponsor deleted',
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
      description: 'Access denied - sponsor management permission required',
      content: {
        'application/json': {
          schema: AuthorizationErrorSchemaRef,
        },
      },
    },
    404: {
      description: 'Sponsor not found',
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

// GET /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/sponsors
registry.registerPath({
  method: 'get',
  path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/sponsors',
  description: 'List sponsors configured for a team season',
  operationId: 'listTeamSponsors',
  summary: 'List team sponsors',
  tags: ['Sponsors'],
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
    {
      name: 'teamSeasonId',
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
      description: 'Sponsors for the team',
      content: {
        'application/json': {
          schema: SponsorListSchemaRef,
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

// POST /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/sponsors
registry.registerPath({
  method: 'post',
  path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/sponsors',
  description: 'Create a team sponsor',
  operationId: 'createTeamSponsor',
  summary: 'Create team sponsor',
  tags: ['Sponsors'],
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
    {
      name: 'teamSeasonId',
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
        'multipart/form-data': {
          schema: SponsorPayloadSchemaRef.extend({
            photo: z.string().optional().openapi({
              type: 'string',
              format: 'binary',
              description: 'Sponsor photo file',
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
    201: {
      description: 'Sponsor created',
      content: {
        'application/json': {
          schema: SponsorSchemaRef,
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
      description: 'Access denied - team sponsor management permission required',
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

// PUT /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/sponsors/{sponsorId}
registry.registerPath({
  method: 'put',
  path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/sponsors/{sponsorId}',
  description: 'Update a team sponsor',
  operationId: 'updateTeamSponsor',
  summary: 'Update team sponsor',
  tags: ['Sponsors'],
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
    {
      name: 'teamSeasonId',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
        format: 'number',
      },
    },
    {
      name: 'sponsorId',
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
        'multipart/form-data': {
          schema: SponsorPayloadSchemaRef.partial().extend({
            photo: z.string().optional().openapi({
              type: 'string',
              format: 'binary',
              description: 'Sponsor photo file',
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
      description: 'Sponsor updated',
      content: {
        'application/json': {
          schema: SponsorSchemaRef,
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
      description: 'Access denied - team sponsor management permission required',
      content: {
        'application/json': {
          schema: AuthorizationErrorSchemaRef,
        },
      },
    },
    404: {
      description: 'Sponsor not found',
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

// DELETE /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/sponsors/{sponsorId}
registry.registerPath({
  method: 'delete',
  path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/sponsors/{sponsorId}',
  description: 'Delete a team sponsor',
  operationId: 'deleteTeamSponsor',
  summary: 'Delete team sponsor',
  tags: ['Sponsors'],
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
    {
      name: 'teamSeasonId',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
        format: 'number',
      },
    },
    {
      name: 'sponsorId',
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
      description: 'Sponsor deleted',
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
      description: 'Access denied - team sponsor management permission required',
      content: {
        'application/json': {
          schema: AuthorizationErrorSchemaRef,
        },
      },
    },
    404: {
      description: 'Sponsor not found',
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

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDoc = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'Draco API',
    version: '1.0.0',
  },
  servers: [
    {
      url: 'https://localhost:3001',
    },
  ],
});
// PUT /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster/{rosterMemberId}
registry.registerPath({
  method: 'put',
  path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster/{rosterMemberId}',
  description: 'Update a roster entry for a team season',
  operationId: 'updateRosterMember',
  summary: 'Update roster entry',
  security: [{ bearerAuth: [] }],
  tags: ['Rosters'],
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
    {
      name: 'teamSeasonId',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
        format: 'number',
      },
    },
    {
      name: 'rosterMemberId',
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
          schema: RosterMemberSchemaRef.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Roster entry updated',
      content: {
        'application/json': {
          schema: RosterMemberSchemaRef,
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

// POST /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster
registry.registerPath({
  method: 'post',
  path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster',
  description: 'Sign a player to the team roster',
  operationId: 'signPlayer',
  summary: 'Sing player to roster',
  security: [{ bearerAuth: [] }],
  tags: ['Roster'],
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
    {
      name: 'teamSeasonId',
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
          schema: SignRosterMemberSchemaRef,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Player signed to roster',
      content: {
        'application/json': {
          schema: RosterMemberSchemaRef,
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
