import { RegisterContext } from '../../openapiTypes.js';

export const registerPasswordResetEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    ValidationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
  } = schemaRefs;

  const passwordResetRequestBodySchema = z.object({
    email: z.string().trim().min(1),
    testMode: z.boolean().optional(),
  });

  const passwordResetRequestResponseSchema = z.union([
    z.literal(true),
    z.object({
      success: z.boolean(),
      message: z.string(),
    }),
    z.object({
      token: z.string(),
      userId: z.string(),
      email: z.string(),
    }),
  ]);

  registry.registerPath({
    method: 'post',
    path: '/api/passwordReset/request',
    summary: 'Request password reset',
    description:
      'Creates a password reset token for the supplied email address and sends a reset message when that account exists.',
    operationId: 'requestPasswordReset',
    tags: ['Password Reset'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: passwordResetRequestBodySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Password reset token generated (email is sent or test token returned).',
        content: {
          'application/json': {
            schema: passwordResetRequestResponseSchema,
          },
        },
      },
      400: {
        description: 'Invalid request payload.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unable to generate or deliver the password reset token.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  const passwordResetVerifyBodySchema = z.object({
    token: z.string().trim().min(1),
  });

  registry.registerPath({
    method: 'post',
    path: '/api/passwordReset/verify',
    summary: 'Verify password reset token',
    description: 'Validates a password reset token before allowing a password change.',
    operationId: 'verifyPasswordResetToken',
    tags: ['Password Reset'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: passwordResetVerifyBodySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Token verification result.',
        content: {
          'application/json': {
            schema: z.object({
              valid: z.boolean(),
            }),
          },
        },
      },
      400: {
        description: 'Reset token missing or malformed.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while verifying the token.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  const passwordResetBodySchema = z.object({
    token: z.string().trim().min(1),
    newPassword: z.string().min(6),
  });

  registry.registerPath({
    method: 'post',
    path: '/api/passwordReset/reset',
    summary: 'Reset password',
    description: 'Resets the user password when provided with a valid reset token.',
    operationId: 'resetPasswordWithToken',
    tags: ['Password Reset'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: passwordResetBodySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Password reset completed.',
        content: {
          'application/json': {
            schema: z.boolean(),
          },
        },
      },
      400: {
        description: 'Invalid reset token or new password.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while resetting the password.',
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
    path: '/api/passwordReset/cleanup',
    summary: 'Clean up expired password reset tokens',
    description: 'Deletes expired password reset tokens. Administrator access is required.',
    operationId: 'cleanupExpiredPasswordResetTokens',
    tags: ['Password Reset'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Number of expired tokens removed.',
        content: {
          'application/json': {
            schema: z.number().int().min(0),
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
      403: {
        description: 'User lacks administrator privileges.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while cleaning up tokens.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });
};

export default registerPasswordResetEndpoints;
