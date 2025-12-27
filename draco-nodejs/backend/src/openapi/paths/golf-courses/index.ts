import { RegisterContext } from '../../openapiTypes.js';

export const registerGolfCoursesEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    ConflictErrorSchemaRef,
    CreateGolfCourseSchemaRef,
    CreateGolfCourseTeeSchemaRef,
    GolfCourseSchemaRef,
    GolfCourseWithTeesSchemaRef,
    GolfCourseTeeSchemaRef,
    GolfLeagueCourseSchemaRef,
    AddLeagueCourseSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    UpdateGolfCourseSchemaRef,
    UpdateGolfCourseTeeSchemaRef,
    UpdateTeePrioritiesSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  const GolfLeagueCourseListSchemaRef = z.array(GolfLeagueCourseSchemaRef).openapi({
    title: 'GolfLeagueCourseList',
    description: 'List of league courses with tee information',
  });

  const GolfCourseTeeListSchemaRef = z.array(GolfCourseTeeSchemaRef).openapi({
    title: 'GolfCourseTeeList',
    description: 'List of tees for a course',
  });

  // GET /api/accounts/{accountId}/golf/courses/league-courses
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/courses/league-courses',
    description: 'List golf courses associated with a league',
    operationId: 'listGolfLeagueCourses',
    summary: 'List league golf courses',
    tags: ['Golf Courses'],
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
    responses: {
      200: {
        description: 'League courses with tee information',
        content: {
          'application/json': {
            schema: GolfLeagueCourseListSchemaRef,
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

  // GET /api/accounts/{accountId}/golf/courses/{courseId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/courses/{courseId}',
    description: 'Retrieve a golf course with its tee information',
    operationId: 'getGolfCourse',
    summary: 'Get golf course',
    tags: ['Golf Courses'],
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
        name: 'courseId',
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
        description: 'Golf course with tees',
        content: {
          'application/json': {
            schema: GolfCourseWithTeesSchemaRef,
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
      404: {
        description: 'Course not found',
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

  // POST /api/accounts/{accountId}/golf/courses
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/courses',
    description: 'Create a new golf course',
    operationId: 'createGolfCourse',
    summary: 'Create golf course',
    tags: ['Golf Courses'],
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
            schema: CreateGolfCourseSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Course created',
        content: {
          'application/json': {
            schema: GolfCourseSchemaRef,
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
        description: 'Access denied - golf management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Course with that name already exists',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
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

  // PUT /api/accounts/{accountId}/golf/courses/{courseId}
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/golf/courses/{courseId}',
    description: 'Update an existing golf course',
    operationId: 'updateGolfCourse',
    summary: 'Update golf course',
    tags: ['Golf Courses'],
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
        name: 'courseId',
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
            schema: UpdateGolfCourseSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Course updated',
        content: {
          'application/json': {
            schema: GolfCourseSchemaRef,
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
        description: 'Access denied - golf management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Course not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Course with that name already exists',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
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

  // DELETE /api/accounts/{accountId}/golf/courses/{courseId}
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/golf/courses/{courseId}',
    description: 'Delete a golf course',
    operationId: 'deleteGolfCourse',
    summary: 'Delete golf course',
    tags: ['Golf Courses'],
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
        name: 'courseId',
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
        description: 'Course deleted',
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
        description: 'Access denied - golf management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Course not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Course is in use and cannot be deleted',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
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

  // POST /api/accounts/{accountId}/golf/courses/league-courses
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/courses/league-courses',
    description: 'Add an existing course to the league',
    operationId: 'addGolfLeagueCourse',
    summary: 'Add league course',
    tags: ['Golf Courses'],
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
            schema: AddLeagueCourseSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Course added to league',
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
        description: 'Access denied - golf management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Course not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Course already in league',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
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

  // DELETE /api/accounts/{accountId}/golf/courses/league-courses/{courseId}
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/golf/courses/league-courses/{courseId}',
    description: 'Remove a course from the league',
    operationId: 'removeGolfLeagueCourse',
    summary: 'Remove league course',
    tags: ['Golf Courses'],
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
        name: 'courseId',
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
        description: 'Course removed from league',
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
        description: 'Access denied - golf management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Course not found in league',
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

  // GET /api/accounts/{accountId}/golf/courses/{courseId}/tees
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/courses/{courseId}/tees',
    description: 'List tees for a golf course',
    operationId: 'listGolfCourseTees',
    summary: 'List course tees',
    tags: ['Golf Course Tees'],
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
        name: 'courseId',
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
        description: 'List of tees for the course',
        content: {
          'application/json': {
            schema: GolfCourseTeeListSchemaRef,
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
      404: {
        description: 'Course not found',
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

  // GET /api/accounts/{accountId}/golf/courses/{courseId}/tees/{teeId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/courses/{courseId}/tees/{teeId}',
    description: 'Retrieve a single tee for a golf course',
    operationId: 'getGolfCourseTee',
    summary: 'Get course tee',
    tags: ['Golf Course Tees'],
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
        name: 'courseId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'teeId',
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
        description: 'Tee details',
        content: {
          'application/json': {
            schema: GolfCourseTeeSchemaRef,
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
      404: {
        description: 'Tee or course not found',
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

  // POST /api/accounts/{accountId}/golf/courses/{courseId}/tees
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/courses/{courseId}/tees',
    description: 'Create a new tee for a golf course',
    operationId: 'createGolfCourseTee',
    summary: 'Create course tee',
    tags: ['Golf Course Tees'],
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
        name: 'courseId',
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
            schema: CreateGolfCourseTeeSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Tee created',
        content: {
          'application/json': {
            schema: GolfCourseTeeSchemaRef,
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
        description: 'Access denied - golf management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Course not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Tee with that color already exists',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
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

  // PUT /api/accounts/{accountId}/golf/courses/{courseId}/tees/{teeId}
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/golf/courses/{courseId}/tees/{teeId}',
    description: 'Update an existing tee for a golf course',
    operationId: 'updateGolfCourseTee',
    summary: 'Update course tee',
    tags: ['Golf Course Tees'],
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
        name: 'courseId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'teeId',
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
            schema: UpdateGolfCourseTeeSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Tee updated',
        content: {
          'application/json': {
            schema: GolfCourseTeeSchemaRef,
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
        description: 'Access denied - golf management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Tee or course not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Tee with that color already exists',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
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

  // DELETE /api/accounts/{accountId}/golf/courses/{courseId}/tees/{teeId}
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/golf/courses/{courseId}/tees/{teeId}',
    description: 'Delete a tee from a golf course',
    operationId: 'deleteGolfCourseTee',
    summary: 'Delete course tee',
    tags: ['Golf Course Tees'],
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
        name: 'courseId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'teeId',
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
        description: 'Tee deleted',
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
        description: 'Access denied - golf management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Tee or course not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Tee is in use and cannot be deleted',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
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

  // PUT /api/accounts/{accountId}/golf/courses/{courseId}/tees/priorities
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/golf/courses/{courseId}/tees/priorities',
    description: 'Update the display order of tees for a golf course',
    operationId: 'updateGolfCourseTeesPriorities',
    summary: 'Update tee priorities',
    tags: ['Golf Course Tees'],
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
        name: 'courseId',
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
            schema: UpdateTeePrioritiesSchemaRef,
          },
        },
      },
    },
    responses: {
      204: {
        description: 'Priorities updated',
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
        description: 'Access denied - golf management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Course not found',
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
};

export default registerGolfCoursesEndpoints;
