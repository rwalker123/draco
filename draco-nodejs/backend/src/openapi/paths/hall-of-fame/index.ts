import { RegisterContext } from '../../openapiTypes.js';

export const registerHallOfFameEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    HofClassSummarySchemaRef,
    HofClassWithMembersSchemaRef,
    HofMemberSchemaRef,
    HofEligibleContactsQuerySchemaRef,
    HofEligibleContactsResponseSchemaRef,
    CreateHofMemberSchemaRef,
    UpdateHofMemberSchemaRef,
    SubmitHofNominationSchemaRef,
    HofNominationListSchemaRef,
    HofNominationQuerySchemaRef,
    HofNominationSetupSchemaRef,
    UpdateHofNominationSetupSchemaRef,
    ValidationErrorSchemaRef,
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    ConflictErrorSchemaRef,
    NotFoundErrorSchemaRef,
    InternalServerErrorSchemaRef,
  } = schemaRefs;

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/hall-of-fame/classes',
    operationId: 'listAccountHallOfFameClasses',
    summary: 'List Hall of Fame classes',
    description: 'Returns the available Hall of Fame classes for an account ordered by year.',
    tags: ['Hall of Fame'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Hall of Fame classes for the requested account.',
        content: {
          'application/json': {
            schema: HofClassSummarySchemaRef.array(),
          },
        },
      },
      404: {
        description: 'Account not found or Hall of Fame not configured.',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/hall-of-fame/classes/{year}',
    operationId: 'getAccountHallOfFameClass',
    summary: 'Retrieve Hall of Fame class by year',
    description: 'Retrieves the Hall of Fame class and inductees for a given year.',
    tags: ['Hall of Fame'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'year',
        in: 'path',
        required: true,
        schema: { type: 'integer', format: 'int32' },
      },
    ],
    responses: {
      200: {
        description: 'Detailed Hall of Fame class information.',
        content: {
          'application/json': {
            schema: HofClassWithMembersSchemaRef,
          },
        },
      },
      404: {
        description: 'Hall of Fame class not found for the specified year.',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/hall-of-fame/random-member',
    operationId: 'getAccountHallOfFameRandomMember',
    summary: 'Retrieve a random Hall of Fame member',
    description: 'Returns a random Hall of Fame inductee for spotlight experiences.',
    tags: ['Hall of Fame'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Randomly selected Hall of Fame member.',
        content: {
          'application/json': {
            schema: HofMemberSchemaRef,
          },
        },
      },
      404: {
        description: 'No Hall of Fame members are available.',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/hall-of-fame/eligible-contacts',
    operationId: 'listAccountHallOfFameEligibleContacts',
    summary: 'List eligible contacts for induction',
    description:
      'Returns account contacts that are eligible to be inducted into the Hall of Fame. Requires account administrator access.',
    tags: ['Hall of Fame'],
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
      query: HofEligibleContactsQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Eligible contacts that may be inducted.',
        content: {
          'application/json': {
            schema: HofEligibleContactsResponseSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error.',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: {
        description: 'Authentication required.',
        content: {
          'application/json': { schema: AuthenticationErrorSchemaRef },
        },
      },
      403: {
        description: 'Caller lacks permission to manage the Hall of Fame.',
        content: {
          'application/json': { schema: AuthorizationErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/hall-of-fame/members',
    operationId: 'createAccountHallOfFameMember',
    summary: 'Induct a Hall of Fame member',
    description: 'Creates a new Hall of Fame inductee for the account.',
    tags: ['Hall of Fame'],
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
        content: {
          'application/json': {
            schema: CreateHofMemberSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Hall of Fame member created successfully.',
        content: {
          'application/json': {
            schema: HofMemberSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error.',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: {
        description: 'Authentication required.',
        content: {
          'application/json': { schema: AuthenticationErrorSchemaRef },
        },
      },
      403: {
        description: 'Caller lacks permission to manage the Hall of Fame.',
        content: {
          'application/json': { schema: AuthorizationErrorSchemaRef },
        },
      },
      409: {
        description: 'Contact is already an inducted Hall of Fame member.',
        content: {
          'application/json': { schema: ConflictErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/hall-of-fame/members/{memberId}',
    operationId: 'updateAccountHallOfFameMember',
    summary: 'Update Hall of Fame member details',
    description: 'Updates the year or biography for an existing Hall of Fame member.',
    tags: ['Hall of Fame'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'memberId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpdateHofMemberSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated Hall of Fame member.',
        content: {
          'application/json': {
            schema: HofMemberSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error.',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: {
        description: 'Authentication required.',
        content: {
          'application/json': { schema: AuthenticationErrorSchemaRef },
        },
      },
      403: {
        description: 'Caller lacks permission to manage the Hall of Fame.',
        content: {
          'application/json': { schema: AuthorizationErrorSchemaRef },
        },
      },
      404: {
        description: 'Hall of Fame member not found.',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/hall-of-fame/members/{memberId}',
    operationId: 'deleteAccountHallOfFameMember',
    summary: 'Remove a Hall of Fame member',
    description: 'Deletes an existing Hall of Fame induction.',
    tags: ['Hall of Fame'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'memberId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      204: { description: 'Hall of Fame member deleted successfully.' },
      401: {
        description: 'Authentication required.',
        content: {
          'application/json': { schema: AuthenticationErrorSchemaRef },
        },
      },
      403: {
        description: 'Caller lacks permission to manage the Hall of Fame.',
        content: {
          'application/json': { schema: AuthorizationErrorSchemaRef },
        },
      },
      404: {
        description: 'Hall of Fame member not found.',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/hall-of-fame/nominations',
    operationId: 'submitAccountHallOfFameNomination',
    summary: 'Submit a Hall of Fame nomination',
    description:
      'Allows public visitors to submit Hall of Fame nominations. Nomination availability depends on account settings.',
    tags: ['Hall of Fame'],
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
        content: {
          'application/json': {
            schema: SubmitHofNominationSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Nomination submitted successfully.',
      },
      400: {
        description: 'Validation error.',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      409: {
        description: 'Nominations are currently disabled for this account.',
        content: {
          'application/json': { schema: ConflictErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/hall-of-fame/nominations',
    operationId: 'listAccountHallOfFameNominations',
    summary: 'List Hall of Fame nominations',
    description:
      'Lists nomination submissions for the account. Requires account administrator access.',
    tags: ['Hall of Fame'],
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
      query: HofNominationQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Hall of Fame nominations for the account.',
        content: {
          'application/json': {
            schema: HofNominationListSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required.',
        content: {
          'application/json': { schema: AuthenticationErrorSchemaRef },
        },
      },
      403: {
        description: 'Caller lacks permission to manage nominations.',
        content: {
          'application/json': { schema: AuthorizationErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/hall-of-fame/nominations/{nominationId}',
    operationId: 'deleteAccountHallOfFameNomination',
    summary: 'Delete a Hall of Fame nomination',
    description: 'Removes a Hall of Fame nomination submission.',
    tags: ['Hall of Fame'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'nominationId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      204: { description: 'Hall of Fame nomination deleted successfully.' },
      401: {
        description: 'Authentication required.',
        content: {
          'application/json': { schema: AuthenticationErrorSchemaRef },
        },
      },
      403: {
        description: 'Caller lacks permission to manage nominations.',
        content: {
          'application/json': { schema: AuthorizationErrorSchemaRef },
        },
      },
      404: {
        description: 'Hall of Fame nomination not found.',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/hall-of-fame/nomination-setup',
    operationId: 'getAccountHallOfFameNominationSetup',
    summary: 'Retrieve nomination setup',
    description: 'Retrieves the Hall of Fame nomination configuration for an account.',
    tags: ['Hall of Fame'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Hall of Fame nomination setup.',
        content: {
          'application/json': {
            schema: HofNominationSetupSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required.',
        content: {
          'application/json': { schema: AuthenticationErrorSchemaRef },
        },
      },
      403: {
        description: 'Caller lacks permission to manage nominations.',
        content: {
          'application/json': { schema: AuthorizationErrorSchemaRef },
        },
      },
      404: {
        description: 'Hall of Fame nomination setup not found.',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/hall-of-fame/nomination-setup',
    operationId: 'updateAccountHallOfFameNominationSetup',
    summary: 'Update nomination setup',
    description: 'Updates whether nominations are enabled and the messaging displayed to visitors.',
    tags: ['Hall of Fame'],
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
        content: {
          'application/json': {
            schema: UpdateHofNominationSetupSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated Hall of Fame nomination setup.',
        content: {
          'application/json': {
            schema: HofNominationSetupSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error.',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: {
        description: 'Authentication required.',
        content: {
          'application/json': { schema: AuthenticationErrorSchemaRef },
        },
      },
      403: {
        description: 'Caller lacks permission to manage nominations.',
        content: {
          'application/json': { schema: AuthorizationErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });
};

export default registerHallOfFameEndpoints;
