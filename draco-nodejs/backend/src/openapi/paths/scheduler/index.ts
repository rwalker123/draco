import { RegisterContext } from '../../openapiTypes.js';

export const registerSchedulerEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
    SchedulerProblemSpecSchemaRef,
    SchedulerProblemSpecPreviewSchemaRef,
    SchedulerSeasonSolveRequestSchemaRef,
    SchedulerSeasonApplyRequestSchemaRef,
    SchedulerGenerateMatchupsRequestSchemaRef,
    SchedulerGenerateMatchupsResultSchemaRef,
    SchedulerSolveResultSchemaRef,
    SchedulerApplyRequestSchemaRef,
    SchedulerApplyResultSchemaRef,
    SchedulerSeasonWindowConfigSchemaRef,
    SchedulerSeasonWindowConfigUpsertSchemaRef,
    SchedulerSeasonExclusionSchemaRef,
    SchedulerSeasonExclusionUpsertSchemaRef,
    SchedulerSeasonExclusionsSchemaRef,
    SchedulerTeamExclusionSchemaRef,
    SchedulerTeamExclusionUpsertSchemaRef,
    SchedulerTeamExclusionsSchemaRef,
    SchedulerLeagueExclusionSchemaRef,
    SchedulerLeagueExclusionUpsertSchemaRef,
    SchedulerLeagueExclusionsSchemaRef,
    SchedulerUmpireExclusionSchemaRef,
    SchedulerUmpireExclusionUpsertSchemaRef,
    SchedulerUmpireExclusionsSchemaRef,
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
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/problem-spec',
    operationId: 'getSchedulerProblemSpecPreview',
    summary: 'Preview the assembled scheduler problem spec',
    description:
      'Builds a SchedulerProblemSpecPreview from database state (games/teams/fields/umpires) plus field availability rules expanded into fieldSlots.',
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
        description: 'Problem spec preview',
        content: { 'application/json': { schema: SchedulerProblemSpecPreviewSchemaRef } },
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
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/season-window-config',
    operationId: 'getSchedulerSeasonWindowConfig',
    summary: 'Get scheduler season window config',
    description:
      'Reads the configured season start/end dates used as the default window when expanding field availability rules into fieldSlots.',
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
        description: 'Season window config',
        content: { 'application/json': { schema: SchedulerSeasonWindowConfigSchemaRef } },
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
      404: {
        description: 'Not configured',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/season-window-config',
    operationId: 'upsertSchedulerSeasonWindowConfig',
    summary: 'Upsert scheduler season window config',
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
        content: { 'application/json': { schema: SchedulerSeasonWindowConfigUpsertSchemaRef } },
      },
    },
    responses: {
      200: {
        description: 'Updated season window config',
        content: { 'application/json': { schema: SchedulerSeasonWindowConfigSchemaRef } },
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
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/season-exclusions',
    operationId: 'listSchedulerSeasonExclusions',
    summary: 'List scheduler season exclusions',
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
        description: 'Season exclusions list',
        content: { 'application/json': { schema: SchedulerSeasonExclusionsSchemaRef } },
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
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/season-exclusions',
    operationId: 'createSchedulerSeasonExclusion',
    summary: 'Create scheduler season exclusion',
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
        content: { 'application/json': { schema: SchedulerSeasonExclusionUpsertSchemaRef } },
      },
    },
    responses: {
      201: {
        description: 'Created season exclusion',
        content: { 'application/json': { schema: SchedulerSeasonExclusionSchemaRef } },
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
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/season-exclusions/{exclusionId}',
    operationId: 'updateSchedulerSeasonExclusion',
    summary: 'Update scheduler season exclusion',
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
      {
        name: 'exclusionId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: SchedulerSeasonExclusionUpsertSchemaRef } },
      },
    },
    responses: {
      200: {
        description: 'Updated season exclusion',
        content: { 'application/json': { schema: SchedulerSeasonExclusionSchemaRef } },
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
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/season-exclusions/{exclusionId}',
    operationId: 'deleteSchedulerSeasonExclusion',
    summary: 'Delete scheduler season exclusion',
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
      {
        name: 'exclusionId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Deleted season exclusion',
        content: { 'application/json': { schema: SchedulerSeasonExclusionSchemaRef } },
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
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/team-exclusions',
    operationId: 'listSchedulerTeamExclusions',
    summary: 'List scheduler team exclusions',
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
        description: 'Team exclusions list',
        content: { 'application/json': { schema: SchedulerTeamExclusionsSchemaRef } },
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
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/team-exclusions',
    operationId: 'createSchedulerTeamExclusion',
    summary: 'Create scheduler team exclusion',
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
        content: { 'application/json': { schema: SchedulerTeamExclusionUpsertSchemaRef } },
      },
    },
    responses: {
      201: {
        description: 'Created team exclusion',
        content: { 'application/json': { schema: SchedulerTeamExclusionSchemaRef } },
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
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/team-exclusions/{exclusionId}',
    operationId: 'updateSchedulerTeamExclusion',
    summary: 'Update scheduler team exclusion',
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
      {
        name: 'exclusionId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: SchedulerTeamExclusionUpsertSchemaRef } },
      },
    },
    responses: {
      200: {
        description: 'Updated team exclusion',
        content: { 'application/json': { schema: SchedulerTeamExclusionSchemaRef } },
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
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/team-exclusions/{exclusionId}',
    operationId: 'deleteSchedulerTeamExclusion',
    summary: 'Delete scheduler team exclusion',
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
      {
        name: 'exclusionId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Deleted team exclusion',
        content: { 'application/json': { schema: SchedulerTeamExclusionSchemaRef } },
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
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/league-exclusions',
    operationId: 'listSchedulerLeagueExclusions',
    summary: 'List scheduler league exclusions',
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
        description: 'League exclusions list',
        content: { 'application/json': { schema: SchedulerLeagueExclusionsSchemaRef } },
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
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/league-exclusions',
    operationId: 'createSchedulerLeagueExclusion',
    summary: 'Create scheduler league exclusion',
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
        content: { 'application/json': { schema: SchedulerLeagueExclusionUpsertSchemaRef } },
      },
    },
    responses: {
      201: {
        description: 'Created league exclusion',
        content: { 'application/json': { schema: SchedulerLeagueExclusionSchemaRef } },
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
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/league-exclusions/{exclusionId}',
    operationId: 'updateSchedulerLeagueExclusion',
    summary: 'Update scheduler league exclusion',
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
      {
        name: 'exclusionId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: SchedulerLeagueExclusionUpsertSchemaRef } },
      },
    },
    responses: {
      200: {
        description: 'Updated league exclusion',
        content: { 'application/json': { schema: SchedulerLeagueExclusionSchemaRef } },
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
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/league-exclusions/{exclusionId}',
    operationId: 'deleteSchedulerLeagueExclusion',
    summary: 'Delete scheduler league exclusion',
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
      {
        name: 'exclusionId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Deleted league exclusion',
        content: { 'application/json': { schema: SchedulerLeagueExclusionSchemaRef } },
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
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/umpire-exclusions',
    operationId: 'listSchedulerUmpireExclusions',
    summary: 'List scheduler umpire exclusions',
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
        description: 'Umpire exclusions list',
        content: { 'application/json': { schema: SchedulerUmpireExclusionsSchemaRef } },
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
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/umpire-exclusions',
    operationId: 'createSchedulerUmpireExclusion',
    summary: 'Create scheduler umpire exclusion',
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
        content: { 'application/json': { schema: SchedulerUmpireExclusionUpsertSchemaRef } },
      },
    },
    responses: {
      201: {
        description: 'Created umpire exclusion',
        content: { 'application/json': { schema: SchedulerUmpireExclusionSchemaRef } },
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
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/umpire-exclusions/{exclusionId}',
    operationId: 'updateSchedulerUmpireExclusion',
    summary: 'Update scheduler umpire exclusion',
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
      {
        name: 'exclusionId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: SchedulerUmpireExclusionUpsertSchemaRef } },
      },
    },
    responses: {
      200: {
        description: 'Updated umpire exclusion',
        content: { 'application/json': { schema: SchedulerUmpireExclusionSchemaRef } },
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
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/umpire-exclusions/{exclusionId}',
    operationId: 'deleteSchedulerUmpireExclusion',
    summary: 'Delete scheduler umpire exclusion',
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
      {
        name: 'exclusionId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Deleted umpire exclusion',
        content: { 'application/json': { schema: SchedulerUmpireExclusionSchemaRef } },
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
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/generate-matchups',
    operationId: 'generateSeasonMatchups',
    summary: 'Generate round-robin matchups (unplaced)',
    description:
      'Generates deterministic, home/away-balanced round-robin matchups for the selected leagues using the provided per-league in-division and cross-division game counts. Reads teams and divisions from the database. Does not place (no dates/fields/umpires) and does not persist; feed the returned matchups into the solve endpoint to place them.',
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
        content: {
          'application/json': {
            schema: SchedulerGenerateMatchupsRequestSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Generated matchups with per-league summary',
        content: { 'application/json': { schema: SchedulerGenerateMatchupsResultSchemaRef } },
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
        description: 'Insufficient permissions to generate schedules',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Season or league not found',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/solve',
    operationId: 'solveSeasonSchedule',
    summary: 'Generate a proposed schedule (DB-sourced)',
    description:
      'Assembles a scheduling problem spec from database state (games/teams/fields/umpires + expanded fieldSlots from availability rules) and returns a deterministic proposal (no persistence). Provide an Idempotency-Key header for safe retries.',
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
        required: false,
        content: {
          'application/json': {
            schema: SchedulerSeasonSolveRequestSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Scheduling proposal result',
        content: { 'application/json': { schema: SchedulerSolveResultSchemaRef } },
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
        description: 'Insufficient permissions to generate schedules',
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
    path: '/api/accounts/{accountId}/seasons/{seasonId}/scheduler/apply',
    operationId: 'applySeasonSchedule',
    summary: 'Persist a proposed schedule (DB-sourced)',
    description:
      'Applies a proposed schedule for the season by persisting all or selected assignments to the database. This endpoint validates constraints using DB-derived context and is safe to retry.',
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
        content: {
          'application/json': {
            schema: SchedulerSeasonApplyRequestSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Apply result',
        content: { 'application/json': { schema: SchedulerApplyResultSchemaRef } },
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
        description: 'Insufficient permissions to apply schedules',
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
