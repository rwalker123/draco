import { ParameterObject } from '@asteasolutions/zod-to-openapi/dist/types.js';
import { RegisterContext } from '../../openapiTypes.js';

const accountIdParameter: ParameterObject = {
  name: 'accountId',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'number' },
};

const messageIdParameter: ParameterObject = {
  name: 'messageId',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'number' },
};

const teamSeasonIdParameter: ParameterObject = {
  name: 'teamSeasonId',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'number' },
};

export default ({ registry, schemaRefs }: RegisterContext) => {
  const {
    WelcomeMessageSchemaRef,
    WelcomeMessageListSchemaRef,
    UpsertWelcomeMessageSchemaRef,
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    ValidationErrorSchemaRef,
    NotFoundErrorSchemaRef,
  } = schemaRefs;

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/welcome-messages',
    operationId: 'listAccountWelcomeMessages',
    summary: 'List account welcome messages',
    description: 'Returns all welcome information cards configured at the account level.',
    tags: ['Accounts'],
    parameters: [accountIdParameter],
    responses: {
      200: {
        description: 'Welcome messages retrieved successfully.',
        content: { 'application/json': { schema: WelcomeMessageListSchemaRef } },
      },
      500: { description: 'Unexpected server error.' },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/welcome-messages/{messageId}',
    operationId: 'getAccountWelcomeMessage',
    summary: 'Get account welcome message',
    description: 'Retrieves a single account-level welcome message card.',
    tags: ['Accounts'],
    parameters: [accountIdParameter, messageIdParameter],
    responses: {
      200: {
        description: 'Welcome message retrieved successfully.',
        content: { 'application/json': { schema: WelcomeMessageSchemaRef } },
      },
      404: {
        description: 'Welcome message not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/welcome-messages',
    operationId: 'createAccountWelcomeMessage',
    summary: 'Create account welcome message',
    description: 'Creates a new account-level welcome information card.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter],
    request: {
      body: {
        content: {
          'application/json': { schema: UpsertWelcomeMessageSchemaRef },
        },
      },
    },
    responses: {
      201: {
        description: 'Welcome message created successfully.',
        content: { 'application/json': { schema: WelcomeMessageSchemaRef } },
      },
      400: {
        description: 'Validation error.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Account communications permission required.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/welcome-messages/{messageId}',
    operationId: 'updateAccountWelcomeMessage',
    summary: 'Update account welcome message',
    description: 'Updates an existing account-level welcome information card.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, messageIdParameter],
    request: {
      body: {
        content: {
          'application/json': { schema: UpsertWelcomeMessageSchemaRef },
        },
      },
    },
    responses: {
      200: {
        description: 'Welcome message updated successfully.',
        content: { 'application/json': { schema: WelcomeMessageSchemaRef } },
      },
      400: {
        description: 'Validation error.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Account communications permission required.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Welcome message not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/welcome-messages/{messageId}',
    operationId: 'deleteAccountWelcomeMessage',
    summary: 'Delete account welcome message',
    description: 'Deletes an account-level welcome information card.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, messageIdParameter],
    responses: {
      204: { description: 'Welcome message deleted successfully.' },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Account communications permission required.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Welcome message not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/teams/{teamSeasonId}/welcome-messages',
    operationId: 'listTeamWelcomeMessages',
    summary: 'List team welcome messages',
    description: 'Returns team-scoped welcome information cards for the specified team season.',
    tags: ['Teams'],
    parameters: [accountIdParameter, teamSeasonIdParameter],
    responses: {
      200: {
        description: 'Team welcome messages retrieved successfully.',
        content: { 'application/json': { schema: WelcomeMessageListSchemaRef } },
      },
      404: {
        description: 'Team season not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/teams/{teamSeasonId}/welcome-messages/{messageId}',
    operationId: 'getTeamWelcomeMessage',
    summary: 'Get team welcome message',
    description: 'Retrieves a single team-scoped welcome information card.',
    tags: ['Teams'],
    parameters: [accountIdParameter, teamSeasonIdParameter, messageIdParameter],
    responses: {
      200: {
        description: 'Team welcome message retrieved successfully.',
        content: { 'application/json': { schema: WelcomeMessageSchemaRef } },
      },
      404: {
        description: 'Welcome message not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/teams/{teamSeasonId}/welcome-messages',
    operationId: 'createTeamWelcomeMessage',
    summary: 'Create team welcome message',
    description: 'Creates a new team-scoped welcome information card.',
    tags: ['Teams'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, teamSeasonIdParameter],
    request: {
      body: {
        content: {
          'application/json': { schema: UpsertWelcomeMessageSchemaRef },
        },
      },
    },
    responses: {
      201: {
        description: 'Team welcome message created successfully.',
        content: { 'application/json': { schema: WelcomeMessageSchemaRef } },
      },
      400: {
        description: 'Validation error.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Team or league administration permission required.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Team season not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/teams/{teamSeasonId}/welcome-messages/{messageId}',
    operationId: 'updateTeamWelcomeMessage',
    summary: 'Update team welcome message',
    description: 'Updates an existing team-scoped welcome information card.',
    tags: ['Teams'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, teamSeasonIdParameter, messageIdParameter],
    request: {
      body: {
        content: {
          'application/json': { schema: UpsertWelcomeMessageSchemaRef },
        },
      },
    },
    responses: {
      200: {
        description: 'Team welcome message updated successfully.',
        content: { 'application/json': { schema: WelcomeMessageSchemaRef } },
      },
      400: {
        description: 'Validation error.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Team or league administration permission required.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Welcome message not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/teams/{teamSeasonId}/welcome-messages/{messageId}',
    operationId: 'deleteTeamWelcomeMessage',
    summary: 'Delete team welcome message',
    description: 'Deletes a team-scoped welcome information card.',
    tags: ['Teams'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, teamSeasonIdParameter, messageIdParameter],
    responses: {
      204: { description: 'Team welcome message deleted successfully.' },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Team or league administration permission required.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Welcome message not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });
};
