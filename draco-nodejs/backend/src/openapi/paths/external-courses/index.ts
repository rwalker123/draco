import { RegisterContext } from '../../openapiTypes.js';

export const registerExternalCoursesEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    ExternalCourseSearchResultSchemaRef,
    ExternalCourseDetailSchemaRef,
    InternalServerErrorSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  const ExternalCourseSearchResultListSchemaRef = z
    .array(ExternalCourseSearchResultSchemaRef)
    .openapi({
      title: 'ExternalCourseSearchResultList',
      description: 'List of course search results from external API and custom courses',
    });

  // GET /api/accounts/{accountId}/golf/external-courses/search
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/external-courses/search',
    description:
      'Search for golf courses. Returns custom courses (no externalId) first, then external courses from GolfCourseAPI.com database. Custom courses have courseId set and empty externalId.',
    operationId: 'searchExternalCourses',
    summary: 'Search courses (custom and external)',
    tags: ['External Golf Courses'],
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
        name: 'query',
        in: 'query',
        required: true,
        schema: {
          type: 'string',
          minLength: 2,
          maxLength: 100,
          description: 'Course or club name to search for',
        },
      },
      {
        name: 'excludeLeague',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          enum: ['true', 'false'],
          description:
            'When true, excludes courses already added to the league. Use for league admin workflow.',
        },
      },
    ],
    responses: {
      200: {
        description: 'List of matching courses',
        content: {
          'application/json': {
            schema: ExternalCourseSearchResultListSchemaRef,
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

  // GET /api/accounts/{accountId}/golf/external-courses/{externalId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/external-courses/{externalId}',
    description: 'Get detailed course information from external API for import',
    operationId: 'getExternalCourseDetails',
    summary: 'Get external course details',
    tags: ['External Golf Courses'],
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
        name: 'externalId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          description: 'External course ID from search results',
        },
      },
    ],
    responses: {
      200: {
        description: 'Course details for import',
        content: {
          'application/json': {
            schema: ExternalCourseDetailSchemaRef,
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

export default registerExternalCoursesEndpoints;
