import { RegisterContext } from '../../openapiTypes.js';

export const registerSchedulerEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    ValidationErrorSchemaRef,
    SchedulerProblemSpecSchemaRef,
    SchedulerSolveResultSchemaRef,
    SchedulerApplyRequestSchemaRef,
    SchedulerApplyResultSchemaRef,
    SchedulerFieldAvailabilityRuleSchemaRef,
    SchedulerFieldAvailabilityRuleUpsertSchemaRef,
    SchedulerFieldAvailabilityRulesSchemaRef,
  } = schemaRefs;

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/scheduler/solve',
    operationId: 'solveSchedule',
    summary: 'Generate a proposed schedule',
    description:
      'Deterministically solves a scheduling problem specification and returns a proposal (no persistence). Provide an Idempotency-Key header to derive a stable runId for safe retries; a follow-up apply endpoint will handle persisting all or selected assignments.',
    tags: ['Scheduler'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'Idempotency-Key',
        in: 'header',
        required: false,
        schema: { type: 'string', minLength: 1 },
        description:
          'Optional client-provided key used to derive a stable runId so callers can safely retry without changing the response metadata.',
      },
    ],
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: SchedulerProblemSpecSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Scheduling proposal result',
        content: {
          'application/json': {
            schema: SchedulerSolveResultSchemaRef,
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
        description: 'Insufficient permissions to generate schedules',
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
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/field-availability-rules',
    operationId: 'listSchedulerFieldAvailabilityRules',
    summary: 'List scheduler field availability rules',
    description:
      'Lists field availability rules for the season. These rules are expanded into concrete fieldSlots when assembling a scheduling problem spec.',
    tags: ['Scheduler'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'seasonId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Rules list',
        content: { 'application/json': { schema: SchedulerFieldAvailabilityRulesSchemaRef } },
      },
      400: {
        description: 'Validation error',
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
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/field-availability-rules',
    operationId: 'createSchedulerFieldAvailabilityRule',
    summary: 'Create scheduler field availability rule',
    tags: ['Scheduler'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'seasonId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: SchedulerFieldAvailabilityRuleUpsertSchemaRef } },
      },
    },
    responses: {
      201: {
        description: 'Created rule',
        content: { 'application/json': { schema: SchedulerFieldAvailabilityRuleSchemaRef } },
      },
      400: {
        description: 'Validation error',
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
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/field-availability-rules/{ruleId}',
    operationId: 'updateSchedulerFieldAvailabilityRule',
    summary: 'Update scheduler field availability rule',
    tags: ['Scheduler'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'seasonId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      { name: 'ruleId', in: 'path', required: true, schema: { type: 'string', format: 'number' } },
    ],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: SchedulerFieldAvailabilityRuleUpsertSchemaRef } },
      },
    },
    responses: {
      200: {
        description: 'Updated rule',
        content: { 'application/json': { schema: SchedulerFieldAvailabilityRuleSchemaRef } },
      },
      400: {
        description: 'Validation error',
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
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/field-availability-rules/{ruleId}',
    operationId: 'deleteSchedulerFieldAvailabilityRule',
    summary: 'Delete scheduler field availability rule',
    tags: ['Scheduler'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'seasonId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      { name: 'ruleId', in: 'path', required: true, schema: { type: 'string', format: 'number' } },
    ],
    responses: {
      200: {
        description: 'Deleted rule',
        content: { 'application/json': { schema: SchedulerFieldAvailabilityRuleSchemaRef } },
      },
      400: {
        description: 'Validation error',
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
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/scheduler/apply',
    operationId: 'applyScheduleProposal',
    summary: 'Apply a schedule proposal',
    description:
      'Persists a proposal returned by /scheduler/solve. This endpoint writes to the database and can apply all assignments or a specified subset.',
    tags: ['Scheduler'],
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
        required: true,
        content: {
          'application/json': {
            schema: SchedulerApplyRequestSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Apply result',
        content: {
          'application/json': {
            schema: SchedulerApplyResultSchemaRef,
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
        description: 'Insufficient permissions to apply schedules',
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
};

export default registerSchedulerEndpoints;
