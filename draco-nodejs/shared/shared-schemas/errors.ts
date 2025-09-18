import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// Base API error response schema
export const ApiErrorSchema = z
  .object({
    message: z.string(),
    statusCode: z.number(),
    isRetryable: z.boolean(),
  })
  .openapi({
    description: 'Standard API error response',
  });

// Specific error schemas for different HTTP status codes
export const ValidationErrorSchema = ApiErrorSchema.extend({
  statusCode: z.literal(400),
  isRetryable: z.literal(false),
}).openapi({
  description: 'Validation error (400)',
  example: { message: 'Validation failed', statusCode: 400, isRetryable: false },
});

export const AuthenticationErrorSchema = ApiErrorSchema.extend({
  statusCode: z.literal(401),
  isRetryable: z.literal(false),
}).openapi({
  description: 'Authentication error (401)',
  example: { message: 'Authentication required', statusCode: 401, isRetryable: false },
});

export const AuthorizationErrorSchema = ApiErrorSchema.extend({
  statusCode: z.literal(403),
  isRetryable: z.literal(false),
}).openapi({
  description: 'Authorization error (403)',
  example: { message: 'Access denied', statusCode: 403, isRetryable: false },
});

export const NotFoundErrorSchema = ApiErrorSchema.extend({
  statusCode: z.literal(404),
  isRetryable: z.literal(false),
}).openapi({
  description: 'Resource not found error (404)',
  example: { message: 'Resource not found', statusCode: 404, isRetryable: false },
});

export const ConflictErrorSchema = ApiErrorSchema.extend({
  statusCode: z.literal(409),
  isRetryable: z.literal(false),
}).openapi({
  description: 'Resource conflict error (409)',
  example: { message: 'Resource conflict', statusCode: 409, isRetryable: false },
});

export const InternalServerErrorSchema = ApiErrorSchema.extend({
  statusCode: z.literal(500),
  isRetryable: z.literal(true),
}).openapi({
  description: 'Internal server error (500)',
  example: { message: 'Internal server error', statusCode: 500, isRetryable: true },
});

// Type exports
export type ApiErrorType = z.infer<typeof ApiErrorSchema>;
export type ValidationErrorType = z.infer<typeof ValidationErrorSchema>;
export type AuthenticationErrorType = z.infer<typeof AuthenticationErrorSchema>;
export type AuthorizationErrorType = z.infer<typeof AuthorizationErrorSchema>;
export type NotFoundErrorType = z.infer<typeof NotFoundErrorSchema>;
export type ConflictErrorType = z.infer<typeof ConflictErrorSchema>;
export type InternalServerErrorType = z.infer<typeof InternalServerErrorSchema>;
