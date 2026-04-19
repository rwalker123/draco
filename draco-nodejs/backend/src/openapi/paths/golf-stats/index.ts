import { RegisterContext } from '../../openapiTypes.js';

export const registerGolfStatsEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    GolfFlightLeadersSchemaRef,
    GolfLeaderSchemaRef,
    GolfScoringAverageSchemaRef,
    GolfSkinsEntrySchemaRef,
    GolfLeaderboardSchemaRef,
    GolfPuttContestEntrySchemaRef,
    GolfPlayerDetailedStatsSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    RegenerateStatsRequestSchemaRef,
    RegenerateStatsResultSchemaRef,
  } = schemaRefs;

  const GolfLeaderListSchemaRef = z.array(GolfLeaderSchemaRef).openapi({
    title: 'GolfLeaderList',
    description: 'List of golf leaders',
  });

  const GolfScoringAverageListSchemaRef = z.array(GolfScoringAverageSchemaRef).openapi({
    title: 'GolfScoringAverageList',
    description: 'List of golf scoring averages',
  });

  const GolfSkinsEntryListSchemaRef = z.array(GolfSkinsEntrySchemaRef).openapi({
    title: 'GolfSkinsEntryList',
    description: 'List of golf skins entries',
  });

  const GolfLeaderboardListSchemaRef = z.array(GolfLeaderboardSchemaRef).openapi({
    title: 'GolfLeaderboardList',
    description: 'List of golf leaderboards',
  });

  const GolfPuttContestEntryListSchemaRef = z.array(GolfPuttContestEntrySchemaRef).openapi({
    title: 'GolfPuttContestEntryList',
    description: 'List of golf putt contest entries',
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/stats/flight/{flightId}/leaders',
    description: 'Get golf flight leader statistics',
    operationId: 'getGolfFlightLeaders',
    summary: 'Get flight leaders',
    tags: ['Golf Stats'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'flightId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Golf flight leaders',
        content: { 'application/json': { schema: GolfFlightLeadersSchemaRef } },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Access denied',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/stats/flight/{flightId}/low-scores',
    description: 'Get low score leaders for a flight',
    operationId: 'getGolfFlightLowScores',
    summary: 'Get flight low scores',
    tags: ['Golf Stats'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'flightId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'type',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['actual', 'net'], default: 'actual' },
        description: 'Score type to return',
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', default: 10 },
        description: 'Maximum number of leaders to return',
      },
    ],
    responses: {
      200: {
        description: 'Low score leaders',
        content: { 'application/json': { schema: GolfLeaderListSchemaRef } },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Access denied',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/stats/flight/{flightId}/scoring-averages',
    description: 'Get scoring averages for players in a flight',
    operationId: 'getGolfFlightScoringAverages',
    summary: 'Get flight scoring averages',
    tags: ['Golf Stats'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'flightId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', default: 20 },
        description: 'Maximum number of results to return',
      },
    ],
    responses: {
      200: {
        description: 'Scoring averages for the flight',
        content: { 'application/json': { schema: GolfScoringAverageListSchemaRef } },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Access denied',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/stats/flight/{flightId}/skins',
    description: 'Get skins leaders for a flight',
    operationId: 'getGolfFlightSkins',
    summary: 'Get flight skins leaders',
    tags: ['Golf Stats'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'flightId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'type',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['actual', 'net'], default: 'actual' },
        description: 'Score type for skins calculation',
      },
      {
        name: 'weekNumber',
        in: 'query',
        required: false,
        schema: { type: 'integer' },
        description: 'Filter by week number',
      },
    ],
    responses: {
      200: {
        description: 'Skins leaders for the flight',
        content: { 'application/json': { schema: GolfSkinsEntryListSchemaRef } },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Access denied',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/stats/flight/{flightId}/score-types',
    description: 'Get score type leaderboards for a flight',
    operationId: 'getGolfFlightScoreTypes',
    summary: 'Get flight score type leaderboards',
    tags: ['Golf Stats'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'flightId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Score type leaderboards',
        content: { 'application/json': { schema: GolfLeaderboardListSchemaRef } },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Access denied',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/stats/flight/{flightId}/putt-contest',
    description: 'Get putt contest results for a flight',
    operationId: 'getGolfFlightPuttContest',
    summary: 'Get flight putt contest results',
    tags: ['Golf Stats'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'flightId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'weekNumber',
        in: 'query',
        required: false,
        schema: { type: 'integer' },
        description: 'Filter by week number',
      },
    ],
    responses: {
      200: {
        description: 'Putt contest results',
        content: { 'application/json': { schema: GolfPuttContestEntryListSchemaRef } },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Access denied',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/golf/stats/player/{contactId}/detailed-stats',
    description: 'Get detailed statistics for a golf player',
    operationId: 'getGolfPlayerDetailedStats',
    summary: 'Get player detailed stats',
    tags: ['Golf Stats'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'contactId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'seasonId',
        in: 'query',
        required: false,
        schema: { type: 'string', format: 'number' },
        description: 'Filter stats to a specific season',
      },
    ],
    responses: {
      200: {
        description: 'Detailed player statistics',
        content: { 'application/json': { schema: GolfPlayerDetailedStatsSchemaRef } },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Access denied',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Player not found',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/golf/stats/regenerate',
    description: 'Regenerate golf statistics for a league season',
    operationId: 'regenerateGolfStats',
    summary: 'Regenerate golf stats',
    tags: ['Golf Stats'],
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
        content: { 'application/json': { schema: RegenerateStatsRequestSchemaRef } },
      },
    },
    responses: {
      200: {
        description: 'Stats regeneration results',
        content: { 'application/json': { schema: RegenerateStatsResultSchemaRef } },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Access denied',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Internal server error',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });
};

export default registerGolfStatsEndpoints;
