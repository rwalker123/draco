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
    AccountWithSeasonsSchemaRef,
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    CreateAccountSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
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
};

export default registerAccountsEndpoints;
