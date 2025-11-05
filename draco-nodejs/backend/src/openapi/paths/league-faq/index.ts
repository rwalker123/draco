import { RegisterContext } from '../../openapiTypes.js';

const registerLeagueFaqEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    LeagueFaqListSchemaRef,
    LeagueFaqSchemaRef,
    NotFoundErrorSchemaRef,
    UpsertLeagueFaqSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  const accountIdParameter = {
    name: 'accountId',
    in: 'path',
    required: true,
    schema: {
      type: 'string',
      format: 'number',
    },
  } as const;

  const faqIdParameter = {
    name: 'faqId',
    in: 'path',
    required: true,
    schema: {
      type: 'string',
      format: 'number',
    },
  } as const;

  const standardErrorResponses = {
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
      description: 'Not authorized to manage league FAQs',
      content: {
        'application/json': {
          schema: AuthorizationErrorSchemaRef,
        },
      },
    },
    404: {
      description: 'FAQ not found',
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
  } as const;

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/league-faq',
    operationId: 'listLeagueFaqs',
    summary: 'List league FAQs',
    description: 'Returns league FAQ entries for the account. Accessible without authentication.',
    tags: ['League FAQ'],
    parameters: [accountIdParameter],
    responses: {
      200: {
        description: 'League FAQ entries',
        content: {
          'application/json': {
            schema: LeagueFaqListSchemaRef,
          },
        },
      },
      500: standardErrorResponses[500],
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/league-faq/{faqId}',
    operationId: 'getLeagueFaq',
    summary: 'Get a league FAQ entry',
    description:
      'Retrieves a single league FAQ entry by identifier. Accessible without authentication.',
    tags: ['League FAQ'],
    parameters: [accountIdParameter, faqIdParameter],
    responses: {
      200: {
        description: 'League FAQ entry',
        content: {
          'application/json': {
            schema: LeagueFaqSchemaRef,
          },
        },
      },
      404: standardErrorResponses[404],
      500: standardErrorResponses[500],
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/league-faq',
    operationId: 'createLeagueFaq',
    summary: 'Create a league FAQ entry',
    description: 'Creates a new league FAQ entry within the account.',
    tags: ['League FAQ'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpsertLeagueFaqSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'League FAQ entry created',
        content: {
          'application/json': {
            schema: LeagueFaqSchemaRef,
          },
        },
      },
      400: standardErrorResponses[400],
      401: standardErrorResponses[401],
      403: standardErrorResponses[403],
      500: standardErrorResponses[500],
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/league-faq/{faqId}',
    operationId: 'updateLeagueFaq',
    summary: 'Update a league FAQ entry',
    description: 'Updates the question or answer for an existing league FAQ entry.',
    tags: ['League FAQ'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, faqIdParameter],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpsertLeagueFaqSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated league FAQ entry',
        content: {
          'application/json': {
            schema: LeagueFaqSchemaRef,
          },
        },
      },
      400: standardErrorResponses[400],
      401: standardErrorResponses[401],
      403: standardErrorResponses[403],
      404: standardErrorResponses[404],
      500: standardErrorResponses[500],
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/league-faq/{faqId}',
    operationId: 'deleteLeagueFaq',
    summary: 'Delete a league FAQ entry',
    description: 'Deletes an existing league FAQ entry from the account.',
    tags: ['League FAQ'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, faqIdParameter],
    responses: {
      204: {
        description: 'League FAQ entry deleted',
      },
      401: standardErrorResponses[401],
      403: standardErrorResponses[403],
      404: standardErrorResponses[404],
      500: standardErrorResponses[500],
    },
  });
};

export default registerLeagueFaqEndpoints;
