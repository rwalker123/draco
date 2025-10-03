import { RegisterContext } from '../../openapiTypes.js';

export const registerStatisticsEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    BattingStatisticsFiltersSchemaRef,
    LeaderCategoriesSchemaRef,
    LeaderRowSchemaRef,
    LeaderStatisticsFiltersSchemaRef,
    PitchingStatisticsFiltersSchemaRef,
    PlayerBattingStatsSchemaRef,
    PlayerPitchingStatsSchemaRef,
    ValidationErrorSchemaRef,
    InternalServerErrorSchemaRef,
  } = schemaRefs;

  // GET /api/accounts/{accountId}/statistics/leader-categories
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/statistics/leader-categories',
    operationId: 'getLeaderCategories',
    summary: 'Get leader categories',
    description: 'Retrieve configured batting and pitching leader categories for an account.',
    tags: ['Statistics'],
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
        description: 'Leader categories retrieved',
        content: {
          'application/json': {
            schema: LeaderCategoriesSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid account id provided',
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

  // GET /api/accounts/{accountId}/statistics/batting/{leagueId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/statistics/batting/{leagueId}',
    operationId: 'listBattingStatistics',
    summary: 'List batting statistics',
    description:
      'Fetch batting statistics for a league, supporting optional division, team, and historical filters.',
    tags: ['Statistics'],
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
        name: 'leagueId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      query: BattingStatisticsFiltersSchemaRef,
    },
    responses: {
      200: {
        description: 'Batting statistics retrieved',
        content: {
          'application/json': {
            schema: PlayerBattingStatsSchemaRef.array(),
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

  // GET /api/accounts/{accountId}/statistics/pitching/{leagueId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/statistics/pitching/{leagueId}',
    operationId: 'listPitchingStatistics',
    summary: 'List pitching statistics',
    description:
      'Fetch pitching statistics for a league, supporting optional division, team, and historical filters.',
    tags: ['Statistics'],
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
        name: 'leagueId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      query: PitchingStatisticsFiltersSchemaRef,
    },
    responses: {
      200: {
        description: 'Pitching statistics retrieved',
        content: {
          'application/json': {
            schema: PlayerPitchingStatsSchemaRef.array(),
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

  // GET /api/accounts/{accountId}/statistics/leaders/{leagueId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/statistics/leaders/{leagueId}',
    operationId: 'listStatisticalLeaders',
    summary: 'List statistical leaders',
    description:
      'Retrieve statistical leaders for a category within a league with optional filters and limits.',
    tags: ['Statistics'],
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
        name: 'leagueId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'category',
        in: 'query',
        required: true,
        description: 'Statistic category key (for example: avg, era, hr).',
        schema: {
          type: 'string',
        },
      },
    ],
    request: {
      query: LeaderStatisticsFiltersSchemaRef,
    },
    responses: {
      200: {
        description: 'Leader board retrieved',
        content: {
          'application/json': {
            schema: LeaderRowSchemaRef.array(),
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
};

export default registerStatisticsEndpoints;
