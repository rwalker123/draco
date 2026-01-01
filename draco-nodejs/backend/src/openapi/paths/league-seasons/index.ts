import { RegisterContext } from '../../openapiTypes.js';

export const registerLeagueSeasonsEndpoints = ({ registry, schemaRefs, z }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    ConflictErrorSchemaRef,
    DivisionSeasonSchemaRef,
    DivisionSeasonWithTeamsSchemaRef,
    GameSchemaRef,
    InternalServerErrorSchemaRef,
    LeagueSeasonQueryParamsSchemaRef,
    LeagueSeasonSchemaRef,
    LeagueSeasonWithDivisionTeamsAndUnassignedSchemaRef,
    TeamSeasonSchemaRef,
    LeagueSetupSchemaRef,
    NotFoundErrorSchemaRef,
    SeasonStandingsResponseSchemaRef,
    UpdateDivisionSeasonResponseSchemaRef,
    UpsertDivisionSeasonSchemaRef,
    ValidationErrorSchemaRef,
  } = schemaRefs;

  /**
   * GET /api/accounts/:accountId/seasons/:seasonId/leagues
   * Retrieve league seasons for a season with optional team and division details.
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues',
    operationId: 'listSeasonLeagueSeasons',
    summary: 'List league seasons',
    description:
      'Retrieve all league seasons for a season, optionally including divisions, teams, and roster counts.',
    tags: ['League Seasons'],
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
    ],
    request: {
      query: LeagueSeasonQueryParamsSchemaRef,
    },
    responses: {
      200: {
        description: 'League seasons for the season with optional team metadata',
        content: {
          'application/json': {
            schema: LeagueSetupSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid query parameters supplied',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while fetching league seasons',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/seasons/:seasonId/standings
   * Retrieve season standings optionally grouped by league and division.
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/standings',
    operationId: 'getSeasonStandings',
    summary: 'List season standings',
    description: 'Retrieve team standings for a season with optional league/division grouping.',
    tags: ['League Seasons'],
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
        name: 'grouped',
        in: 'query',
        required: false,
        schema: {
          type: 'boolean',
          default: false,
        },
        description: 'Return standings grouped by league and division when true.',
      },
    ],
    responses: {
      200: {
        description:
          'Season standings in either grouped-by-league format or as a flat list of team records.',
        content: {
          'application/json': {
            schema: SeasonStandingsResponseSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while retrieving season standings.',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId
   * Retrieve a single league season including its divisions and unassigned teams.
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}',
    operationId: 'getLeagueSeason',
    summary: 'Get league season',
    description:
      'Retrieve a league season with its divisions, assigned teams, and unassigned team seasons.',
    tags: ['League Seasons'],
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
        name: 'leagueSeasonId',
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
        description: 'League season detail with divisions and unassigned teams',
        content: {
          'application/json': {
            schema: LeagueSeasonWithDivisionTeamsAndUnassignedSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid identifiers supplied',
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
        description: 'Insufficient permissions to view the league season',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'League season or season not found for the account',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while fetching league season',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * POST /api/accounts/:accountId/seasons/:seasonId/leagues
   * Attach a league to a season.
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues',
    operationId: 'addLeagueToSeason',
    summary: 'Add league to season',
    description: 'Attach a league to the specified season for the account.',
    tags: ['League Seasons'],
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
    ],
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: z
              .object({
                leagueId: z
                  .string()
                  .min(1, 'leagueId is required')
                  .describe('Identifier of the league to attach to the season.'),
              })
              .strict(),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'League added to the season',
        content: {
          'application/json': {
            schema: LeagueSeasonSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid request payload or parameters',
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
        description: 'Account administrator role required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Season or league not found for the account',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'League already added to the season',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while adding league to season',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * DELETE /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId
   * Remove a league from a season.
   */
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}',
    operationId: 'removeLeagueFromSeason',
    summary: 'Remove league from season',
    description: 'Detach a league from the specified season when no dependent records remain.',
    tags: ['League Seasons'],
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
        name: 'leagueSeasonId',
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
        description: 'League removed from the season',
        content: {
          'application/json': {
            schema: z.boolean(),
          },
        },
      },
      400: {
        description: 'Invalid identifiers supplied',
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
        description: 'Account administrator role required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'League season not found for the account',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'League season cannot be deleted because related data exists',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while removing league from season',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions
   * List divisions configured for a league season.
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/divisions',
    operationId: 'listLeagueSeasonDivisions',
    summary: 'List league season divisions',
    description:
      'Retrieve divisions within a league season including the teams assigned to each division.',
    tags: ['League Seasons'],
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
        name: 'leagueSeasonId',
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
        description: 'Divisions for the league season',
        content: {
          'application/json': {
            schema: DivisionSeasonWithTeamsSchemaRef.array(),
          },
        },
      },
      400: {
        description: 'Invalid identifiers supplied',
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
        description: 'Insufficient permissions to view divisions',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Season or league season not found for the account',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while fetching divisions',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * POST /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions
   * Add a division to a league season using an existing division or by creating a new one.
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/divisions',
    operationId: 'addDivisionToLeagueSeason',
    summary: 'Add division to league season',
    description:
      'Add a division to the league season by referencing an existing division or creating a new division definition.',
    tags: ['League Seasons'],
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
        name: 'leagueSeasonId',
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
        required: true,
        content: {
          'application/json': {
            schema: UpsertDivisionSeasonSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Division added to the league season',
        content: {
          'application/json': {
            schema: DivisionSeasonSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid request payload or parameters',
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
        description: 'Account administrator role required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Season, league season, or division not found for the account',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Division already attached to the league season or duplicate division name',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while adding division to league season',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * PUT /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions/:divisionSeasonId
   * Update a division assigned to a league season.
   */
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/divisions/{divisionSeasonId}',
    operationId: 'updateLeagueSeasonDivision',
    summary: 'Update league season division',
    description: 'Update the name or priority for a division assignment within a league season.',
    tags: ['League Seasons'],
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
        name: 'leagueSeasonId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'divisionSeasonId',
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
        required: true,
        content: {
          'application/json': {
            schema: UpsertDivisionSeasonSchemaRef.omit({ divisionId: true }),
          },
        },
      },
    },
    responses: {
      200: {
        description:
          'Division update result. If successful, success is true. If a conflict exists with another division, conflict info is returned.',
        content: {
          'application/json': {
            schema: UpdateDivisionSeasonResponseSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid request payload or parameters',
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
        description: 'Account administrator role required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Season, league season, or division not found for the account',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while updating division',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * DELETE /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions/:divisionSeasonId
   * Remove a division from a league season when no teams are assigned.
   */
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/divisions/{divisionSeasonId}',
    operationId: 'deleteLeagueSeasonDivision',
    summary: 'Delete league season division',
    description: 'Remove a division assignment from a league season once all teams are unassigned.',
    tags: ['League Seasons'],
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
        name: 'leagueSeasonId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'divisionSeasonId',
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
        description: 'Division removed from the league season',
        content: {
          'application/json': {
            schema: z.boolean(),
          },
        },
      },
      400: {
        description: 'Invalid identifiers supplied',
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
        description: 'Account administrator role required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Season, league season, or division not found for the account',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Division contains teams and cannot be removed',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while deleting division',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/games
   * List games scheduled for a league season with optional filters.
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/games',
    operationId: 'listLeagueSeasonGames',
    summary: 'List league season games',
    description:
      'Retrieve games scheduled for a league season with optional date and team filters.',
    tags: ['League Seasons'],
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
        name: 'leagueSeasonId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'startDate',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'date-time',
        },
        description: 'Include games occurring on or after this ISO date.',
      },
      {
        name: 'endDate',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'date-time',
        },
        description: 'Include games occurring on or before this ISO date.',
      },
      {
        name: 'teamId',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          format: 'number',
        },
        description: 'Filter to games where the specified team season participates.',
      },
    ],
    responses: {
      200: {
        description: 'Games for the league season',
        content: {
          'application/json': {
            schema: GameSchemaRef.array(),
          },
        },
      },
      400: {
        description: 'Invalid query parameters supplied',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while fetching games',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * POST /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/teams
   * Create a new team within a league season.
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/teams',
    operationId: 'createLeagueSeasonTeam',
    summary: 'Create league season team',
    description: 'Create a team season within the specified league season.',
    tags: ['League Seasons'],
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
        name: 'leagueSeasonId',
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
        required: true,
        content: {
          'application/json': {
            schema: z
              .object({
                name: z
                  .string()
                  .min(1, 'Team name is required')
                  .describe('Display name for the new team season.'),
              })
              .strict(),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Team season created successfully',
        content: {
          'application/json': {
            schema: TeamSeasonSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid request payload or parameters',
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
        description: 'Account administrator role required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Season or league season not found for the account',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'A team with the same name already exists in this league season',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while creating the team season',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * PUT /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/teams/:teamSeasonId/assign-division
   * Assign a team season to a division within the league season.
   */
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/teams/{teamSeasonId}/assign-division',
    operationId: 'assignLeagueSeasonTeamDivision',
    summary: 'Assign team to division',
    description: 'Assign an unassigned team season to a division within the league season.',
    tags: ['League Seasons'],
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
        name: 'leagueSeasonId',
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
        required: true,
        content: {
          'application/json': {
            schema: z
              .object({
                divisionSeasonId: z
                  .string()
                  .min(1, 'divisionSeasonId is required')
                  .describe('Division season identifier to assign the team to.'),
              })
              .strict(),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Team assigned to the division',
        content: {
          'application/json': {
            schema: z.boolean(),
          },
        },
      },
      400: {
        description: 'Invalid request payload or parameters',
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
        description: 'Account administrator role required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Season, league season, division, or team not found for the account',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Team is already assigned to a division',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while assigning team to division',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * DELETE /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/teams/:teamSeasonId/remove-from-division
   * Remove a team season from its division assignment.
   */
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/seasons/{seasonId}/leagues/{leagueSeasonId}/teams/{teamSeasonId}/remove-from-division',
    operationId: 'removeLeagueSeasonTeamDivision',
    summary: 'Remove team from division',
    description: 'Remove a team season from its current division assignment, making it unassigned.',
    tags: ['League Seasons'],
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
        name: 'leagueSeasonId',
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
        description: 'Team removed from the division',
        content: {
          'application/json': {
            schema: z.boolean(),
          },
        },
      },
      400: {
        description: 'Invalid identifiers supplied',
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
        description: 'Account administrator role required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Season, league season, or team not found for the account',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while removing team from division',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });
};

export default registerLeagueSeasonsEndpoints;
