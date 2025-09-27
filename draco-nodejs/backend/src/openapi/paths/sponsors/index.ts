import { RegisterContext } from '../../openapiTypes.js';

export const registerSponsorsEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    CreateSponsorSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    SponsorListSchemaRef,
    SponsorSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  // GET /api/accounts/{accountId}/sponsors
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/sponsors',
    description: 'List sponsors configured for an account',
    operationId: 'listAccountSponsors',
    summary: 'List account sponsors',
    tags: ['Sponsors'],
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
        description: 'Sponsors for the account',
        content: {
          'application/json': {
            schema: SponsorListSchemaRef,
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

  // GET /api/accounts/{accountId}/sponsors/{sponsorId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/sponsors/{sponsorId}',
    description: 'Retrieve a single account-level sponsor',
    operationId: 'getAccountSponsor',
    summary: 'Get account sponsor',
    tags: ['Sponsors'],
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
        name: 'sponsorId',
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
        description: 'Sponsor details',
        content: {
          'application/json': {
            schema: SponsorSchemaRef,
          },
        },
      },
      404: {
        description: 'Sponsor not found',
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

  // POST /api/accounts/{accountId}/sponsors
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/sponsors',
    description: 'Create an account sponsor',
    operationId: 'createAccountSponsor',
    summary: 'Create account sponsor',
    tags: ['Sponsors'],
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
            schema: CreateSponsorSchemaRef.extend({
              photo: z.string().optional().openapi({
                type: 'string',
                format: 'binary',
                description: 'Sponsor photo file',
              }),
            }),
            encoding: {
              photo: {
                contentType: 'image/*',
              },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Sponsor created',
        content: {
          'application/json': {
            schema: SponsorSchemaRef,
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
        description: 'Access denied - sponsor management permission required',
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

  // PUT /api/accounts/{accountId}/sponsors/{sponsorId}
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/sponsors/{sponsorId}',
    description: 'Update an account sponsor',
    operationId: 'updateAccountSponsor',
    summary: 'Update account sponsor',
    tags: ['Sponsors'],
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
        name: 'sponsorId',
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
            schema: CreateSponsorSchemaRef.partial().extend({
              photo: z.string().optional().openapi({
                type: 'string',
                format: 'binary',
                description: 'Sponsor photo file',
              }),
            }),
            encoding: {
              photo: {
                contentType: 'image/*',
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Sponsor updated',
        content: {
          'application/json': {
            schema: SponsorSchemaRef,
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
        description: 'Access denied - sponsor management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Sponsor not found',
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

  // DELETE /api/accounts/{accountId}/sponsors/{sponsorId}
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/sponsors/{sponsorId}',
    description: 'Delete an account sponsor',
    operationId: 'deleteAccountSponsor',
    summary: 'Delete account sponsor',
    tags: ['Sponsors'],
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
        name: 'sponsorId',
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
        description: 'Sponsor deleted',
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
        description: 'Access denied - sponsor management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Sponsor not found',
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

  // GET /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/sponsors
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/sponsors',
    description: 'List sponsors configured for a team season',
    operationId: 'listTeamSponsors',
    summary: 'List team sponsors',
    tags: ['Sponsors'],
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
        name: 'teamSeasonId',
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
        description: 'Sponsors for the team',
        content: {
          'application/json': {
            schema: SponsorListSchemaRef,
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

  // POST /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/sponsors
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/sponsors',
    description: 'Create a team sponsor',
    operationId: 'createTeamSponsor',
    summary: 'Create team sponsor',
    tags: ['Sponsors'],
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
        name: 'teamSeasonId',
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
            schema: CreateSponsorSchemaRef.partial().extend({
              photo: z.string().optional().openapi({
                type: 'string',
                format: 'binary',
                description: 'Sponsor photo file',
              }),
            }),
            encoding: {
              photo: {
                contentType: 'image/*',
              },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Sponsor created',
        content: {
          'application/json': {
            schema: SponsorSchemaRef,
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
        description: 'Access denied - team sponsor management permission required',
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

  // PUT /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/sponsors/{sponsorId}
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/sponsors/{sponsorId}',
    description: 'Update a team sponsor',
    operationId: 'updateTeamSponsor',
    summary: 'Update team sponsor',
    tags: ['Sponsors'],
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
        name: 'teamSeasonId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'sponsorId',
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
            schema: CreateSponsorSchemaRef.partial().extend({
              photo: z.string().optional().openapi({
                type: 'string',
                format: 'binary',
                description: 'Sponsor photo file',
              }),
            }),
            encoding: {
              photo: {
                contentType: 'image/*',
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Sponsor updated',
        content: {
          'application/json': {
            schema: SponsorSchemaRef,
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
        description: 'Access denied - team sponsor management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Sponsor not found',
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

  // DELETE /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/sponsors/{sponsorId}
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/sponsors/{sponsorId}',
    description: 'Delete a team sponsor',
    operationId: 'deleteTeamSponsor',
    summary: 'Delete team sponsor',
    tags: ['Sponsors'],
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
        name: 'teamSeasonId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'sponsorId',
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
        description: 'Sponsor deleted',
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
        description: 'Access denied - team sponsor management permission required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Sponsor not found',
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

export default registerSponsorsEndpoints;
