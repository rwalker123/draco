import { RegisterContext } from '../../openapiTypes.js';

export const registerStatisticsEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    InternalServerErrorSchemaRef,
    BattingStatisticsFiltersSchemaRef,
    LeaderCategoriesSchemaRef,
    LeaderRowSchemaRef,
    LeaderStatisticsFiltersSchemaRef,
    NotFoundErrorSchemaRef,
    PitchingStatisticsFiltersSchemaRef,
    PlayerBattingStatsSchemaRef,
    PlayerCareerStatisticsSchemaRef,
    PlayerPitchingStatsSchemaRef,
    RecentGamesQuerySchemaRef,
    RecentGamesSchemaRef,
    TeamSeasonRecordSchemaRef,
    ValidationErrorSchemaRef,
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

  // GET /api/accounts/{accountId}/statistics/players/{playerId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/statistics/players/{playerId}',
    operationId: 'getPlayerCareerStatistics',
    summary: 'Get player career statistics',
    description:
      'Fetch batting and pitching statistics for a single player across all recorded seasons, including per-season breakdowns and career totals.',
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
        name: 'playerId',
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
        description: 'Player career statistics retrieved',
        content: {
          'application/json': {
            schema: PlayerCareerStatisticsSchemaRef,
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
        description: 'Player not found for account',
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

  // GET /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/record
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/record',
    operationId: 'getTeamSeasonRecord',
    summary: 'Get team season record',
    description: 'Retrieve the win/loss/tie record for a specific team within a season.',
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
        description: 'Team season record retrieved',
        content: {
          'application/json': {
            schema: TeamSeasonRecordSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid parameters provided',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Team season not found for the provided account and season',
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

  // GET /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/games
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/games',
    operationId: 'listTeamSeasonGames',
    summary: 'List team games',
    description:
      'Return the recent and upcoming games for a team season with optional limits by category.',
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
      query: RecentGamesQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Team games retrieved',
        content: {
          'application/json': {
            schema: RecentGamesSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid query parameters provided',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Team season not found for the provided account and season',
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

  // GET /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/batting-stats
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/batting-stats',
    operationId: 'listTeamSeasonBattingStats',
    summary: 'List team batting statistics',
    description: 'Retrieve batting statistics for all players on a team season.',
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
        description: 'Team batting statistics retrieved',
        content: {
          'application/json': {
            schema: PlayerBattingStatsSchemaRef.array(),
          },
        },
      },
      400: {
        description: 'Invalid parameters provided',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Team season not found for the provided account and season',
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

  // GET /api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/pitching-stats
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/teams/{teamSeasonId}/pitching-stats',
    operationId: 'listTeamSeasonPitchingStats',
    summary: 'List team pitching statistics',
    description: 'Retrieve pitching statistics for all players on a team season.',
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
        description: 'Team pitching statistics retrieved',
        content: {
          'application/json': {
            schema: PlayerPitchingStatsSchemaRef.array(),
          },
        },
      },
      400: {
        description: 'Invalid parameters provided',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Team season not found for the provided account and season',
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

export default registerStatisticsEndpoints;
