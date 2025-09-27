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
  SponsorSchema,
  SponsorListSchema,
  CreateSponsorSchema,
  AccountWithSeasonsSchema,
  AccountDetailsQuerySchema,
  CreateAccountSchema,
  AccountNameSchema,
  AccountHeaderSchema,
  AccountAffiliationSchema,
  PlayersWantedClassifiedSchema,
  PlayersWantedClassifiedPagedSchema,
  UpsertPlayersWantedClassifiedSchema,
  PlayerClassifiedSearchQuerySchema,
  TeamsWantedPublicClassifiedPagedSchema,
  TeamsWantedOwnerClassifiedSchema,
  UpsertTeamsWantedClassifiedSchema,
  TeamsWantedAccessCodeSchema,
  TeamsWantedContactInfoSchema,
  TeamsWantedContactQuerySchema,
  ContactPlayersWantedCreatorSchema,
  BaseballPositionSchema,
  ExperienceLevelSchema,
  AccountPollSchema,
  CreatePollSchema,
  UpdatePollSchema,
  PollVoteRequestSchema,
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
const AccountWithSeasonsSchemaRef = registry.register(
  'AccountWithSeasons',
  AccountWithSeasonsSchema,
);
const AccountDetailsQuerySchemaRef = registry.register(
  'AccountDetailsQuery',
  AccountDetailsQuerySchema,
);
const CreateAccountSchemaRef = registry.register('CreateAccount', CreateAccountSchema);
const AccountNameSchemaRef = registry.register('AccountName', AccountNameSchema);
const AccountHeaderSchemaRef = registry.register('AccountHeader', AccountHeaderSchema);
const AccountAffiliationSchemaRef = registry.register(
  'AccountAffiliation',
  AccountAffiliationSchema,
);
const SponsorSchemaRef = registry.register('Sponsor', SponsorSchema);
const SponsorListSchemaRef = registry.register('SponsorList', SponsorListSchema);
const CreateSponsorSchemaRef = registry.register('CreateSponsor', CreateSponsorSchema);
const PlayersWantedClassifiedSchemaRef = registry.register(
  'PlayersWantedClassified',
  PlayersWantedClassifiedSchema,
);
const PlayersWantedClassifiedPagedSchemaRef = registry.register(
  'PlayersWantedClassifiedPaged',
  PlayersWantedClassifiedPagedSchema,
);
const UpsertPlayersWantedClassifiedSchemaRef = registry.register(
  'UpsertPlayersWantedClassified',
  UpsertPlayersWantedClassifiedSchema,
);
const PlayerClassifiedSearchQuerySchemaRef = registry.register(
  'PlayerClassifiedSearchQuery',
  PlayerClassifiedSearchQuerySchema,
);
const TeamsWantedPublicClassifiedPagedSchemaRef = registry.register(
  'TeamsWantedPublicClassifiedPaged',
  TeamsWantedPublicClassifiedPagedSchema,
);
const TeamsWantedOwnerClassifiedSchemaRef = registry.register(
  'TeamsWantedOwnerClassified',
  TeamsWantedOwnerClassifiedSchema,
);
const UpsertTeamsWantedClassifiedSchemaRef = registry.register(
  'UpsertTeamsWantedClassified',
  UpsertTeamsWantedClassifiedSchema,
);
const TeamsWantedAccessCodeSchemaRef = registry.register(
  'TeamsWantedAccessCode',
  TeamsWantedAccessCodeSchema,
);
const TeamsWantedContactInfoSchemaRef = registry.register(
  'TeamsWantedContactInfo',
  TeamsWantedContactInfoSchema,
);
const TeamsWantedContactQuerySchemaRef = registry.register(
  'TeamsWantedContactQuery',
  TeamsWantedContactQuerySchema,
);
const ContactPlayersWantedCreatorSchemaRef = registry.register(
  'ContactPlayersWantedCreator',
  ContactPlayersWantedCreatorSchema,
);
const BaseballPositionSchemaRef = registry.register('BaseballPosition', BaseballPositionSchema);
const ExperienceLevelSchemaRef = registry.register('ExperienceLevel', ExperienceLevelSchema);
const AccountPollSchemaRef = registry.register('AccountPoll', AccountPollSchema);
const CreatePollSchemaRef = registry.register('CreatePoll', CreatePollSchema);
const UpdatePollSchemaRef = registry.register('UpdatePoll', UpdatePollSchema);
const PollVoteRequestSchemaRef = registry.register('PollVoteRequest', PollVoteRequestSchema);

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

// GET /api/accounts/{accountId}
registry.registerPath({
  method: 'get',
  path: '/api/accounts/{accountId}',
  operationId: 'getAccountById',
  summary: 'Get account by ID',
  description: 'Retrieve account details and optional current season information.',
  tags: ['Accounts'],
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
    query: AccountDetailsQuerySchemaRef,
  },
  responses: {
    200: {
      description: 'Account details',
      content: {
        'application/json': {
          schema: AccountWithSeasonsSchemaRef,
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

// POST /api/accounts
registry.registerPath({
  method: 'post',
  path: '/api/accounts',
  operationId: 'createAccount',
  summary: 'Create account',
  description: 'Create a new account. Administrator access required.',
  tags: ['Accounts'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateAccountSchemaRef,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Account created',
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
    401: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: AuthenticationErrorSchemaRef,
        },
      },
    },
    403: {
      description: 'Forbidden',
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

// PUT /api/accounts/{accountId}
registry.registerPath({
  method: 'put',
  path: '/api/accounts/{accountId}',
  operationId: 'updateAccount',
  summary: 'Update account',
  description: 'Update account details. Account administrators or global administrators only.',
  tags: ['Accounts'],
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
        'application/json': {
          schema: CreateAccountSchemaRef.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Account updated',
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
    401: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: AuthenticationErrorSchemaRef,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: AuthorizationErrorSchemaRef,
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

// DELETE /api/accounts/{accountId}
registry.registerPath({
  method: 'delete',
  path: '/api/accounts/{accountId}',
  operationId: 'deleteAccount',
  summary: 'Delete account',
  description: 'Delete an account. Administrator access required.',
  tags: ['Accounts'],
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
  responses: {
    204: {
      description: 'Account deleted',
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
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: AuthorizationErrorSchemaRef,
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

// GET /api/accounts/{accountId}/name
registry.registerPath({
  method: 'get',
  path: '/api/accounts/{accountId}/name',
  operationId: 'getAccountName',
  summary: 'Get account name',
  description: 'Retrieve the display name for an account.',
  tags: ['Accounts'],
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
      description: 'Account name',
      content: {
        'application/json': {
          schema: AccountNameSchemaRef,
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

// GET /api/accounts/{accountId}/header
registry.registerPath({
  method: 'get',
  path: '/api/accounts/{accountId}/header',
  operationId: 'getAccountHeader',
  summary: 'Get account header',
  description: 'Retrieve account name and branding assets.',
  tags: ['Accounts'],
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
      description: 'Account header information',
      content: {
        'application/json': {
          schema: AccountHeaderSchemaRef,
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

// GET /api/accounts/types
registry.registerPath({
  method: 'get',
  path: '/api/accounts/types',
  operationId: 'getAccountTypes',
  summary: 'List account types',
  description: 'Retrieve the list of available account types.',
  tags: ['Accounts'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Account types list',
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

// GET /api/accounts/affiliations
registry.registerPath({
  method: 'get',
  path: '/api/accounts/affiliations',
  operationId: 'getAccountAffiliations',
  summary: 'List account affiliations',
  description: 'Retrieve the list of available account affiliations.',
  tags: ['Accounts'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Account affiliations list',
      content: {
        'application/json': {
          schema: AccountAffiliationSchemaRef.array(),
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
          schema: CreateSponsorSchemaRef.extend({
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
          schema: CreateSponsorSchemaRef.partial().extend({
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
          schema: CreateSponsorSchemaRef.partial().extend({
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
          schema: CreateSponsorSchemaRef.partial().extend({
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

// Player Classifieds routes
registry.registerPath({
  method: 'post',
  path: '/api/accounts/{accountId}/player-classifieds/players-wanted',
  operationId: 'createPlayersWantedClassified',
  summary: 'Create Players Wanted classified',
  description: 'Create a Players Wanted classified for an authenticated account member.',
  tags: ['Player Classifieds'],
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
        'application/json': {
          schema: UpsertPlayersWantedClassifiedSchemaRef,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Players Wanted classified created',
      content: {
        'application/json': {
          schema: PlayersWantedClassifiedSchemaRef,
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
      description: 'Access denied',
      content: {
        'application/json': {
          schema: AuthorizationErrorSchemaRef,
        },
      },
    },
    404: {
      description: 'Account or contact not found',
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

registry.registerPath({
  method: 'post',
  path: '/api/accounts/{accountId}/player-classifieds/teams-wanted',
  operationId: 'createTeamsWantedClassified',
  summary: 'Create Teams Wanted classified',
  description: 'Create a Teams Wanted classified for a public user using an access code workflow.',
  tags: ['Player Classifieds'],
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
          schema: UpsertTeamsWantedClassifiedSchemaRef,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Teams Wanted classified created',
      content: {
        'application/json': {
          schema: TeamsWantedOwnerClassifiedSchemaRef,
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

registry.registerPath({
  method: 'get',
  path: '/api/accounts/{accountId}/player-classifieds/players-wanted',
  operationId: 'listPlayersWantedClassifieds',
  summary: 'List Players Wanted classifieds',
  description: 'Retrieve paginated Players Wanted classifieds for the specified account.',
  tags: ['Player Classifieds'],
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
    query: PlayerClassifiedSearchQuerySchemaRef,
  },
  responses: {
    200: {
      description: 'Players Wanted classifieds',
      content: {
        'application/json': {
          schema: PlayersWantedClassifiedPagedSchemaRef,
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

registry.registerPath({
  method: 'get',
  path: '/api/accounts/{accountId}/player-classifieds/teams-wanted',
  operationId: 'listTeamsWantedClassifieds',
  summary: 'List Teams Wanted classifieds',
  description: 'Retrieve paginated Teams Wanted classifieds for authenticated account members.',
  tags: ['Player Classifieds'],
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
    query: PlayerClassifiedSearchQuerySchemaRef,
  },
  responses: {
    200: {
      description: 'Teams Wanted classifieds',
      content: {
        'application/json': {
          schema: TeamsWantedPublicClassifiedPagedSchemaRef,
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
      description: 'Access denied',
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

registry.registerPath({
  method: 'post',
  path: '/api/accounts/{accountId}/player-classifieds/teams-wanted/{classifiedId}/verify',
  operationId: 'verifyTeamsWantedAccess',
  summary: 'Verify Teams Wanted access code',
  description: 'Verify an access code and return the Teams Wanted classified owner view.',
  tags: ['Player Classifieds'],
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
      name: 'classifiedId',
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
          schema: TeamsWantedAccessCodeSchemaRef,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Verified Teams Wanted classified',
      content: {
        'application/json': {
          schema: TeamsWantedOwnerClassifiedSchemaRef,
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
      description: 'Classified not found',
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

registry.registerPath({
  method: 'post',
  path: '/api/accounts/{accountId}/player-classifieds/teams-wanted/access-code',
  operationId: 'getTeamsWantedByAccessCode',
  summary: 'Get Teams Wanted classified by access code',
  description: 'Retrieve a Teams Wanted classified owner view using an access code.',
  tags: ['Player Classifieds'],
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
          schema: TeamsWantedAccessCodeSchemaRef,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Teams Wanted classified owner view',
      content: {
        'application/json': {
          schema: TeamsWantedOwnerClassifiedSchemaRef,
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
      description: 'Classified not found',
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

// GET /api/accounts/{accountId}/player-classifieds/teams-wanted/{classifiedId}

// GET /api/accounts/{accountId}/player-classifieds/players-wanted/{classifiedId}

registry.registerPath({
  method: 'put',
  path: '/api/accounts/{accountId}/player-classifieds/teams-wanted/{classifiedId}',
  operationId: 'updateTeamsWantedClassified',
  summary: 'Update Teams Wanted classified',
  description:
    'Update a Teams Wanted classified using either account authentication or access code.',
  tags: ['Player Classifieds'],
  security: [{ bearerAuth: [] }, {}],
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
      name: 'classifiedId',
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
          schema: UpsertTeamsWantedClassifiedSchemaRef,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated Teams Wanted classified',
      content: {
        'application/json': {
          schema: TeamsWantedOwnerClassifiedSchemaRef,
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
    404: {
      description: 'Classified not found',
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

registry.registerPath({
  method: 'put',
  path: '/api/accounts/{accountId}/player-classifieds/players-wanted/{classifiedId}',
  operationId: 'updatePlayersWantedClassified',
  summary: 'Update Players Wanted classified',
  description: 'Update a Players Wanted classified for an authenticated account member.',
  tags: ['Player Classifieds'],
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
      name: 'classifiedId',
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
          schema: UpsertPlayersWantedClassifiedSchemaRef,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated Players Wanted classified',
      content: {
        'application/json': {
          schema: PlayersWantedClassifiedSchemaRef,
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
      description: 'Access denied',
      content: {
        'application/json': {
          schema: AuthorizationErrorSchemaRef,
        },
      },
    },
    404: {
      description: 'Classified not found',
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

registry.registerPath({
  method: 'delete',
  path: '/api/accounts/{accountId}/player-classifieds/teams-wanted/{classifiedId}',
  operationId: 'deleteTeamsWantedClassified',
  summary: 'Delete Teams Wanted classified',
  description: 'Delete a Teams Wanted classified using either authentication or access code.',
  tags: ['Player Classifieds'],
  security: [{ bearerAuth: [] }, {}],
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
      name: 'classifiedId',
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
      required: false,
      content: {
        'application/json': {
          schema: TeamsWantedAccessCodeSchemaRef,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'Teams Wanted classified deleted',
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
    404: {
      description: 'Classified not found',
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

registry.registerPath({
  method: 'delete',
  path: '/api/accounts/{accountId}/player-classifieds/players-wanted/{classifiedId}',
  operationId: 'deletePlayersWantedClassified',
  summary: 'Delete Players Wanted classified',
  description: 'Delete a Players Wanted classified for an authenticated account member.',
  tags: ['Player Classifieds'],
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
      name: 'classifiedId',
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
      description: 'Players Wanted classified deleted',
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
      description: 'Access denied',
      content: {
        'application/json': {
          schema: AuthorizationErrorSchemaRef,
        },
      },
    },
    404: {
      description: 'Classified not found',
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

registry.registerPath({
  method: 'get',
  path: '/api/accounts/{accountId}/player-classifieds/teams-wanted/{classifiedId}/contact',
  operationId: 'getTeamsWantedContactInfo',
  summary: 'Get Teams Wanted contact info',
  description:
    'Retrieve Teams Wanted classified contact information using either account authentication or a valid access code.',
  tags: ['Player Classifieds'],
  security: [{ bearerAuth: [] }, {}],
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
      name: 'classifiedId',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
        format: 'number',
      },
    },
  ],
  request: {
    query: TeamsWantedContactQuerySchemaRef,
  },
  responses: {
    200: {
      description: 'Teams Wanted contact information',
      content: {
        'application/json': {
          schema: TeamsWantedContactInfoSchemaRef,
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
    404: {
      description: 'Classified not found',
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

registry.registerPath({
  method: 'post',
  path: '/api/accounts/{accountId}/player-classifieds/players-wanted/{classifiedId}/contact',
  operationId: 'contactPlayersWantedCreator',
  summary: 'Contact Players Wanted creator',
  description: 'Send a message to the creator of a Players Wanted classified.',
  tags: ['Player Classifieds'],
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
      name: 'classifiedId',
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
          schema: ContactPlayersWantedCreatorSchemaRef,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'Contact request sent',
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
      description: 'Classified not found',
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

registry.registerPath({
  method: 'get',
  path: '/api/accounts/{accountId}/player-classifieds/positions',
  operationId: 'listPlayerClassifiedPositions',
  summary: 'List baseball positions',
  description: 'Retrieve supported baseball positions for classifieds.',
  tags: ['Player Classifieds'],
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
      description: 'Baseball positions',
      content: {
        'application/json': {
          schema: BaseballPositionSchemaRef.array(),
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
  method: 'get',
  path: '/api/accounts/{accountId}/player-classifieds/experience-levels',
  operationId: 'listPlayerClassifiedExperienceLevels',
  summary: 'List experience levels',
  description: 'Retrieve supported experience levels for classifieds.',
  tags: ['Player Classifieds'],
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
      description: 'Experience levels',
      content: {
        'application/json': {
          schema: ExperienceLevelSchemaRef.array(),
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

// Poll management endpoints
registry.registerPath({
  method: 'get',
  path: '/api/accounts/{accountId}/polls',
  operationId: 'listAccountPolls',
  summary: 'List polls for an account',
  tags: ['Polls'],
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
  responses: {
    200: {
      description: 'Polls available for the account',
      content: {
        'application/json': {
          schema: AccountPollSchemaRef.array(),
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
      description: 'Access denied',
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

registry.registerPath({
  method: 'post',
  path: '/api/accounts/{accountId}/polls',
  operationId: 'createAccountPoll',
  summary: 'Create a poll for an account',
  tags: ['Polls'],
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
        'application/json': {
          schema: CreatePollSchemaRef,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Poll created successfully',
      content: {
        'application/json': {
          schema: AccountPollSchemaRef,
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
      description: 'Access denied',
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

registry.registerPath({
  method: 'put',
  path: '/api/accounts/{accountId}/polls/{pollId}',
  operationId: 'updateAccountPoll',
  summary: 'Update an existing poll',
  tags: ['Polls'],
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
      name: 'pollId',
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
          schema: UpdatePollSchemaRef,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Poll updated successfully',
      content: {
        'application/json': {
          schema: AccountPollSchemaRef,
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
      description: 'Access denied',
      content: {
        'application/json': {
          schema: AuthorizationErrorSchemaRef,
        },
      },
    },
    404: {
      description: 'Poll not found',
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

registry.registerPath({
  method: 'delete',
  path: '/api/accounts/{accountId}/polls/{pollId}',
  operationId: 'deleteAccountPoll',
  summary: 'Delete a poll',
  tags: ['Polls'],
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
      name: 'pollId',
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
      description: 'Poll deleted successfully',
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
      description: 'Access denied',
      content: {
        'application/json': {
          schema: AuthorizationErrorSchemaRef,
        },
      },
    },
    404: {
      description: 'Poll not found',
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

registry.registerPath({
  method: 'get',
  path: '/api/accounts/{accountId}/polls/active',
  operationId: 'listActiveAccountPolls',
  summary: 'List active polls for an account',
  tags: ['Polls'],
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
  responses: {
    200: {
      description: 'Active polls for the account',
      content: {
        'application/json': {
          schema: AccountPollSchemaRef.array(),
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
      description: 'Access denied',
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

registry.registerPath({
  method: 'post',
  path: '/api/accounts/{accountId}/polls/{pollId}/vote',
  operationId: 'voteOnAccountPoll',
  summary: 'Submit a vote for a poll',
  tags: ['Polls'],
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
      name: 'pollId',
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
          schema: PollVoteRequestSchemaRef,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Vote recorded successfully',
      content: {
        'application/json': {
          schema: AccountPollSchemaRef,
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
      description: 'Access denied',
      content: {
        'application/json': {
          schema: AuthorizationErrorSchemaRef,
        },
      },
    },
    404: {
      description: 'Poll not found',
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
