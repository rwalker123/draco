import { RegisterContext } from '../../openapiTypes.js';

const pathParameters = {
  accountId: {
    name: 'accountId',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'number' },
  },
  categoryId: {
    name: 'categoryId',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'number' },
  },
  questionId: {
    name: 'questionId',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'number' },
  },
  playerId: {
    name: 'playerId',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'number' },
  },
  teamSeasonId: {
    name: 'teamSeasonId',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'number' },
  },
} as const;

const registerPlayerSurveyEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
    PlayerSurveyCategorySchemaRef,
    CreatePlayerSurveyCategorySchemaRef,
    UpdatePlayerSurveyCategorySchemaRef,
    PlayerSurveyQuestionSchemaRef,
    CreatePlayerSurveyQuestionSchemaRef,
    UpdatePlayerSurveyQuestionSchemaRef,
    PlayerSurveyListQuerySchemaRef,
    PlayerSurveyListResponseSchemaRef,
    PlayerSurveyDetailSchemaRef,
    PlayerSurveyAnswerUpsertSchemaRef,
    PlayerSurveyAnswerSchemaRef,
    PlayerSurveySpotlightSchemaRef,
  } = schemaRefs;

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/surveys/categories',
    operationId: 'listPlayerSurveyCategories',
    summary: 'List player survey categories',
    description:
      'Returns survey categories and questions for an account. Requires authentication as either an account administrator or rostered player.',
    tags: ['Player Surveys'],
    security: [{ bearerAuth: [] }],
    parameters: [pathParameters.accountId],
    responses: {
      200: {
        description: 'Survey categories available for the account.',
        content: {
          'application/json': {
            schema: PlayerSurveyCategorySchemaRef.array(),
          },
        },
      },
      401: {
        description: 'Authentication required to access survey categories.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions to access survey categories.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while retrieving survey categories.',
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
    path: '/api/accounts/{accountId}/surveys/categories',
    operationId: 'createPlayerSurveyCategory',
    summary: 'Create a player survey category',
    description: 'Creates a new survey category for an account. Account Admin permission required.',
    tags: ['Player Surveys'],
    security: [{ bearerAuth: [] }],
    parameters: [pathParameters.accountId],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreatePlayerSurveyCategorySchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Survey category created successfully.',
        content: {
          'application/json': {
            schema: PlayerSurveyCategorySchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error creating the survey category.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required to create survey categories.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions to create survey categories.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while creating the survey category.',
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
    path: '/api/accounts/{accountId}/surveys/categories/{categoryId}',
    operationId: 'updatePlayerSurveyCategory',
    summary: 'Update a player survey category',
    description: 'Updates an existing survey category. Account Admin permission required.',
    tags: ['Player Surveys'],
    security: [{ bearerAuth: [] }],
    parameters: [pathParameters.accountId, pathParameters.categoryId],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpdatePlayerSurveyCategorySchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Survey category updated successfully.',
        content: {
          'application/json': {
            schema: PlayerSurveyCategorySchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error updating the survey category.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required to update survey categories.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions to update survey categories.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Survey category not found.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while updating the survey category.',
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
    path: '/api/accounts/{accountId}/surveys/categories/{categoryId}',
    operationId: 'deletePlayerSurveyCategory',
    summary: 'Delete a player survey category',
    description:
      'Deletes a survey category and cascades its questions and answers. Account Admin permission required.',
    tags: ['Player Surveys'],
    security: [{ bearerAuth: [] }],
    parameters: [pathParameters.accountId, pathParameters.categoryId],
    responses: {
      204: {
        description: 'Survey category deleted successfully.',
      },
      401: {
        description: 'Authentication required to delete survey categories.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions to delete survey categories.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Survey category not found.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while deleting the survey category.',
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
    path: '/api/accounts/{accountId}/surveys/categories/{categoryId}/questions',
    operationId: 'createPlayerSurveyQuestion',
    summary: 'Create a player survey question',
    description:
      'Creates a new survey question under a category. Account Admin permission required.',
    tags: ['Player Surveys'],
    security: [{ bearerAuth: [] }],
    parameters: [pathParameters.accountId, pathParameters.categoryId],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreatePlayerSurveyQuestionSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Survey question created successfully.',
        content: {
          'application/json': {
            schema: PlayerSurveyQuestionSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error creating the survey question.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required to create survey questions.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions to create survey questions.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Survey category not found.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while creating the survey question.',
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
    path: '/api/accounts/{accountId}/surveys/questions/{questionId}',
    operationId: 'updatePlayerSurveyQuestion',
    summary: 'Update a player survey question',
    description: 'Updates an existing survey question. Account Admin permission required.',
    tags: ['Player Surveys'],
    security: [{ bearerAuth: [] }],
    parameters: [pathParameters.accountId, pathParameters.questionId],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpdatePlayerSurveyQuestionSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Survey question updated successfully.',
        content: {
          'application/json': {
            schema: PlayerSurveyQuestionSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error updating the survey question.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required to update survey questions.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions to update survey questions.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Survey question not found.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while updating the survey question.',
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
    path: '/api/accounts/{accountId}/surveys/questions/{questionId}',
    operationId: 'deletePlayerSurveyQuestion',
    summary: 'Delete a player survey question',
    description: 'Deletes a survey question. Account Admin permission required.',
    tags: ['Player Surveys'],
    security: [{ bearerAuth: [] }],
    parameters: [pathParameters.accountId, pathParameters.questionId],
    responses: {
      204: {
        description: 'Survey question deleted successfully.',
      },
      401: {
        description: 'Authentication required to delete survey questions.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions to delete survey questions.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Survey question not found.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while deleting the survey question.',
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
    path: '/api/accounts/{accountId}/surveys/answers',
    operationId: 'listPlayerSurveys',
    summary: 'List player surveys',
    description:
      'Returns a paginated list of player surveys limited to current-season participants. Supports optional search.',
    tags: ['Player Surveys'],
    parameters: [pathParameters.accountId],
    request: {
      query: PlayerSurveyListQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Paginated player survey results.',
        content: {
          'application/json': {
            schema: PlayerSurveyListResponseSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error in the survey list request.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while retrieving player surveys.',
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
    path: '/api/accounts/{accountId}/surveys/answers/{playerId}',
    operationId: 'getPlayerSurvey',
    summary: 'Get a player survey',
    description:
      'Returns all survey answers for a specific player. Viewers only see current-season participants unless requesting their own survey.',
    tags: ['Player Surveys'],
    parameters: [pathParameters.accountId, pathParameters.playerId],
    responses: {
      200: {
        description: 'Player survey detail.',
        content: {
          'application/json': {
            schema: PlayerSurveyDetailSchemaRef,
          },
        },
      },
      404: {
        description: 'Player survey not found.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while retrieving the player survey.',
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
    path: '/api/accounts/{accountId}/surveys/answers/{playerId}/questions/{questionId}',
    operationId: 'upsertPlayerSurveyAnswer',
    summary: 'Create or update a player survey answer',
    description:
      'Creates or updates a survey answer for a specific player and question. Players can update their own answers; Account Admins can manage any answer.',
    tags: ['Player Surveys'],
    security: [{ bearerAuth: [] }],
    parameters: [pathParameters.accountId, pathParameters.playerId, pathParameters.questionId],
    request: {
      body: {
        content: {
          'application/json': {
            schema: PlayerSurveyAnswerUpsertSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Survey answer saved successfully.',
        content: {
          'application/json': {
            schema: PlayerSurveyAnswerSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error updating the survey answer.',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required to update survey answers.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions to update the survey answer.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Survey question or player not found.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while saving the survey answer.',
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
    path: '/api/accounts/{accountId}/surveys/answers/{playerId}/questions/{questionId}',
    operationId: 'deletePlayerSurveyAnswer',
    summary: 'Delete a player survey answer',
    description:
      'Deletes a survey answer for a specific player and question. Players can delete their own answers; Account Admins can delete any answer.',
    tags: ['Player Surveys'],
    security: [{ bearerAuth: [] }],
    parameters: [pathParameters.accountId, pathParameters.playerId, pathParameters.questionId],
    responses: {
      204: {
        description: 'Survey answer deleted successfully.',
      },
      401: {
        description: 'Authentication required to delete survey answers.',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions to delete the survey answer.',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Survey question or player not found.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while deleting the survey answer.',
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
    path: '/api/accounts/{accountId}/surveys/spotlight',
    operationId: 'getPlayerSurveySpotlight',
    summary: 'Get a random player survey spotlight',
    description:
      'Returns a random question and answer from a current-season player for display in account widgets.',
    tags: ['Player Surveys'],
    parameters: [pathParameters.accountId],
    responses: {
      200: {
        description: 'Player survey spotlight result.',
        content: {
          'application/json': {
            schema: PlayerSurveySpotlightSchemaRef,
          },
        },
      },
      404: {
        description: 'No eligible survey answers found for the account.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while retrieving the survey spotlight.',
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
    path: '/api/accounts/{accountId}/surveys/teams/{teamSeasonId}/spotlight',
    operationId: 'getPlayerSurveyTeamSpotlight',
    summary: 'Get a random team player survey spotlight',
    description:
      'Returns a random question and answer from a current-season player on the specified team for display in team widgets.',
    tags: ['Player Surveys'],
    parameters: [pathParameters.accountId, pathParameters.teamSeasonId],
    responses: {
      200: {
        description: 'Team-specific player survey spotlight result.',
        content: {
          'application/json': {
            schema: PlayerSurveySpotlightSchemaRef,
          },
        },
      },
      404: {
        description: 'No eligible survey answers found for the team.',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while retrieving the team survey spotlight.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });
};

export default registerPlayerSurveyEndpoints;
