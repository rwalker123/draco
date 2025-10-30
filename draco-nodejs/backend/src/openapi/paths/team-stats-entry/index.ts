import { RegisterContext } from '../../openapiTypes.js';

const registerTeamStatsEntryEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    ConflictErrorSchemaRef,
    GameAttendanceSchemaRef,
    GameBattingStatLineSchemaRef,
    GameBattingStatsSchemaRef,
    GamePitchingStatLineSchemaRef,
    GamePitchingStatsSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    TeamCompletedGamesSchemaRef,
    UpdateGameAttendanceSchemaRef,
    CreateGameBattingStatSchemaRef,
    UpdateGameBattingStatSchemaRef,
    CreateGamePitchingStatSchemaRef,
    UpdateGamePitchingStatSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  const integerIdSchema = {
    type: 'string' as const,
    format: 'number' as const,
  };

  const accountIdParameter = {
    name: 'accountId',
    in: 'path' as const,
    required: true,
    schema: integerIdSchema,
  };

  const seasonIdParameter = {
    name: 'seasonId',
    in: 'path' as const,
    required: true,
    schema: integerIdSchema,
  };

  const teamSeasonIdParameter = {
    name: 'teamSeasonId',
    in: 'path' as const,
    required: true,
    schema: integerIdSchema,
  };

  const gameIdParameter = {
    name: 'gameId',
    in: 'path' as const,
    required: true,
    schema: integerIdSchema,
  };

  const statIdParameter = {
    name: 'statId',
    in: 'path' as const,
    required: true,
    schema: integerIdSchema,
  };

  const commonParameters = [accountIdParameter, seasonIdParameter, teamSeasonIdParameter];

  const gameParameters = [...commonParameters, gameIdParameter];

  const errorResponses = {
    400: {
      description: 'Validation error.',
      content: { 'application/json': { schema: ValidationErrorSchemaRef } },
    },
    401: {
      description: 'Authentication required.',
      content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
    },
    403: {
      description: 'Team manage permission required.',
      content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
    },
    404: {
      description: 'Resource not found.',
      content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
    },
    500: {
      description: 'Unexpected server error.',
      content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
    },
  };

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/stat-entry/games',
    summary: 'List completed games for stat entry',
    description: 'Returns all games eligible for stat entry for the specified team.',
    tags: ['Team Stats Entry'],
    security: [{ bearerAuth: [] }],
    parameters: [...commonParameters],
    responses: {
      200: {
        description: 'Completed games retrieved.',
        content: { 'application/json': { schema: TeamCompletedGamesSchemaRef } },
      },
      ...errorResponses,
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/stat-entry/games/{gameId}/batting',
    summary: 'Get batting stats for a game',
    tags: ['Team Stats Entry'],
    security: [{ bearerAuth: [] }],
    parameters: [...gameParameters],
    responses: {
      200: {
        description: 'Batting stats retrieved.',
        content: { 'application/json': { schema: GameBattingStatsSchemaRef } },
      },
      ...errorResponses,
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/stat-entry/games/{gameId}/batting',
    summary: 'Add batting line for a player',
    tags: ['Team Stats Entry'],
    security: [{ bearerAuth: [] }],
    parameters: [...gameParameters],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: CreateGameBattingStatSchemaRef } },
      },
    },
    responses: {
      201: {
        description: 'Batting stat created.',
        content: { 'application/json': { schema: GameBattingStatLineSchemaRef } },
      },
      409: {
        description: 'Player already has batting stats for this game.',
        content: { 'application/json': { schema: ConflictErrorSchemaRef } },
      },
      ...errorResponses,
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/stat-entry/games/{gameId}/batting/{statId}',
    summary: 'Update batting line for a player',
    tags: ['Team Stats Entry'],
    security: [{ bearerAuth: [] }],
    parameters: [...gameParameters, statIdParameter],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: UpdateGameBattingStatSchemaRef } },
      },
    },
    responses: {
      200: {
        description: 'Batting stat updated.',
        content: { 'application/json': { schema: GameBattingStatLineSchemaRef } },
      },
      ...errorResponses,
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/stat-entry/games/{gameId}/batting/{statId}',
    summary: 'Delete batting line for a player',
    tags: ['Team Stats Entry'],
    security: [{ bearerAuth: [] }],
    parameters: [...gameParameters, statIdParameter],
    responses: {
      204: { description: 'Batting stat deleted.' },
      ...errorResponses,
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/stat-entry/games/{gameId}/pitching',
    summary: 'Get pitching stats for a game',
    tags: ['Team Stats Entry'],
    security: [{ bearerAuth: [] }],
    parameters: [...gameParameters],
    responses: {
      200: {
        description: 'Pitching stats retrieved.',
        content: { 'application/json': { schema: GamePitchingStatsSchemaRef } },
      },
      ...errorResponses,
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/stat-entry/games/{gameId}/pitching',
    summary: 'Add pitching line for a player',
    tags: ['Team Stats Entry'],
    security: [{ bearerAuth: [] }],
    parameters: [...gameParameters],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: CreateGamePitchingStatSchemaRef } },
      },
    },
    responses: {
      201: {
        description: 'Pitching stat created.',
        content: { 'application/json': { schema: GamePitchingStatLineSchemaRef } },
      },
      409: {
        description: 'Player already has pitching stats for this game.',
        content: { 'application/json': { schema: ConflictErrorSchemaRef } },
      },
      ...errorResponses,
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/stat-entry/games/{gameId}/pitching/{statId}',
    summary: 'Update pitching line for a player',
    tags: ['Team Stats Entry'],
    security: [{ bearerAuth: [] }],
    parameters: [...gameParameters, statIdParameter],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: UpdateGamePitchingStatSchemaRef } },
      },
    },
    responses: {
      200: {
        description: 'Pitching stat updated.',
        content: { 'application/json': { schema: GamePitchingStatLineSchemaRef } },
      },
      ...errorResponses,
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/stat-entry/games/{gameId}/pitching/{statId}',
    summary: 'Delete pitching line for a player',
    tags: ['Team Stats Entry'],
    security: [{ bearerAuth: [] }],
    parameters: [...gameParameters, statIdParameter],
    responses: {
      204: { description: 'Pitching stat deleted.' },
      ...errorResponses,
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/stat-entry/games/{gameId}/attendance',
    summary: 'Get attendance for a game',
    tags: ['Team Stats Entry'],
    security: [{ bearerAuth: [] }],
    parameters: [...gameParameters],
    responses: {
      200: {
        description: 'Attendance retrieved.',
        content: { 'application/json': { schema: GameAttendanceSchemaRef } },
      },
      ...errorResponses,
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/stat-entry/games/{gameId}/attendance',
    summary: 'Update attendance for a game',
    tags: ['Team Stats Entry'],
    security: [{ bearerAuth: [] }],
    parameters: [...gameParameters],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: UpdateGameAttendanceSchemaRef } },
      },
    },
    responses: {
      200: {
        description: 'Attendance updated.',
        content: { 'application/json': { schema: GameAttendanceSchemaRef } },
      },
      ...errorResponses,
    },
  });
};

export default registerTeamStatsEntryEndpoints;
