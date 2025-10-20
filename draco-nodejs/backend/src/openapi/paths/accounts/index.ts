import { RegisterContext } from '../../openapiTypes.js';

export const registerAccountsEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AccountAffiliationSchemaRef,
    AccountDetailsQuerySchemaRef,
    AccountDomainLookupHeadersSchemaRef,
    AccountHeaderSchemaRef,
    AccountNameSchemaRef,
    AccountSchemaRef,
    AccountSearchQuerySchemaRef,
    AccountTypeSchemaRef,
    AccountUrlSchemaRef,
    AccountWithSeasonsSchemaRef,
    AccountTwitterSettingsSchemaRef,
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    CreateAccountSchemaRef,
    CreateAccountUrlSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
    ConflictErrorSchemaRef,
    AutomaticRoleHoldersSchemaRef,
    TeamSeasonSchemaRef,
    FieldSchemaRef,
    FieldsSchemaRef,
    UpsertFieldSchemaRef,
    UmpiresSchemaRef,
    PagingSchemaRef,
    PhotoSubmissionSchemaRef,
    PhotoSubmissionDetailSchemaRef,
    PhotoSubmissionListSchemaRef,
    CreatePhotoSubmissionFormSchemaRef,
    DenyPhotoSubmissionRequestSchemaRef,
    PhotoGalleryListSchemaRef,
    PhotoGalleryQuerySchemaRef,
  } = schemaRefs;

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
            schema: AccountTypeSchemaRef.array(),
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

  // PUT /api/accounts/{accountId}/twitter
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/twitter',
    operationId: 'updateAccountTwitterSettings',
    summary: 'Update account Twitter settings',
    description: 'Update the Twitter integration settings for an account.',
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
            schema: AccountTwitterSettingsSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated account details',
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

  // GET /api/accounts/{accountId}/urls
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/urls',
    operationId: 'getAccountUrls',
    summary: 'List account URLs',
    description: 'Retrieve all configured URLs for the specified account.',
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
      200: {
        description: 'Account URLs',
        content: {
          'application/json': {
            schema: AccountUrlSchemaRef.array(),
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

  // POST /api/accounts/{accountId}/urls
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/urls',
    operationId: 'createAccountUrl',
    summary: 'Create account URL',
    description: 'Add a new URL to the specified account.',
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
            schema: CreateAccountUrlSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'URL created',
        content: {
          'application/json': {
            schema: AccountUrlSchemaRef,
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
      409: {
        description: 'URL already exists for this account',
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

  // PUT /api/accounts/{accountId}/urls/{urlId}
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/urls/{urlId}',
    operationId: 'updateAccountUrl',
    summary: 'Update account URL',
    description: 'Update an existing account URL.',
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
      {
        name: 'urlId',
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
            schema: CreateAccountUrlSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated account URL',
        content: {
          'application/json': {
            schema: AccountUrlSchemaRef,
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
        description: 'Account or URL not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'URL already exists for this account',
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

  // DELETE /api/accounts/{accountId}/urls/{urlId}
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/urls/{urlId}',
    operationId: 'deleteAccountUrl',
    summary: 'Delete account URL',
    description: 'Remove a URL from the specified account.',
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
      {
        name: 'urlId',
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
        description: 'URL deleted',
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
        description: 'Account or URL not found',
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

  /**
   * GET /api/accounts/:accountId/automatic-role-holders
   * Get automatic role holders (Account Owner and Team Managers) for the current season
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/automatic-role-holders',
    description:
      'Get automatic role holders (Account Owner and Team Managers) for the current season',
    operationId: 'getAutomaticRoleHolders',
    security: [{ bearerAuth: [] }],
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
        description: 'List of automatic role holders',
        content: {
          'application/json': {
            schema: AutomaticRoleHoldersSchemaRef,
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
   * GET /api/accounts/:accountId/user-teams
   * Get teams the current user belongs to for the given account
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/user-teams',
    description: 'Get teams that the authenticated user is associated with for this account.',
    operationId: 'getAccountUserTeams',
    security: [{ bearerAuth: [] }],
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
        description: 'Teams for the authenticated user within the account',
        content: {
          'application/json': {
            schema: TeamSeasonSchemaRef.array(),
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
        description: 'Access denied for this account',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Current season or user teams not found',
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
   * DELETE /api/accounts/:accountId/teams/:teamId
   * Delete a team definition when it is no longer used.
   */
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/teams/{teamId}',
    operationId: 'deleteAccountTeam',
    summary: 'Delete team definition',
    description: 'Deletes a team definition when it is no longer associated with any seasons.',
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
      {
        name: 'teamId',
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
        description: 'Team definition deleted',
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
        description: 'Account administrator role required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Team not found for the account',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Team is still assigned to one or more seasons',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while deleting the team',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/fields
   * List fields for an account (public)
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/fields',
    description: 'List fields configured for the account. This endpoint is public.',
    operationId: 'listAccountFields',
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
      query: PagingSchemaRef,
    },
    responses: {
      200: {
        description: 'Paginated list of fields for the account',
        content: {
          'application/json': {
            schema: FieldsSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid paging parameters',
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

  /**
   * POST /api/accounts/:accountId/fields
   * Create a new field for an account
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/fields',
    description: 'Create a new field for the account.',
    operationId: 'createAccountField',
    security: [{ bearerAuth: [] }],
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
      body: {
        content: {
          'application/json': {
            schema: UpsertFieldSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Field created successfully',
        content: {
          'application/json': {
            schema: FieldSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error creating the field',
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
        description: 'Permission denied to manage fields for this account',
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
   * PUT /api/accounts/:accountId/fields/:fieldId
   * Update a field for the account
   */
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/fields/{fieldId}',
    description: 'Update an existing field for the account.',
    operationId: 'updateAccountField',
    security: [{ bearerAuth: [] }],
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
      {
        name: 'fieldId',
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
            schema: UpsertFieldSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated field details',
        content: {
          'application/json': {
            schema: FieldSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error updating the field',
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
        description: 'Permission denied to manage fields for this account',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Field not found',
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
   * DELETE /api/accounts/:accountId/fields/:fieldId
   * Delete a field for the account
   */
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/fields/{fieldId}',
    description: 'Delete an existing field from the account.',
    operationId: 'deleteAccountField',
    security: [{ bearerAuth: [] }],
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
      {
        name: 'fieldId',
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
        description: 'Deleted field details',
        content: {
          'application/json': {
            schema: FieldSchemaRef,
          },
        },
      },
      400: {
        description: 'Cannot delete field due to dependencies',
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
        description: 'Permission denied to manage fields for this account',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Field not found',
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
   * GET /api/accounts/:accountId/umpires
   * List umpires for an account
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/umpires',
    description: 'List umpires configured for the account.',
    operationId: 'listAccountUmpires',
    security: [{ bearerAuth: [] }],
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
      query: PagingSchemaRef,
    },
    responses: {
      200: {
        description: 'Paginated list of umpires for the account',
        content: {
          'application/json': {
            schema: UmpiresSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid paging parameters',
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
        description: 'Permission denied to manage umpires for this account',
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
   * POST /api/accounts/:accountId/logo
   *
   * Account logo upload endpoint
   * Accepts a multipart/form-data request with a 'logo' file field.
   * Requires 'account.manage' permission.
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/logo',
    operationId: 'uploadAccountLogo',
    summary: 'Upload account logo',
    description: 'Uploads a logo for the specified account.',
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
    requestBody: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              logo: {
                type: 'string',
                format: 'binary',
              },
            },
            required: ['logo'],
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Logo uploaded successfully',
        content: {
          'application/json': {
            schema: {
              type: 'string',
              format: 'uri',
            },
          },
        },
      },
      400: {
        description: 'Invalid request',
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
        description: 'Permission denied',
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

  /**
   * GET /api/accounts/:accountId/logo
   *
   * Account logo retrieval endpoint
   * Requires 'account.manage' permission.
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/logo',
    operationId: 'getAccountLogo',
    summary: 'Get account logo',
    description: 'Retrieves the logo for the specified account.',
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
      200: {
        description: 'Logo retrieved successfully',
        content: {
          'image/png': {
            schema: {
              type: 'string',
              format: 'binary',
            },
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
   * DELETE /api/accounts/:accountId/logo
   *
   * Account logo deletion endpoint
   * Requires 'account.manage' permission.
   * Note: This action is irreversible. Ensure the user understands the implications of this action.
   */
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/logo',
    operationId: 'deleteAccountLogo',
    summary: 'Delete account logo',
    description: 'Deletes the logo for the specified account.',
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
        description: 'Logo deleted successfully',
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

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/photo-gallery',
    operationId: 'getAccountPhotoGallery',
    summary: 'Retrieve the account photo gallery',
    description:
      'Returns approved gallery photos for the account along with aggregated album metadata. This endpoint is publicly accessible.',
    tags: ['Photo Gallery'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      query: PhotoGalleryQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Account photo gallery.',
        content: {
          'application/json': { schema: PhotoGalleryListSchemaRef },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error while retrieving the gallery.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/photo-submissions',
    operationId: 'createAccountPhotoSubmission',
    summary: 'Submit a photo for account moderation',
    description:
      'Stages an uploaded photo for account-level moderation. Requires an authenticated contact with photo submission permissions.',
    tags: ['Photo Submissions'],
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
            schema: CreatePhotoSubmissionFormSchemaRef,
            encoding: {
              photo: { contentType: 'image/*' },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Photo submission created.',
        content: {
          'application/json': { schema: PhotoSubmissionSchemaRef },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to submit photos.' },
      500: {
        description: 'Unexpected server error while staging the submission.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/photo-submissions/pending',
    operationId: 'listPendingAccountPhotoSubmissions',
    summary: 'List pending account photo submissions',
    description: 'Retrieves photo submissions awaiting moderation for the specified account.',
    tags: ['Photo Submissions'],
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
        description: 'Pending photo submissions.',
        content: {
          'application/json': { schema: PhotoSubmissionListSchemaRef },
        },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to review photo submissions.' },
      500: {
        description: 'Unexpected server error while retrieving submissions.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/photo-submissions/{submissionId}/approve',
    operationId: 'approveAccountPhotoSubmission',
    summary: 'Approve an account photo submission',
    description: 'Promotes a pending photo submission into the gallery and removes staged assets.',
    tags: ['Photo Submissions'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'submissionId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Submission approved.',
        content: {
          'application/json': { schema: PhotoSubmissionDetailSchemaRef },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to moderate photo submissions.' },
      404: {
        description: 'Submission not found.',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error while approving the submission.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/photo-submissions/{submissionId}/deny',
    operationId: 'denyAccountPhotoSubmission',
    summary: 'Deny an account photo submission',
    description: 'Denies a pending photo submission and removes any staged assets.',
    tags: ['Photo Submissions'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'submissionId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: DenyPhotoSubmissionRequestSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Submission denied.',
        content: {
          'application/json': { schema: PhotoSubmissionDetailSchemaRef },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to moderate photo submissions.' },
      404: {
        description: 'Submission not found.',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error while denying the submission.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });
};

export default registerAccountsEndpoints;
