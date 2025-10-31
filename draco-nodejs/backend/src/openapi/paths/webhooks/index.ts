import { RegisterContext } from '../../openapiTypes.js';

export const registerWebhooksEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const { AuthenticationErrorSchemaRef, InternalServerErrorSchemaRef, ValidationErrorSchemaRef } =
    schemaRefs;

  const sendGridWebhookEventSchema = z.object({
    email: z.string().email().describe('Recipient email address associated with the event.'),
    timestamp: z
      .number()
      .int()
      .describe('Unix timestamp (in seconds) when the webhook event occurred.'),
    event: z
      .enum([
        'delivered',
        'bounce',
        'dropped',
        'open',
        'click',
        'processed',
        'deferred',
        'spam_report',
        'unsubscribe',
        'group_unsubscribe',
        'group_resubscribe',
      ])
      .describe('Event type emitted by SendGrid.'),
    sg_event_id: z.string().describe('Unique SendGrid event identifier.'),
    sg_message_id: z.string().describe('Unique SendGrid message identifier.'),
    'smtp-id': z.string().optional().describe('Optional SMTP identifier for the event.'),
    reason: z.string().optional().describe('Reason provided for bounce or drop events.'),
    status: z.string().optional().describe('SMTP status code returned by SendGrid.'),
    response: z.string().optional().describe('SMTP response text returned by SendGrid.'),
    url: z.string().url().optional().describe('URL the recipient clicked, when applicable.'),
    useragent: z.string().optional().describe('User agent captured for open or click events.'),
  });

  const sendGridWebhookResultSchema = z.object({
    message: z.string().describe('Status message describing the processing outcome.'),
    processed: z.number().int().nonnegative().describe('Number of events successfully processed.'),
    total: z
      .number()
      .int()
      .nonnegative()
      .describe('Total number of events received in the webhook payload.'),
    errors: z
      .number()
      .int()
      .nonnegative()
      .describe('Number of events that encountered processing errors.'),
  });

  const resendWebhookEventSchema = z.object({
    type: z.string().describe('Resend event type (for example, email.delivered).'),
    data: z
      .object({
        event: z.string().optional().describe('Normalized event type reported by Resend.'),
        created_at: z
          .string()
          .optional()
          .describe('ISO 8601 timestamp describing when the event occurred.'),
        timestamp: z
          .union([z.number(), z.string()])
          .optional()
          .describe('Unix timestamp of when the event occurred.'),
        reason: z
          .string()
          .optional()
          .describe('Failure reason supplied by Resend, when available.'),
        smtp_response: z
          .string()
          .optional()
          .describe('Raw SMTP response captured for the event, if provided.'),
        email: z
          .object({
            id: z.string().optional().describe('Unique email identifier assigned by Resend.'),
            to: z
              .array(z.string().email())
              .optional()
              .describe('Recipient email addresses associated with the event.'),
            from: z.string().optional().describe('Fully qualified sender address.'),
            subject: z.string().optional().describe('Email subject line.'),
          })
          .partial()
          .optional()
          .describe('Email metadata for the event.'),
      })
      .partial()
      .optional()
      .describe('Event metadata returned by Resend.'),
  });

  registry.registerPath({
    method: 'post',
    path: '/api/webhooks/sendgrid',
    operationId: 'processSendGridWebhook',
    summary: 'Process SendGrid webhook events',
    description:
      'Receives webhook events from SendGrid and updates email delivery status for tracked recipients.',
    tags: ['Webhooks'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z
              .union([sendGridWebhookEventSchema, z.array(sendGridWebhookEventSchema).min(1)])
              .describe('SendGrid webhook payload containing one or more events.'),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Webhook events were processed successfully.',
        content: {
          'application/json': {
            schema: sendGridWebhookResultSchema,
          },
        },
      },
      400: {
        description: 'The webhook payload was empty or malformed.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'The webhook signature could not be validated.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'An unexpected server error occurred while processing webhook events.',
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
    path: '/api/webhooks/resend',
    operationId: 'processResendWebhook',
    summary: 'Process Resend webhook events',
    description:
      'Receives webhook events from Resend and updates email delivery status for tracked recipients.',
    tags: ['Webhooks'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z
              .union([resendWebhookEventSchema, z.array(resendWebhookEventSchema).min(1)])
              .describe('Resend webhook payload containing one or more events.'),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Webhook events were processed successfully.',
        content: {
          'application/json': {
            schema: sendGridWebhookResultSchema,
          },
        },
      },
      400: {
        description: 'The webhook payload was empty or malformed.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'The webhook signature could not be validated.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'An unexpected server error occurred while processing webhook events.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  const webhookHealthSchema = z.object({
    status: z.string().describe('Overall webhook health status.'),
    timestamp: z
      .string()
      .describe('ISO 8601 timestamp describing when the health check was generated.'),
    provider: z
      .enum(['sendgrid', 'ses', 'ethereal', 'resend'])
      .describe('Configured email provider handling outbound email and webhooks.'),
    webhooks: z.object({
      sendgrid: z.object({
        enabled: z.boolean().describe('Indicates whether the SendGrid webhook is enabled.'),
        endpoint: z.string().describe('Webhook endpoint path configured for SendGrid.'),
      }),
      resend: z.object({
        enabled: z.boolean().describe('Indicates whether the Resend webhook is enabled.'),
        endpoint: z.string().describe('Webhook endpoint path configured for Resend.'),
      }),
    }),
  });

  registry.registerPath({
    method: 'get',
    path: '/api/webhooks/health',
    operationId: 'getWebhookHealth',
    summary: 'Webhook health check',
    description: 'Returns current configuration and availability details for webhook integrations.',
    tags: ['Webhooks'],
    responses: {
      200: {
        description: 'Webhook health status retrieved successfully.',
        content: {
          'application/json': {
            schema: webhookHealthSchema,
          },
        },
      },
      500: {
        description: 'Unexpected server error while retrieving webhook health information.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  const webhookStatsSchema = z.object({
    total_events_processed: z
      .number()
      .int()
      .nonnegative()
      .describe('Total number of webhook events processed by the system.'),
    last_event_timestamp: z
      .string()
      .nullable()
      .describe('Timestamp of the most recently processed webhook event, if available.'),
    provider_status: z.object({
      sendgrid: z
        .boolean()
        .describe('Indicates whether SendGrid is the active outbound email provider.'),
      ses: z.boolean().describe('Indicates whether AWS SES is the active outbound email provider.'),
      ethereal: z
        .boolean()
        .describe('Indicates whether the Ethereal test provider is active for outbound email.'),
      resend: z
        .boolean()
        .describe('Indicates whether Resend is the active outbound email provider.'),
    }),
  });

  registry.registerPath({
    method: 'get',
    path: '/api/webhooks/stats',
    operationId: 'getWebhookStats',
    summary: 'Retrieve webhook processing statistics',
    description: 'Returns aggregated statistics about recently processed webhook events.',
    tags: ['Webhooks'],
    responses: {
      200: {
        description: 'Webhook statistics retrieved successfully.',
        content: {
          'application/json': {
            schema: webhookStatsSchema,
          },
        },
      },
      500: {
        description: 'Unexpected server error while retrieving webhook statistics.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });
};

export default registerWebhooksEndpoints;
