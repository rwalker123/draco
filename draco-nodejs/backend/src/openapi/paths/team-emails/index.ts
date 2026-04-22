import { RegisterContext } from '../../openapiTypes.js';

export const registerTeamEmailsEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
    EmailSendSchemaRef,
    EmailListPagedSchemaRef,
    EmailDetailSchemaRef,
  } = schemaRefs;

  const teamEmailPathParams = [
    {
      name: 'accountId',
      in: 'path' as const,
      required: true,
      schema: { type: 'string' as const, format: 'number' },
    },
    {
      name: 'seasonId',
      in: 'path' as const,
      required: true,
      schema: { type: 'string' as const, format: 'number' },
    },
    {
      name: 'teamSeasonId',
      in: 'path' as const,
      required: true,
      schema: { type: 'string' as const, format: 'number' },
    },
  ];

  const commonErrorResponses = {
    400: {
      description: 'Validation failed',
      content: { 'application/json': { schema: ValidationErrorSchemaRef } },
    },
    401: {
      description: 'Authentication required',
      content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
    },
    403: {
      description: 'Insufficient permissions',
      content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
    },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
    },
    500: {
      description: 'Unexpected server error',
      content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
    },
  };

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/emails/compose',
    summary: 'Compose and send a team email',
    description:
      'Sends an email scoped to a specific team season. Attachments and non-team recipient groups are rejected.',
    operationId: 'composeTeamEmail',
    tags: ['Team Emails'],
    security: [{ bearerAuth: [] }],
    parameters: teamEmailPathParams,
    request: {
      body: {
        content: {
          'application/json': { schema: EmailSendSchemaRef },
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
              status: z.literal('sending'),
            }),
          },
        },
      },
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/emails/roster-contacts',
    summary: 'List team roster contacts',
    description: 'Returns active roster contacts for the team available as email recipients.',
    operationId: 'getTeamRosterContacts',
    tags: ['Team Emails'],
    security: [{ bearerAuth: [] }],
    parameters: teamEmailPathParams,
    responses: {
      200: {
        description: 'List of roster contacts',
        content: {
          'application/json': {
            schema: z.array(
              z.object({
                id: z.string(),
                firstName: z.string(),
                lastName: z.string(),
                email: z.string().nullable(),
                hasValidEmail: z.boolean(),
                isManager: z.boolean(),
              }),
            ),
          },
        },
      },
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/emails/history',
    summary: 'List team email history',
    description:
      'Returns paginated email history for a team season with optional status filtering.',
    operationId: 'listTeamEmails',
    tags: ['Team Emails'],
    security: [{ bearerAuth: [] }],
    parameters: [
      ...teamEmailPathParams,
      {
        name: 'page',
        in: 'query' as const,
        required: false,
        schema: { type: 'integer' as const, minimum: 1, default: 1 },
      },
      {
        name: 'limit',
        in: 'query' as const,
        required: false,
        schema: { type: 'integer' as const, minimum: 1, maximum: 100, default: 20 },
      },
      {
        name: 'status',
        in: 'query' as const,
        required: false,
        schema: {
          type: 'string' as const,
          enum: ['draft', 'sending', 'sent', 'failed', 'scheduled', 'partial'],
        },
      },
    ],
    responses: {
      200: {
        description: 'Paginated list of team emails',
        content: { 'application/json': { schema: EmailListPagedSchemaRef } },
      },
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/emails/history/{emailId}',
    summary: 'Get team email detail',
    description: 'Returns delivery status, body, recipients, and attachments for a team email.',
    operationId: 'getTeamEmail',
    tags: ['Team Emails'],
    security: [{ bearerAuth: [] }],
    parameters: [
      ...teamEmailPathParams,
      {
        name: 'emailId',
        in: 'path' as const,
        required: true,
        schema: { type: 'string' as const, format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Team email detail',
        content: { 'application/json': { schema: EmailDetailSchemaRef } },
      },
      ...commonErrorResponses,
    },
  });
};

export default registerTeamEmailsEndpoints;
