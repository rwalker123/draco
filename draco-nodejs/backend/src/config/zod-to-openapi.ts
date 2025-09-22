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
  TeamManagerSchema,
  CreateTeamManagerSchema,
  CreateContactSchema,
  AccountSchema,
  AccountSearchQuerySchema,
  AccountDomainLookupHeadersSchema,
} from '@draco/shared-schemas';

const registry = new OpenAPIRegistry();

const RosterMemberSchemaRef = registry.register('RosterMember', RosterMemberSchema);
const RosterPlayerSchemaRef = registry.register('RosterPlayer', RosterPlayerSchema);
const SignRosterMemberSchemaRef = registry.register('SignRosterMember', SignRosterMemberSchema);
const ContactSchemaRef = registry.register('Contact', ContactSchema);
const TeamManagerSchemaRef = registry.register('TeamManager', TeamManagerSchema);
const CreateTeamManagerSchemaRef = registry.register('CreateTeamManager', CreateTeamManagerSchema);
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

// GET /api/accounts/my-accounts
registry.registerPath({
  method: 'get',
  path: '/api/accounts/my-accounts',
  operationId: 'getMyAccounts',
  summary: "Get the authenticated user's accounts",
  description: 'Returns the accounts associated with the logged-in user via account membership.',
  tags: ['Accounts'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Accounts accessible to the authenticated user',
      content: {
        'application/json': {
          schema: AccountSchemaRef.array(),
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

// GET /api/accounts/managed
registry.registerPath({
  method: 'get',
  path: '/api/accounts/managed',
  operationId: 'getManagedAccounts',
  summary: 'Get accounts managed by the authenticated user',
  description:
    'Returns accounts where the user holds AccountAdmin privileges or is a global Administrator.',
  tags: ['Accounts'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Accounts managed by the authenticated user',
      content: {
        'application/json': {
          schema: AccountSchemaRef.array(),
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

// PUT /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster/{rosterMemberId}/release
registry.registerPath({
  method: 'put',
  path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster/{rosterMemberId}/release',
  description: 'Release a player from the team for the given season',
  operationId: 'releasePlayer',
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
  request: {},
  responses: {
    200: {
      description: 'Player released',
      content: {
        'application/json': {
          schema: RosterMemberSchemaRef,
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
      description: 'Player not found',
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

// PUT /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster/{rosterMemberId}/activate
registry.registerPath({
  method: 'put',
  path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster/{rosterMemberId}/activate',
  description: 'Activate a released player from the team for the given season',
  operationId: 'activatePlayer',
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
  request: {},
  responses: {
    200: {
      description: 'Player activated',
      content: {
        'application/json': {
          schema: RosterMemberSchemaRef,
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
      description: 'Player not found',
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

// DELETE /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster/{rosterMemberId}/activate
registry.registerPath({
  method: 'delete',
  path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/roster/{rosterMemberId}',
  description:
    'Delete a player from the team for the given season. This is a permanent action and cannot be undone. Use releasePlayer if you want to keep the player stats for the given team season.',
  operationId: 'deletePlayer',
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
  request: {},
  responses: {
    200: {
      description: 'Player deleted',
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
      description: 'Player not found',
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

// POST  `/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/managers`,
registry.registerPath({
  method: 'post',
  path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/managers',
  description: 'Add a manager to the team for the given season',
  operationId: 'addManager',
  security: [{ bearerAuth: [] }],
  tags: ['Managers'],
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
          schema: CreateTeamManagerSchemaRef,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Manager added',
      content: {
        'application/json': {
          schema: TeamManagerSchemaRef,
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
      description: 'Manager not found',
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

// DELETE /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/managers/{managerId}
registry.registerPath({
  method: 'delete',
  path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/managers/{managerId}',
  description: 'Remove a manager from the team for the given season',
  operationId: 'removeManager',
  security: [{ bearerAuth: [] }],
  tags: ['Managers'],
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
      name: 'managerId',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
        format: 'number',
      },
    },
  ],
  request: {},
  responses: {
    200: {
      description: 'Manager removed',
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
      description: 'Manager not found',
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
