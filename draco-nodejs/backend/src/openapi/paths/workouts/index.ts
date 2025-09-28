import { RegisterContext } from '../../openapiTypes.js';

export const registerWorkoutsEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
    WorkoutSchemaRef,
    WorkoutSummarySchemaRef,
    WorkoutSourcesSchemaRef,
    WorkoutSourceOptionPayloadSchemaRef,
    WorkoutRegistrationSchemaRef,
    WorkoutRegistrationsSchemaRef,
    WorkoutListQuerySchemaRef,
    WorkoutRegistrationsQuerySchemaRef,
    UpsertWorkoutSchemaRef,
    UpsertWorkoutRegistrationSchemaRef,
  } = schemaRefs;

  // GET /api/accounts/{accountId}/workouts
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/workouts',
    operationId: 'listAccountWorkouts',
    summary: 'List account workouts',
    description: 'Retrieve workout announcements for the specified account.',
    tags: ['Workouts'],
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
      query: WorkoutListQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Workouts retrieved',
        content: {
          'application/json': {
            schema: WorkoutSummarySchemaRef.array(),
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

  // GET /api/accounts/{accountId}/workouts/sources
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/workouts/sources',
    operationId: 'getWorkoutSources',
    summary: 'Get workout registration sources',
    description: 'Fetch configured where-heard options for workout registrations.',
    tags: ['Workouts'],
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
        description: 'Workout sources retrieved',
        content: {
          'application/json': {
            schema: WorkoutSourcesSchemaRef,
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

  // PUT /api/accounts/{accountId}/workouts/sources
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/workouts/sources',
    operationId: 'updateWorkoutSources',
    summary: 'Replace workout registration sources',
    description: 'Replace the full set of allowed where-heard options for workout registrations.',
    tags: ['Workouts'],
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
            schema: WorkoutSourcesSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Workout sources updated',
        content: {
          'application/json': {
            schema: WorkoutSourcesSchemaRef,
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
        description: 'Access denied',
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

  // POST /api/accounts/{accountId}/workouts/sources
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/workouts/sources',
    operationId: 'appendWorkoutSourceOption',
    summary: 'Add workout registration source option',
    description: 'Append an allowed where-heard option for workout registrations.',
    tags: ['Workouts'],
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
            schema: WorkoutSourceOptionPayloadSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Workout sources updated',
        content: {
          'application/json': {
            schema: WorkoutSourcesSchemaRef,
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
        description: 'Access denied',
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

  // GET /api/accounts/{accountId}/workouts/{workoutId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/workouts/{workoutId}',
    operationId: 'getAccountWorkout',
    summary: 'Get workout details',
    description: 'Retrieve a workout announcement for the specified account.',
    tags: ['Workouts'],
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
        name: 'workoutId',
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
        description: 'Workout retrieved',
        content: {
          'application/json': {
            schema: WorkoutSchemaRef,
          },
        },
      },
      404: {
        description: 'Workout not found',
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

  // POST /api/accounts/{accountId}/workouts/{workoutId}/registrations
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/workouts/{workoutId}/registrations',
    operationId: 'createWorkoutRegistration',
    summary: 'Register for a workout',
    description: 'Create a public registration for a workout announcement.',
    tags: ['Workouts'],
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
        name: 'workoutId',
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
            schema: UpsertWorkoutRegistrationSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Registration created',
        content: {
          'application/json': {
            schema: WorkoutRegistrationSchemaRef,
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
        description: 'Workout not found',
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

  // PUT /api/accounts/{accountId}/workouts/{workoutId}/registrations/{registrationId}
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/workouts/{workoutId}/registrations/{registrationId}',
    operationId: 'updateWorkoutRegistration',
    summary: 'Update workout registration',
    description: 'Update a workout registration for an authenticated account member.',
    tags: ['Workouts'],
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
        name: 'workoutId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'registrationId',
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
            schema: UpsertWorkoutRegistrationSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Registration updated',
        content: {
          'application/json': {
            schema: WorkoutRegistrationSchemaRef,
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
        description: 'Access denied',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Registration not found',
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

  // DELETE /api/accounts/{accountId}/workouts/{workoutId}/registrations/{registrationId}
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/workouts/{workoutId}/registrations/{registrationId}',
    operationId: 'deleteWorkoutRegistration',
    summary: 'Delete workout registration',
    description: 'Delete a workout registration for an authenticated account member.',
    tags: ['Workouts'],
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
        name: 'workoutId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'registrationId',
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
        description: 'Registration deleted',
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
        description: 'Access denied',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Registration not found',
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

  // POST /api/accounts/{accountId}/workouts
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/workouts',
    operationId: 'createAccountWorkout',
    summary: 'Create workout',
    description: 'Create a workout announcement for an account.',
    tags: ['Workouts'],
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
            schema: UpsertWorkoutSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Workout created',
        content: {
          'application/json': {
            schema: WorkoutSchemaRef,
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
        description: 'Access denied',
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

  // PUT /api/accounts/{accountId}/workouts/{workoutId}
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/workouts/{workoutId}',
    operationId: 'updateAccountWorkout',
    summary: 'Update workout',
    description: 'Update a workout announcement for an account.',
    tags: ['Workouts'],
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
        name: 'workoutId',
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
            schema: UpsertWorkoutSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Workout updated',
        content: {
          'application/json': {
            schema: WorkoutSchemaRef,
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
        description: 'Access denied',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Workout not found',
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

  // DELETE /api/accounts/{accountId}/workouts/{workoutId}
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/workouts/{workoutId}',
    operationId: 'deleteAccountWorkout',
    summary: 'Delete workout',
    description: 'Delete a workout announcement for an account.',
    tags: ['Workouts'],
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
        name: 'workoutId',
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
        description: 'Workout deleted',
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
        description: 'Access denied',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Workout not found',
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

  // GET /api/accounts/{accountId}/workouts/{workoutId}/registrations
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/workouts/{workoutId}/registrations',
    operationId: 'listWorkoutRegistrations',
    summary: 'List workout registrations',
    description: 'List registrations for a workout announcement for authorized account members.',
    tags: ['Workouts'],
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
        name: 'workoutId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      query: WorkoutRegistrationsQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Workout registrations retrieved',
        content: {
          'application/json': {
            schema: WorkoutRegistrationsSchemaRef,
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
        description: 'Access denied',
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

export default registerWorkoutsEndpoints;
