import { RegisterContext } from '../../openapiTypes.js';

export const registerMemberBusinessEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    ConflictErrorSchemaRef,
    CreateMemberBusinessSchemaRef,
    InternalServerErrorSchemaRef,
    MemberBusinessListSchemaRef,
    MemberBusinessQueryParamsSchemaRef,
    MemberBusinessSchemaRef,
    NotFoundErrorSchemaRef,
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

  const memberBusinessIdParameter = {
    name: 'memberBusinessId',
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
      description: 'Not authorized to manage member businesses',
      content: {
        'application/json': {
          schema: AuthorizationErrorSchemaRef,
        },
      },
    },
    404: {
      description: 'Member business not found',
      content: {
        'application/json': {
          schema: NotFoundErrorSchemaRef,
        },
      },
    },
    409: {
      description: 'Conflict while creating or updating member business',
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
  } as const;

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/member-businesses',
    operationId: 'listMemberBusinesses',
    summary: 'List member businesses for an account',
    description:
      'Returns member business listings for the account. Optionally filter by contact ID.',
    tags: ['Member Businesses'],
    parameters: [accountIdParameter],
    request: {
      query: MemberBusinessQueryParamsSchemaRef,
    },
    responses: {
      200: {
        description: 'Member business listings for the account',
        content: {
          'application/json': {
            schema: MemberBusinessListSchemaRef,
          },
        },
      },
      500: standardErrorResponses[500],
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/member-businesses/{memberBusinessId}',
    operationId: 'getMemberBusiness',
    summary: 'Get a member business entry',
    description: 'Retrieves a single member business entry associated with the account.',
    tags: ['Member Businesses'],
    parameters: [accountIdParameter, memberBusinessIdParameter],
    responses: {
      200: {
        description: 'Member business entry',
        content: {
          'application/json': {
            schema: MemberBusinessSchemaRef,
          },
        },
      },
      404: standardErrorResponses[404],
      500: standardErrorResponses[500],
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/member-businesses',
    operationId: 'createMemberBusiness',
    summary: 'Create a member business entry',
    description: 'Creates a new member business entry for a contact within the account.',
    tags: ['Member Businesses'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateMemberBusinessSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Member business entry created',
        content: {
          'application/json': {
            schema: MemberBusinessSchemaRef,
          },
        },
      },
      400: standardErrorResponses[400],
      401: standardErrorResponses[401],
      403: standardErrorResponses[403],
      404: standardErrorResponses[404],
      409: standardErrorResponses[409],
      500: standardErrorResponses[500],
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/member-businesses/{memberBusinessId}',
    operationId: 'updateMemberBusiness',
    summary: 'Update a member business entry',
    description: 'Updates an existing member business entry belonging to the account.',
    tags: ['Member Businesses'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, memberBusinessIdParameter],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateMemberBusinessSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated member business entry',
        content: {
          'application/json': {
            schema: MemberBusinessSchemaRef,
          },
        },
      },
      400: standardErrorResponses[400],
      401: standardErrorResponses[401],
      403: standardErrorResponses[403],
      404: standardErrorResponses[404],
      409: standardErrorResponses[409],
      500: standardErrorResponses[500],
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/member-businesses/{memberBusinessId}',
    operationId: 'deleteMemberBusiness',
    summary: 'Delete a member business entry',
    description: 'Deletes a member business entry associated with the account.',
    tags: ['Member Businesses'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, memberBusinessIdParameter],
    responses: {
      204: {
        description: 'Member business entry deleted',
      },
      401: standardErrorResponses[401],
      403: standardErrorResponses[403],
      404: standardErrorResponses[404],
      500: standardErrorResponses[500],
    },
  });
};

export default registerMemberBusinessEndpoints;
