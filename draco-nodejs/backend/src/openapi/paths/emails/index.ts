import { RECIPIENT_GROUP_TYPES } from '@draco/shared-schemas';
import { RegisterContext } from '../../openapiTypes.js';

export const registerEmailsEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
    EmailSendSchemaRef,
    EmailListPagedSchemaRef,
    EmailDetailSchemaRef,
    EmailTemplateSchemaRef,
    UpsertEmailTemplateSchemaRef,
    EmailTemplatesListSchemaRef,
    AttachmentUploadResultSchemaRef,
  } = schemaRefs;

  /**
   * GET /api/accounts/:accountId/seasons/:seasonId/group-contacts
   * Get contacts for a specific group (season, league, division, or team)
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/group-contacts',
    summary: 'Get group contacts',
    description:
      'Returns contacts for a specific group (season, league, division, or team) for email recipient editing.',
    operationId: 'getGroupContacts',
    tags: ['Emails'],
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
        name: 'groupType',
        in: 'query',
        required: true,
        schema: {
          type: 'string',
          enum: RECIPIENT_GROUP_TYPES,
        },
      },
      {
        name: 'groupId',
        in: 'query',
        required: true,
        schema: {
          type: 'string',
        },
      },
      {
        name: 'managersOnly',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          enum: ['true', 'false'],
          default: 'false',
        },
      },
    ],
    responses: {
      200: {
        description: 'List of contacts in the group',
        content: {
          'application/json': {
            schema: z.object({
              contacts: z.array(
                z.object({
                  id: z.string(),
                  firstName: z.string(),
                  lastName: z.string(),
                  email: z.string().nullable(),
                  hasValidEmail: z.boolean(),
                  isManager: z.boolean(),
                }),
              ),
            }),
          },
        },
      },
      400: {
        description: 'Validation failed',
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
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account or season not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * POST /api/accounts/:accountId/emails/compose
   * Compose and send an email
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/emails/compose',
    summary: 'Compose and send email',
    description:
      'Creates an email for an account and queues it for immediate send or scheduled delivery.',
    operationId: 'composeAccountEmail',
    tags: ['Emails'],
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
            schema: EmailSendSchemaRef.extend({
              attachmentFiles: z
                .array(z.string().openapi({ type: 'string', format: 'binary' }))
                .optional()
                .openapi({ description: 'File attachments to upload with the email' }),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Email created successfully',
        content: {
          'application/json': {
            schema: z.object({
              emailId: z.string(),
              status: z.enum(['scheduled', 'sending']),
            }),
          },
        },
      },
      400: {
        description: 'Validation failed',
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
        description: 'Insufficient permissions to send email',
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
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/emails
   * List account emails with pagination
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/emails',
    summary: 'List account emails',
    description: 'Returns paginated email activity for an account with optional status filtering.',
    operationId: 'listAccountEmails',
    tags: ['Emails'],
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
        name: 'page',
        in: 'query',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
        },
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20,
        },
      },
      {
        name: 'status',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          enum: ['draft', 'sending', 'sent', 'failed', 'scheduled', 'partial'],
        },
      },
    ],
    responses: {
      200: {
        description: 'Paginated list of emails',
        content: {
          'application/json': {
            schema: EmailListPagedSchemaRef,
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
        description: 'Insufficient permissions to view emails',
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
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/emails/:emailId
   * Retrieve detailed email information
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/emails/{emailId}',
    summary: 'Get email details',
    description: 'Returns delivery status, body content, recipients, and attachments for an email.',
    operationId: 'getAccountEmail',
    tags: ['Emails'],
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
        name: 'emailId',
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
        description: 'Email details',
        content: {
          'application/json': {
            schema: EmailDetailSchemaRef,
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
        description: 'Insufficient permissions to view email',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Email not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error',
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
    path: '/api/accounts/{accountId}/emails/{emailId}',
    summary: 'Delete email',
    description: 'Deletes an email and all associated data for an account.',
    operationId: 'deleteAccountEmail',
    tags: ['Emails'],
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
        name: 'emailId',
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
        description: 'Email deleted successfully',
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
        description: 'Insufficient permissions to delete email',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Email not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * POST /api/accounts/:accountId/email-templates
   * Create a new email template
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/email-templates',
    summary: 'Create email template',
    description: 'Creates an email template scoped to an account.',
    operationId: 'createEmailTemplate',
    tags: ['Email Templates'],
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
            schema: UpsertEmailTemplateSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Template created successfully',
        content: {
          'application/json': {
            schema: EmailTemplateSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation failed',
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
        description: 'Insufficient permissions to manage templates',
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
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/email-templates
   * List email templates for an account
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/email-templates',
    summary: 'List email templates',
    description: 'Returns account templates along with common merge variables.',
    operationId: 'listEmailTemplates',
    tags: ['Email Templates'],
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
        name: 'activeOnly',
        in: 'query',
        required: false,
        schema: {
          type: 'boolean',
          default: false,
        },
      },
    ],
    responses: {
      200: {
        description: 'List of email templates',
        content: {
          'application/json': {
            schema: EmailTemplatesListSchemaRef,
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
        description: 'Insufficient permissions to view templates',
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
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/email-templates/:templateId
   * Retrieve a single email template
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/email-templates/{templateId}',
    summary: 'Get email template',
    description: 'Returns a single email template for the given account.',
    operationId: 'getEmailTemplate',
    tags: ['Email Templates'],
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
        name: 'templateId',
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
        description: 'Email template',
        content: {
          'application/json': {
            schema: EmailTemplateSchemaRef,
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
        description: 'Insufficient permissions to view template',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Template not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * PUT /api/accounts/:accountId/email-templates/:templateId
   * Update an existing email template
   */
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/email-templates/{templateId}',
    summary: 'Update email template',
    description: 'Updates template metadata or content.',
    operationId: 'updateEmailTemplate',
    tags: ['Email Templates'],
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
        name: 'templateId',
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
            schema: UpsertEmailTemplateSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Template updated successfully',
        content: {
          'application/json': {
            schema: EmailTemplateSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation failed',
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
        description: 'Insufficient permissions to manage templates',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Template not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * DELETE /api/accounts/:accountId/email-templates/:templateId
   * Delete (soft delete) an email template
   */
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/email-templates/{templateId}',
    summary: 'Delete email template',
    description: 'Soft deletes the specified email template.',
    operationId: 'deleteEmailTemplate',
    tags: ['Email Templates'],
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
        name: 'templateId',
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
        description: 'Deletion status',
        content: {
          'application/json': {
            schema: z.boolean(),
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
        description: 'Insufficient permissions to manage templates',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Template not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * POST /api/accounts/:accountId/email-templates/:templateId/preview
   * Preview template output with merge variables
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/email-templates/{templateId}/preview',
    summary: 'Preview template',
    description: 'Previews the rendered subject and body for a template using provided variables.',
    operationId: 'previewEmailTemplate',
    tags: ['Email Templates'],
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
        name: 'templateId',
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
            schema: z.object({
              variables: z.record(z.string(), z.string()).optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Preview rendered successfully',
        content: {
          'application/json': {
            schema: z.object({
              subject: z.string(),
              body: z.string(),
            }),
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
        description: 'Insufficient permissions to preview template',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Template not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * POST /api/accounts/:accountId/emails/:emailId/attachments
   * Upload attachments for an email
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/emails/{emailId}/attachments',
    summary: 'Upload email attachments',
    description: 'Uploads one or more attachments for an email in draft or scheduled status.',
    operationId: 'uploadEmailAttachments',
    tags: ['Email Attachments'],
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
        name: 'emailId',
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
              attachments: {
                type: 'array',
                items: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
            required: ['attachments'],
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Attachments uploaded successfully',
        content: {
          'application/json': {
            schema: AttachmentUploadResultSchemaRef.array(),
          },
        },
      },
      400: {
        description: 'Validation failed',
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
        description: 'Insufficient permissions to manage attachments',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Email not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/emails/:emailId/attachments
   * List attachments for an email
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/emails/{emailId}/attachments',
    summary: 'List email attachments',
    description: 'Returns metadata for attachments associated with an email.',
    operationId: 'listEmailAttachments',
    tags: ['Email Attachments'],
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
        name: 'emailId',
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
        description: 'List of attachments',
        content: {
          'application/json': {
            schema: AttachmentUploadResultSchemaRef.array(),
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
        description: 'Insufficient permissions to view attachments',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Email not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/emails/:emailId/attachments/:attachmentId
   * Download a specific email attachment
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/emails/{emailId}/attachments/{attachmentId}',
    summary: 'Download email attachment',
    description: 'Streams the binary contents of an email attachment.',
    operationId: 'downloadEmailAttachment',
    tags: ['Email Attachments'],
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
        name: 'emailId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'attachmentId',
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
        description: 'Attachment binary',
        content: {
          'application/octet-stream': {
            schema: {
              type: 'string',
              format: 'binary',
            },
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
        description: 'Insufficient permissions to download attachments',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Attachment not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * DELETE /api/accounts/:accountId/emails/:emailId/attachments/:attachmentId
   * Delete an email attachment
   */
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/emails/{emailId}/attachments/{attachmentId}',
    summary: 'Delete email attachment',
    description: 'Removes an email attachment from storage and the repository.',
    operationId: 'deleteEmailAttachment',
    tags: ['Email Attachments'],
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
        name: 'emailId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'attachmentId',
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
        description: 'Deletion status',
        content: {
          'application/json': {
            schema: z.boolean(),
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
        description: 'Insufficient permissions to manage attachments',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Attachment not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });
};

export default registerEmailsEndpoints;
