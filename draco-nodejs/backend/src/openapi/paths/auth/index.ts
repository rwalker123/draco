import { RegisterContext } from '../../openapiTypes.js';

export const registerAuthEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    RegisteredUserSchemaRef,
    SignInCredentialsSchemaRef,
    ValidationErrorSchemaRef,
    VerifyTokenRequestSchemaRef,
    ChangePasswordRequestSchemaRef,
    RoleCheckResponseSchemaRef,
  } = schemaRefs;

  const loginResponseDescription =
    'Authenticated user details including the JWT token when issued.';

  registry.registerPath({
    method: 'post',
    path: '/api/auth/login',
    operationId: 'login',
    summary: 'Authenticate user',
    description: 'Authenticates a user with their credentials and returns a session token.',
    tags: ['Auth'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: SignInCredentialsSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: loginResponseDescription,
        content: {
          'application/json': {
            schema: RegisteredUserSchemaRef,
          },
        },
      },
      400: {
        description: 'Missing or invalid credentials.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Credentials are incorrect or the account is locked.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected error while logging in.',
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
    path: '/api/auth/register',
    operationId: 'registerUser',
    summary: 'Register user',
    description: 'Creates a new user account and returns authentication details.',
    tags: ['Auth'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: SignInCredentialsSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User registered successfully.',
        content: {
          'application/json': {
            schema: RegisteredUserSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid registration details or username already exists.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected error while registering the user.',
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
    path: '/api/auth/logout',
    operationId: 'logout',
    summary: 'Logout user',
    description: 'Acknowledges a user logout request.',
    tags: ['Auth'],
    responses: {
      200: {
        description: 'Logout acknowledged.',
      },
      500: {
        description: 'Unexpected error while processing the logout request.',
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
    path: '/api/auth/me',
    operationId: 'getAuthenticatedUser',
    summary: 'Get current user',
    description: 'Returns the authenticated user details pulled from the token context.',
    tags: ['Auth'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'number',
        },
        description: 'Account context to include additional user details.',
      },
    ],
    responses: {
      200: {
        description: 'Current authenticated user information.',
        content: {
          'application/json': {
            schema: RegisteredUserSchemaRef,
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
        description: 'Unexpected error while retrieving the authenticated user.',
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
    path: '/api/auth/verify',
    operationId: 'verifyToken',
    summary: 'Verify token',
    description: 'Verifies an authentication token and returns the associated user.',
    tags: ['Auth'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: VerifyTokenRequestSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Token is valid and associated user details are returned.',
        content: {
          'application/json': {
            schema: RegisteredUserSchemaRef,
          },
        },
      },
      400: {
        description: 'Token is missing or malformed.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Token is invalid or expired.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected error while verifying the token.',
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
    path: '/api/auth/change-password',
    operationId: 'changePassword',
    summary: 'Change password',
    description: 'Allows the authenticated user to change their account password.',
    tags: ['Auth'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: ChangePasswordRequestSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Password changed successfully.',
        content: {
          'application/json': {
            schema: RegisteredUserSchemaRef,
          },
        },
      },
      400: {
        description: 'Password requirements not met or request is invalid.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required or current password incorrect.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected error while changing the password.',
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
    path: '/api/auth/refresh',
    operationId: 'refreshToken',
    summary: 'Refresh token',
    description: 'Refreshes the authentication token for the logged-in user.',
    tags: ['Auth'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Token refreshed successfully.',
        content: {
          'application/json': {
            schema: RegisteredUserSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required or account is locked.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected error while refreshing the token.',
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
    path: '/api/auth/check-role/{roleId}',
    operationId: 'checkRole',
    summary: 'Check user role',
    description: 'Checks whether the current user has the specified role in the provided context.',
    tags: ['Auth'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'roleId',
        in: 'path',
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
        description: 'Account context to evaluate the role against.',
      },
      {
        name: 'teamId',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'number',
        },
        description: 'Team context to evaluate the role against.',
      },
      {
        name: 'leagueId',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'number',
        },
        description: 'League context to evaluate the role against.',
      },
    ],
    responses: {
      200: {
        description: 'Role check result.',
        content: {
          'application/json': {
            schema: RoleCheckResponseSchemaRef,
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
        description: 'Unexpected error while checking the role.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });
};

export default registerAuthEndpoints;
