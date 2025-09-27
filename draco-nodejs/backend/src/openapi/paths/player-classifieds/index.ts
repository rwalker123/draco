import { RegisterContext } from '../../openapiTypes.js';

export const registerPlayerClassifiedsEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    BaseballPositionSchemaRef,
    ContactPlayersWantedCreatorSchemaRef,
    ExperienceLevelSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    PlayerClassifiedSearchQuerySchemaRef,
    PlayersWantedClassifiedPagedSchemaRef,
    PlayersWantedClassifiedSchemaRef,
    TeamsWantedAccessCodeSchemaRef,
    TeamsWantedContactInfoSchemaRef,
    TeamsWantedContactQuerySchemaRef,
    TeamsWantedOwnerClassifiedSchemaRef,
    TeamsWantedPublicClassifiedPagedSchemaRef,
    UpsertPlayersWantedClassifiedSchemaRef,
    UpsertTeamsWantedClassifiedSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  // Player Classifieds routes
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/player-classifieds/players-wanted',
    operationId: 'createPlayersWantedClassified',
    summary: 'Create Players Wanted classified',
    description: 'Create a Players Wanted classified for an authenticated account member.',
    tags: ['Player Classifieds'],
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
            schema: UpsertPlayersWantedClassifiedSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Players Wanted classified created',
        content: {
          'application/json': {
            schema: PlayersWantedClassifiedSchemaRef,
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
        description: 'Account or contact not found',
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

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/player-classifieds/teams-wanted',
    operationId: 'createTeamsWantedClassified',
    summary: 'Create Teams Wanted classified',
    description:
      'Create a Teams Wanted classified for a public user using an access code workflow.',
    tags: ['Player Classifieds'],
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
            schema: UpsertTeamsWantedClassifiedSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Teams Wanted classified created',
        content: {
          'application/json': {
            schema: TeamsWantedOwnerClassifiedSchemaRef,
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
        description: 'Account not found',
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

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/player-classifieds/players-wanted',
    operationId: 'listPlayersWantedClassifieds',
    summary: 'List Players Wanted classifieds',
    description: 'Retrieve paginated Players Wanted classifieds for the specified account.',
    tags: ['Player Classifieds'],
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
      query: PlayerClassifiedSearchQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Players Wanted classifieds',
        content: {
          'application/json': {
            schema: PlayersWantedClassifiedPagedSchemaRef,
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

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/player-classifieds/teams-wanted',
    operationId: 'listTeamsWantedClassifieds',
    summary: 'List Teams Wanted classifieds',
    description: 'Retrieve paginated Teams Wanted classifieds for authenticated account members.',
    tags: ['Player Classifieds'],
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
      query: PlayerClassifiedSearchQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Teams Wanted classifieds',
        content: {
          'application/json': {
            schema: TeamsWantedPublicClassifiedPagedSchemaRef,
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

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/player-classifieds/teams-wanted/{classifiedId}/verify',
    operationId: 'verifyTeamsWantedAccess',
    summary: 'Verify Teams Wanted access code',
    description: 'Verify an access code and return the Teams Wanted classified owner view.',
    tags: ['Player Classifieds'],
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
        name: 'classifiedId',
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
            schema: TeamsWantedAccessCodeSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Verified Teams Wanted classified',
        content: {
          'application/json': {
            schema: TeamsWantedOwnerClassifiedSchemaRef,
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
        description: 'Classified not found',
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

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/player-classifieds/teams-wanted/access-code',
    operationId: 'getTeamsWantedByAccessCode',
    summary: 'Get Teams Wanted classified by access code',
    description: 'Retrieve a Teams Wanted classified owner view using an access code.',
    tags: ['Player Classifieds'],
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
            schema: TeamsWantedAccessCodeSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Teams Wanted classified owner view',
        content: {
          'application/json': {
            schema: TeamsWantedOwnerClassifiedSchemaRef,
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
        description: 'Classified not found',
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

  // GET /api/accounts/{accountId}/player-classifieds/teams-wanted/{classifiedId}

  // GET /api/accounts/{accountId}/player-classifieds/players-wanted/{classifiedId}

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/player-classifieds/teams-wanted/{classifiedId}',
    operationId: 'updateTeamsWantedClassified',
    summary: 'Update Teams Wanted classified',
    description:
      'Update a Teams Wanted classified using either account authentication or access code.',
    tags: ['Player Classifieds'],
    security: [{ bearerAuth: [] }, {}],
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
        name: 'classifiedId',
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
            schema: UpsertTeamsWantedClassifiedSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated Teams Wanted classified',
        content: {
          'application/json': {
            schema: TeamsWantedOwnerClassifiedSchemaRef,
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
      404: {
        description: 'Classified not found',
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

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/player-classifieds/players-wanted/{classifiedId}',
    operationId: 'updatePlayersWantedClassified',
    summary: 'Update Players Wanted classified',
    description: 'Update a Players Wanted classified for an authenticated account member.',
    tags: ['Player Classifieds'],
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
        name: 'classifiedId',
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
            schema: UpsertPlayersWantedClassifiedSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated Players Wanted classified',
        content: {
          'application/json': {
            schema: PlayersWantedClassifiedSchemaRef,
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
        description: 'Classified not found',
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

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/player-classifieds/teams-wanted/{classifiedId}',
    operationId: 'deleteTeamsWantedClassified',
    summary: 'Delete Teams Wanted classified',
    description: 'Delete a Teams Wanted classified using either authentication or access code.',
    tags: ['Player Classifieds'],
    security: [{ bearerAuth: [] }, {}],
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
        name: 'classifiedId',
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
        required: false,
        content: {
          'application/json': {
            schema: TeamsWantedAccessCodeSchemaRef,
          },
        },
      },
    },
    responses: {
      204: {
        description: 'Teams Wanted classified deleted',
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
      404: {
        description: 'Classified not found',
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

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/player-classifieds/players-wanted/{classifiedId}',
    operationId: 'deletePlayersWantedClassified',
    summary: 'Delete Players Wanted classified',
    description: 'Delete a Players Wanted classified for an authenticated account member.',
    tags: ['Player Classifieds'],
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
        name: 'classifiedId',
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
        description: 'Players Wanted classified deleted',
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
        description: 'Classified not found',
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

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/player-classifieds/teams-wanted/{classifiedId}/contact',
    operationId: 'getTeamsWantedContactInfo',
    summary: 'Get Teams Wanted contact info',
    description:
      'Retrieve Teams Wanted classified contact information using either account authentication or a valid access code.',
    tags: ['Player Classifieds'],
    security: [{ bearerAuth: [] }, {}],
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
        name: 'classifiedId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      query: TeamsWantedContactQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Teams Wanted contact information',
        content: {
          'application/json': {
            schema: TeamsWantedContactInfoSchemaRef,
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
      404: {
        description: 'Classified not found',
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

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/player-classifieds/players-wanted/{classifiedId}/contact',
    operationId: 'contactPlayersWantedCreator',
    summary: 'Contact Players Wanted creator',
    description: 'Send a message to the creator of a Players Wanted classified.',
    tags: ['Player Classifieds'],
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
        name: 'classifiedId',
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
            schema: ContactPlayersWantedCreatorSchemaRef,
          },
        },
      },
    },
    responses: {
      204: {
        description: 'Contact request sent',
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
        description: 'Classified not found',
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

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/player-classifieds/positions',
    operationId: 'listPlayerClassifiedPositions',
    summary: 'List baseball positions',
    description: 'Retrieve supported baseball positions for classifieds.',
    tags: ['Player Classifieds'],
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
        description: 'Baseball positions',
        content: {
          'application/json': {
            schema: BaseballPositionSchemaRef.array(),
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
    path: '/api/accounts/{accountId}/player-classifieds/experience-levels',
    operationId: 'listPlayerClassifiedExperienceLevels',
    summary: 'List experience levels',
    description: 'Retrieve supported experience levels for classifieds.',
    tags: ['Player Classifieds'],
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
        description: 'Experience levels',
        content: {
          'application/json': {
            schema: ExperienceLevelSchemaRef.array(),
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

export default registerPlayerClassifiedsEndpoints;
