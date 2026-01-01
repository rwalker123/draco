# Golf Module Implementation Todo List

This comprehensive todo list is derived from [golf-plan.md](golf-plan.md) and aligned with the architecture patterns defined in the CLAUDE.md files for backend, frontend, and shared directories.

---

## Phase 1: Database Verification & Schema Foundation

### 1.1 Prisma Schema Verification ✅
- [x] Verify `golfcourse` table exists and matches ASP.NET `GolfCourse.cs` model
- [x] Verify `golfcourseforcontact` table for user-course associations
- [x] Verify `golfleaguecourses` table for league-course associations
- [x] Verify `golfleaguesetup` table for league configuration
- [x] Verify `golfmatch` table for match definitions
- [x] Verify `golfmatchscores` table for match-score links
- [x] Verify `golfroster` table for player roster management
- [x] Verify `golfscore` table for 18-hole scores + metadata
- [x] Verify `golfstatdef` table for statistic definitions
- [x] Verify `golferstatsconfiguration` table for player stat configs
- [x] Verify `golferstatsvalue` table for stat values per score
- [x] Verify `golfteeinformation` table for tee sets per course
- [x] Run `npx prisma generate` from `draco-nodejs/backend` to update Prisma client

### 1.2 Shared Schemas ✅

#### `shared-schemas/golfCourse.ts` ✅
- [x] Create `GolfCourseSchema` with par arrays (holes 1-18)
- [x] Create `GolfCourseParSchema` for per-hole par info
- [x] Create `GolfCourseTeeSchema` with color, ratings, slopes
- [x] Create `GolfTeeHoleDistanceSchema` for per-hole distances
- [x] Create `CreateGolfCourseSchema` for course creation
- [x] Create `UpdateGolfCourseSchema` for course updates
- [x] Add OpenAPI metadata via `extendZodWithOpenApi(z)`
- [x] Export all schemas in barrel export

#### `shared-schemas/golfLeague.ts` ✅
- [x] Create `GolfLeagueSetupSchema` (first tee time, holes per match, etc.)
- [x] Create `GolfScoringConfigSchema` (scoring configuration)
- [x] Create `CreateGolfLeagueSetupSchema`
- [x] Create `UpdateGolfLeagueSetupSchema`

#### `shared-schemas/golfFlight.ts` ✅
- [x] Create `GolfFlightSchema` (uses LeagueSeason as "flights")
- [x] Create `CreateGolfFlightSchema`
- [x] Create `UpdateGolfFlightSchema`

#### `shared-schemas/golfMatch.ts` ✅
- [x] Create `GolfMatchSchema` (teams, course, status)
- [x] Create `GolfMatchWithScoresSchema` (match with scores)
- [x] Create `CreateGolfMatchSchema`
- [x] Create `UpdateGolfMatchSchema`
- [x] Create `GolfMatchDayResultsSchema` for match day results

#### `shared-schemas/golfRoster.ts` ✅
- [x] Create `GolfRosterEntrySchema` (player on team with `isSub` flag)
- [x] Create `GolfPlayerSchema` (extended contact info)
- [x] Create `CreateGolfPlayerSchema`
- [x] Create `UpdateGolfPlayerSchema`
- [x] Create `SignPlayerSchema` for signing existing contacts

#### `shared-schemas/golfScore.ts` ✅
- [x] Create `GolfScoreSchema` (18 holes + metadata)
- [x] Create `GolfHoleScoresSchema` (individual hole scores)
- [x] Create `CreateGolfScoreSchema`
- [x] Create `PlayerMatchScoreSchema` for score input
- [x] Create `SubmitMatchScoresSchema` for submitting match scores

#### `shared-schemas/golfHandicap.ts` ✅
- [x] Create `GolfDifferentialSchema` (differential calculation)
- [x] Create `PlayerHandicapSchema` (handicap display)
- [x] Create `CourseHandicapSchema` (course handicap calculation)
- [x] Create `ESCMaxScoreSchema` (ESC max score)

#### `shared-schemas/golfStandings.ts` ✅
- [x] Create `GolfTeamStandingSchema` (match/stroke/total points)
- [x] Create `GolfFlightStandingsSchema` (flight standings)
- [x] Create `GolfLeagueStandingsSchema` (full standings)

#### `shared-schemas/golfStats.ts` ✅
- [x] Create `GolfStatDefSchema` (stat definitions)
- [x] Create `GolfLeaderSchema` (leader entry)
- [x] Create `GolfSkinsEntrySchema` (skins tracking)
- [x] Create `GolfFlightLeadersSchema` (flight leaders)

#### `shared-schemas/golfTeam.ts` ✅
- [x] Create `GolfTeamSchema` (golf team)
- [x] Create `GolfTeamWithRosterSchema` (team with roster)
- [x] Create `GolfTeamDetailSchema` (full team details)
- [x] Create `CreateGolfTeamSchema` / `UpdateGolfTeamSchema`

### 1.3 Regenerate API Client
- [x] Run `npm run sync:api` from repo root
- [x] Verify `shared-api-client/generated` is updated
- [x] Run `npm run build` to confirm bundles

---

## Phase 2: Backend Core Services - Golf Course Management

### 2.1 Repository Layer (`backend/src/repositories`) ✅

#### Interface: `IGolfCourseRepository` (`interfaces/IGolfCourseRepository.ts`) ✅
- [x] Define `findById(courseId: bigint): Promise<golfcourse | null>`
- [x] Define `findByIdWithTees(courseId: bigint): Promise<GolfCourseWithTees | null>`
- [x] Define `findLeagueCourses(accountId: bigint): Promise<GolfLeagueCourseRaw[]>`
- [x] Define `create(data): Promise<golfcourse>`
- [x] Define `update(courseId: bigint, data): Promise<golfcourse>`
- [x] Define `delete(courseId: bigint): Promise<golfcourse>`
- [x] Define `addLeagueCourse`, `removeLeagueCourse`, `updateLeagueCourseDefaults`
- [x] Define `findByName`, `findByNameExcludingId`, `isCourseInUse`

#### Implementation: `PrismaGolfCourseRepository` (`implementations/PrismaGolfCourseRepository.ts`) ✅
- [x] Implement all interface methods using Prisma client
- [x] Include related tee information in queries
- [x] Handle league course associations

#### Interface: `IGolfTeeRepository` (`interfaces/IGolfTeeRepository.ts`) ✅
- [x] Define `findByCourseId(courseId: bigint): Promise<golfteeinformation[]>`
- [x] Define `findById(teeId: bigint): Promise<golfteeinformation | null>`
- [x] Define `create(data): Promise<golfteeinformation>`
- [x] Define `update(teeId: bigint, data): Promise<golfteeinformation>`
- [x] Define `delete(teeId: bigint): Promise<golfteeinformation>`
- [x] Define `findByColor`, `findByColorExcludingId`, `isTeeInUse`, `updatePriorities`

#### Implementation: `PrismaGolfTeeRepository` ✅
- [x] Implement all interface methods
- [x] Include priority-based ordering
- [x] Handle batch priority updates via transaction

#### RepositoryFactory Updates ✅
- [x] Add `IGolfCourseRepository` and `IGolfTeeRepository` to interfaces
- [x] Add `PrismaGolfCourseRepository` and `PrismaGolfTeeRepository` to implementations
- [x] Add `getGolfCourseRepository()` and `getGolfTeeRepository()` factory methods

### 2.2 Response Formatters (`backend/src/responseFormatters`) ✅

#### `GolfCourseResponseFormatter.ts` ✅
- [x] Create `format(dbCourse): GolfCourseType` method
- [x] Create `formatMany(dbCourses): GolfCourseType[]` method
- [x] Create `formatWithTees(dbCourse): GolfCourseWithTeesType` method
- [x] Create `formatLeagueCourse(dbLeagueCourse): GolfLeagueCourseType` method
- [x] Handle BigInt → string conversions
- [x] Map par/handicap arrays correctly via helper methods

#### `GolfTeeResponseFormatter.ts` ✅
- [x] Create `format(dbTee): GolfCourseTeeType` method
- [x] Create `formatMany(dbTees): GolfCourseTeeType[]` method
- [x] Include rating/slope/distance formatting
- [x] Export from index.ts

### 2.3 Service Layer (`backend/src/services`) ✅

#### `GolfCourseService.ts` ✅
- [x] Import via ServiceFactory pattern
- [x] Inject repository via RepositoryFactory
- [x] Implement `getCourseById(courseId): Promise<GolfCourseType>`
- [x] Implement `getLeagueCourses(accountId): Promise<GolfCourseType[]>`
- [x] Implement `createCourse(data, accountId): Promise<GolfCourseType>`
- [x] Implement `updateCourse(courseId, data): Promise<GolfCourseType>`
- [x] Implement `deleteCourse(courseId): Promise<void>`
- [x] Use response formatter for all returns

#### `GolfTeeService.ts` ✅
- [x] Implement `getTeesForCourse(courseId): Promise<GolfCourseTeeType[]>`
- [x] Implement `createTee(courseId, data): Promise<GolfCourseTeeType>`
- [x] Implement `updateTee(teeId, data): Promise<GolfCourseTeeType>`
- [x] Implement `deleteTee(teeId): Promise<void>`

### 2.4 Expose Services via Factories ✅
- [x] Add `GolfCourseService` to `ServiceFactory`
- [x] Add `GolfTeeService` to `ServiceFactory`
- [x] Add `GolfCourseRepository` to `RepositoryFactory`
- [x] Add `GolfTeeRepository` to `RepositoryFactory`

### 2.5 Route Layer (`backend/src/routes`) ✅

#### `golf-courses.ts` ✅
- [x] `GET /league-courses` - List league courses
- [x] `GET /:courseId` - Get course details with tees
- [x] `POST /` - Create course
- [x] `PUT /:courseId` - Update course
- [x] `DELETE /:courseId` - Delete course
- [x] `POST /league-courses` - Add course to league
- [x] `DELETE /league-courses/:courseId` - Remove course from league
- [x] Apply `authenticateToken` middleware
- [x] Apply `routeProtection.enforceAccountBoundary()`
- [x] Apply `routeProtection.requirePermission('account.manage')`
- [x] Use `asyncHandler` for all routes
- [x] Validate request bodies with Zod schemas

#### `golf-tees.ts` ✅
- [x] `GET /` - List tees for course
- [x] `GET /:teeId` - Get single tee
- [x] `POST /` - Create tee
- [x] `PUT /:teeId` - Update tee
- [x] `DELETE /:teeId` - Delete tee
- [x] `PUT /priorities` - Update tee priorities
- [x] Apply proper middleware stack

#### Route Registration in `app.ts` ✅
- [x] Registered `/api/accounts/:accountId/golf/courses`
- [x] Registered `/api/accounts/:accountId/golf/courses/:courseId/tees`

### 2.6 OpenAPI Registration
- [x] Register all course schemas in `zod-to-openapi.ts`
- [x] Register all course endpoints with proper tags
- [x] Run `npm run sync:api` to regenerate client

### 2.7 Testing
- [x] Write unit tests for `GolfCourseService`
- [x] Write unit tests for `GolfTeeService`
- [x] Write integration tests for course routes
- [x] Run `npm run backend:test`
- [x] Run `npm run backend:lint`
- [x] Run `npm run backend:type-check`

---

## Phase 3: Backend League & Flight Management

### 3.1 Repository Layer

#### `IGolfLeagueRepository` / `PrismaGolfLeagueRepository`
- [x] Define and implement `findByAccountId(accountId): Promise<GolfLeagueSetupWithOfficers>`
- [x] Define and implement `update(accountId, data): Promise<golfleaguesetup>`
- [x] Define and implement `getGolfAccounts(): Promise<GolfAccountInfo[]>`

#### `IGolfFlightRepository` / `PrismaGolfFlightRepository`
- [x] Define and implement `findBySeasonId(seasonId): Promise<GolfFlightWithCounts[]>`
- [x] Define and implement `findById(flightId): Promise<GolfFlightWithDetails>`
- [x] Define and implement `create(seasonId, divisionId, priority): Promise<divisionseason>`
- [x] Define and implement `update(flightId, data): Promise<divisionseason>`
- [x] Define and implement `delete(flightId): Promise<divisionseason>`
- [x] Define and implement `findOrCreateDivision(accountId, name): Promise<divisiondefs>`
- [x] Define and implement `getPlayerCountForFlight(flightId): Promise<number>`
- [x] Define and implement `leagueSeasonExists(seasonId): Promise<boolean>`

### 3.2 Response Formatters
- [x] Create `GolfLeagueResponseFormatter.ts`
- [x] Create `GolfFlightResponseFormatter.ts`

### 3.3 Service Layer

#### `GolfLeagueService.ts`
- [x] Implement `getLeagueSetup(accountId): Promise<GolfLeagueSetupType>`
- [x] Implement `updateLeagueSetup(accountId, data): Promise<GolfLeagueSetupType>`
- [x] Implement `getGolfAccounts(): Promise<GolfAccountInfoResponse[]>`

#### `GolfFlightService.ts`
- [x] Implement `getFlightsForSeason(seasonId): Promise<GolfFlightWithTeamCountType[]>`
- [x] Implement `getFlightById(flightId): Promise<GolfFlightType>`
- [x] Implement `createFlight(seasonId, accountId, data): Promise<GolfFlightType>`
- [x] Implement `updateFlight(flightId, accountId, data): Promise<GolfFlightType>`
- [x] Implement `deleteFlight(flightId): Promise<void>`

### 3.4 Factories
- [x] Add services to ServiceFactory
- [x] Add repositories to RepositoryFactory

### 3.5 Routes

#### `golf-leagues.ts`
- [x] `GET /api/golf/leagues` - List golf accounts
- [x] `GET /api/golf/leagues/:accountId/setup` - Get league setup
- [x] `PUT /api/golf/leagues/:accountId/setup` - Update league setup
- [x] Apply proper middleware stack

#### `golf-flights.ts`
- [x] `GET /api/accounts/:accountId/golf/flights/:seasonId` - List flights
- [x] `POST /api/accounts/:accountId/golf/flights/:seasonId` - Create flight
- [x] `PUT /api/accounts/:accountId/golf/flights/:seasonId/:flightId` - Update flight
- [x] `DELETE /api/accounts/:accountId/golf/flights/:seasonId/:flightId` - Delete flight

#### Route Registration in `app.ts`
- [x] Registered `/api/golf/leagues`
- [x] Registered `/api/accounts/:accountId/golf/flights`

### 3.6 OpenAPI & Testing
- [x] Register schemas in `openapiTypes.ts` (GolfLeagueSetup, GolfFlight, etc.)
- [x] Create `paths/golf-leagues/index.ts` with endpoint registrations
- [x] Create `paths/golf-flights/index.ts` with endpoint registrations
- [x] Run `npm run sync:api` to regenerate client
- [x] Write unit and integration tests
- [x] Run lint and type-check

---

## Phase 4: Backend Team & Roster Management ✅

### 4.1 Repository Layer ✅

#### `IGolfTeamRepository` / `PrismaGolfTeamRepository` ✅
- [x] `findBySeasonId(seasonId): Promise<GolfTeamWithFlight[]>`
- [x] `findByFlightId(flightId): Promise<GolfTeamWithFlight[]>`
- [x] `findById(teamSeasonId): Promise<GolfTeamWithFlight>`
- [x] `findByIdWithRoster(teamSeasonId): Promise<GolfTeamWithRoster>`
- [x] `create(seasonId, accountId, name, flightId?): Promise<teamsseason>`
- [x] `update(teamSeasonId, data): Promise<teamsseason>`
- [x] `delete(teamSeasonId): Promise<teamsseason>`
- [x] `assignToFlight(teamSeasonId, flightId): Promise<teamsseason>`
- [x] `findOrCreateTeamDef(accountId): Promise<teams>`
- [x] `teamSeasonExists(teamSeasonId, seasonId): Promise<boolean>`
- [x] `hasMatches(teamSeasonId): Promise<boolean>`

#### `IGolfRosterRepository` / `PrismaGolfRosterRepository` ✅
- [x] `findByTeamSeasonId(teamSeasonId): Promise<GolfRosterWithContact[]>`
- [x] `findById(rosterId): Promise<GolfRosterWithContact>`
- [x] `findByContactAndTeam(contactId, teamSeasonId): Promise<golfroster>`
- [x] `findSubstitutesForSeason(seasonId): Promise<GolfSubstituteEntry[]>`
- [x] `findSubstitutesForFlight(flightId): Promise<GolfSubstituteEntry[]>`
- [x] `findAvailableContacts(accountId, seasonId): Promise<AvailableContact[]>`
- [x] `create(data): Promise<golfroster>`
- [x] `update(rosterId, data): Promise<golfroster>`
- [x] `delete(rosterId): Promise<golfroster>`
- [x] `releasePlayer(rosterId, releaseAsSub, seasonId): Promise<golfroster>`
- [x] `contactExistsInAccount(contactId, accountId): Promise<boolean>`
- [x] `createContact(accountId, data): Promise<contacts>`
- [x] `hasScores(rosterId): Promise<boolean>`

### 4.2 Response Formatters ✅
- [x] Create `GolfTeamResponseFormatter.ts`
- [x] Create `GolfRosterResponseFormatter.ts`

### 4.3 Service Layer ✅

#### `GolfTeamService.ts` ✅
- [x] `getTeamsForSeason(seasonId): Promise<GolfTeamType[]>`
- [x] `getTeamsForFlight(flightId): Promise<GolfTeamType[]>`
- [x] `getTeamById(teamSeasonId): Promise<GolfTeamType>`
- [x] `getTeamWithRoster(teamSeasonId): Promise<GolfTeamWithRosterType>`
- [x] `createTeam(seasonId, accountId, data): Promise<GolfTeamType>`
- [x] `updateTeam(teamSeasonId, accountId, data): Promise<GolfTeamType>`
- [x] `deleteTeam(teamSeasonId): Promise<void>`
- [x] `assignTeamToFlight(teamSeasonId, flightId): Promise<GolfTeamType>`
- [x] `getUnassignedTeams(seasonId): Promise<GolfTeamType[]>`

#### `GolfRosterService.ts` ✅
- [x] `getRoster(teamSeasonId): Promise<GolfRosterEntryType[]>`
- [x] `getRosterEntry(rosterId): Promise<GolfRosterEntryType>`
- [x] `getSubstitutesForSeason(seasonId): Promise<GolfSubstituteType[]>`
- [x] `getSubstitutesForFlight(flightId): Promise<GolfSubstituteType[]>`
- [x] `getAvailablePlayers(accountId, seasonId): Promise<AvailablePlayerType[]>`
- [x] `createAndSignPlayer(teamSeasonId, accountId, seasonId, data): Promise<GolfRosterEntryType>`
- [x] `signPlayer(teamSeasonId, accountId, seasonId, data): Promise<GolfRosterEntryType>`
- [x] `updatePlayer(rosterId, data): Promise<GolfRosterEntryType>`
- [x] `releasePlayer(rosterId, seasonId, data): Promise<void>`
- [x] `deletePlayer(rosterId): Promise<void>`

### 4.4 Factories ✅
- [x] Add `GolfTeamService` and `GolfRosterService` to `ServiceFactory`
- [x] Add `GolfTeamRepository` and `GolfRosterRepository` to `RepositoryFactory`

### 4.5 Routes ✅

#### `golf-teams.ts` ✅
- [x] `GET /api/accounts/:accountId/golf/teams/season/:seasonId` - List teams for season
- [x] `GET /api/accounts/:accountId/golf/teams/season/:seasonId/unassigned` - List unassigned teams
- [x] `GET /api/accounts/:accountId/golf/teams/flight/:flightId` - List teams in flight
- [x] `GET /api/accounts/:accountId/golf/teams/:teamSeasonId` - Get team by ID
- [x] `GET /api/accounts/:accountId/golf/teams/:teamSeasonId/roster` - Get team with roster
- [x] `POST /api/accounts/:accountId/golf/teams/season/:seasonId` - Create team
- [x] `PUT /api/accounts/:accountId/golf/teams/:teamSeasonId` - Update team
- [x] `PUT /api/accounts/:accountId/golf/teams/:teamSeasonId/flight/:flightId` - Assign to flight
- [x] `DELETE /api/accounts/:accountId/golf/teams/:teamSeasonId/flight` - Remove from flight
- [x] `DELETE /api/accounts/:accountId/golf/teams/:teamSeasonId` - Delete team

#### `golf-rosters.ts` ✅
- [x] `GET /api/accounts/:accountId/golf/rosters/team/:teamSeasonId` - Get roster
- [x] `GET /api/accounts/:accountId/golf/rosters/substitutes/season/:seasonId` - Get season subs
- [x] `GET /api/accounts/:accountId/golf/rosters/substitutes/flight/:flightId` - Get flight subs
- [x] `GET /api/accounts/:accountId/golf/rosters/available/:seasonId` - Available players
- [x] `GET /api/accounts/:accountId/golf/rosters/:rosterId` - Get roster entry
- [x] `POST /api/accounts/:accountId/golf/rosters/team/:teamSeasonId/create` - Create & sign player
- [x] `POST /api/accounts/:accountId/golf/rosters/team/:teamSeasonId/sign` - Sign existing contact
- [x] `PUT /api/accounts/:accountId/golf/rosters/:rosterId` - Update player
- [x] `POST /api/accounts/:accountId/golf/rosters/:rosterId/release` - Release player
- [x] `DELETE /api/accounts/:accountId/golf/rosters/:rosterId` - Delete player

### 4.6 OpenAPI & Testing ✅
- [x] Register all schemas in `openapiTypes.ts`
- [x] Run `npm run backend:lint` - passed
- [x] Run `npm run backend:type-check` - passed

---

## Phase 5: Backend Match & Score Management ✅

### 5.1 Repository Layer ✅

#### `IGolfMatchRepository` / `PrismaGolfMatchRepository` ✅
- [x] `findBySeasonId(seasonId): Promise<GolfMatchWithTeams[]>`
- [x] `findByFlightId(flightId): Promise<GolfMatchWithTeams[]>`
- [x] `findById(matchId): Promise<GolfMatchWithTeams | null>`
- [x] `findByIdWithScores(matchId): Promise<GolfMatchWithScores | null>`
- [x] `findUpcoming(seasonId, limit): Promise<GolfMatchWithTeams[]>`
- [x] `findCompleted(seasonId, limit): Promise<GolfMatchWithTeams[]>`
- [x] `findByTeam(teamSeasonId): Promise<GolfMatchWithTeams[]>`
- [x] `findByDate(seasonId, date): Promise<GolfMatchWithTeams[]>`
- [x] `create(data): Promise<golfmatch>`
- [x] `update(matchId, data): Promise<golfmatch>`
- [x] `delete(matchId): Promise<golfmatch>`
- [x] `updateStatus(matchId, status): Promise<golfmatch>`
- [x] `hasScores(matchId): Promise<boolean>`

#### `IGolfScoreRepository` / `PrismaGolfScoreRepository` ✅
- [x] `findById(scoreId): Promise<GolfScoreWithDetails | null>`
- [x] `findByContactId(contactId, limit): Promise<GolfScoreWithDetails[]>`
- [x] `findByMatchId(matchId): Promise<GolfMatchScoreWithDetails[]>`
- [x] `findByTeamAndMatch(matchId, teamId): Promise<GolfMatchScoreWithDetails[]>`
- [x] `create(data): Promise<golfscore>`
- [x] `update(scoreId, data): Promise<golfscore>`
- [x] `delete(scoreId): Promise<golfscore>`
- [x] `createMatchScore(data): Promise<golfmatchscores>`
- [x] `deleteMatchScores(matchId): Promise<number>`
- [x] `deleteMatchScoresForTeam(matchId, teamId): Promise<number>`
- [x] `getPlayerScoresForSeason(contactId, seasonId): Promise<GolfScoreWithDetails[]>`
- [x] `calculateDifferential(score, teeInfo): number`

### 5.2 Response Formatters ✅
- [x] Create `GolfMatchResponseFormatter.ts`
- [x] Create `GolfScoreResponseFormatter.ts`

### 5.3 Service Layer ✅

#### `GolfMatchService.ts` ✅
- [x] `getMatchesForSeason(seasonId): Promise<GolfMatchType[]>`
- [x] `getMatchesForFlight(flightId): Promise<GolfMatchType[]>`
- [x] `getMatchById(matchId): Promise<GolfMatchType>`
- [x] `getMatchWithScores(matchId): Promise<GolfMatchWithScoresType>`
- [x] `getUpcomingMatches(seasonId, limit): Promise<GolfMatchType[]>`
- [x] `getCompletedMatches(seasonId, limit): Promise<GolfMatchType[]>`
- [x] `getMatchesForTeam(teamSeasonId): Promise<GolfMatchType[]>`
- [x] `getMatchesByDate(seasonId, date): Promise<GolfMatchType[]>`
- [x] `createMatch(seasonId, data): Promise<GolfMatchType>`
- [x] `updateMatch(matchId, data): Promise<GolfMatchType>`
- [x] `deleteMatch(matchId): Promise<void>`
- [x] `updateMatchStatus(matchId, status): Promise<GolfMatchType>`

#### `GolfScoreService.ts` ✅
- [x] `getScoreById(scoreId): Promise<GolfScoreWithDetailsType>`
- [x] `getScoresForPlayer(contactId, limit): Promise<GolfScoreType[]>`
- [x] `getScoresForMatch(matchId): Promise<GolfScoreWithDetailsType[]>`
- [x] `getScoresForTeamInMatch(matchId, teamId): Promise<GolfScoreWithDetailsType[]>`
- [x] `submitMatchScores(matchId, teamId, data): Promise<GolfScoreWithDetailsType[]>`
- [x] `deleteMatchScores(matchId): Promise<void>`
- [x] `getPlayerSeasonScores(contactId, seasonId): Promise<GolfScoreWithDetailsType[]>`

### 5.4 Factories ✅
- [x] Add `GolfMatchService` and `GolfScoreService` to `ServiceFactory`
- [x] Add `GolfMatchRepository` and `GolfScoreRepository` to `RepositoryFactory`

### 5.5 Routes ✅

#### `golf-matches.ts` ✅
- [x] `GET /api/accounts/:accountId/golf/matches/season/:seasonId` - List matches for season
- [x] `GET /api/accounts/:accountId/golf/matches/season/:seasonId/upcoming` - Upcoming matches
- [x] `GET /api/accounts/:accountId/golf/matches/season/:seasonId/completed` - Completed matches
- [x] `GET /api/accounts/:accountId/golf/matches/season/:seasonId/date/:date` - Matches by date
- [x] `GET /api/accounts/:accountId/golf/matches/flight/:flightId` - Matches for flight
- [x] `GET /api/accounts/:accountId/golf/matches/team/:teamSeasonId` - Matches for team
- [x] `GET /api/accounts/:accountId/golf/matches/:matchId` - Get match by ID
- [x] `GET /api/accounts/:accountId/golf/matches/:matchId/scores` - Get match with scores
- [x] `POST /api/accounts/:accountId/golf/matches/season/:seasonId` - Create match
- [x] `PUT /api/accounts/:accountId/golf/matches/:matchId` - Update match
- [x] `PUT /api/accounts/:accountId/golf/matches/:matchId/status` - Update match status
- [x] `DELETE /api/accounts/:accountId/golf/matches/:matchId` - Delete match

#### `golf-scores.ts` ✅
- [x] `GET /api/accounts/:accountId/golf/scores/match/:matchId` - Get match scores
- [x] `GET /api/accounts/:accountId/golf/scores/match/:matchId/team/:teamId` - Get team scores for match
- [x] `GET /api/accounts/:accountId/golf/scores/player/:contactId` - Get player scores
- [x] `GET /api/accounts/:accountId/golf/scores/player/:contactId/season/:seasonId` - Get player season scores
- [x] `GET /api/accounts/:accountId/golf/scores/:scoreId` - Get score by ID
- [x] `POST /api/accounts/:accountId/golf/scores/match/:matchId/team/:teamId` - Submit team scores for match
- [x] `DELETE /api/accounts/:accountId/golf/scores/match/:matchId` - Delete match scores

### 5.6 OpenAPI & Testing ✅
- [x] Register all schemas in `openapiTypes.ts`
- [x] Run `npm run backend:lint` - passed
- [x] Run `npm run backend:type-check` - passed

---

## Phase 6: Backend Handicap & Standings Calculations ✅

### 6.1 Service Layer ✅

#### `GolfHandicapService.ts` ✅
- [x] Implement handicap index calculation algorithm:
  - Get last 40 rounds (or 20 9-hole rounds)
  - Combine two 9-hole rounds into 18-hole equivalent
  - Calculate differential: `(Score - Rating) * 113 / Slope`
  - Use lowest N differentials based on round count
  - Average and multiply by 0.96
- [x] `calculateDifferential(score, rating, slope): number`
- [x] `calculateHandicapIndex(playerId): Promise<number>`
- [x] `getPlayerHandicap(playerId): Promise<PlayerHandicapType>`
- [x] `getLeagueHandicaps(flightId): Promise<LeagueHandicapsType>`
- [x] `calculateESCMaxScore(courseHandicap): number`
- [x] `calculateCourseHandicap(handicapIndex, slope, rating, par): CourseHandicapType`
- [x] `updatePlayerStartIndex(playerId): Promise<void>`

#### `GolfStandingsService.ts` ✅
- [x] `getFlightStandings(flightId): Promise<GolfFlightStandingsType>`
- [x] `getLeagueStandings(seasonId): Promise<GolfLeagueStandingsType>`
- [x] `calculateMatchPoints(matchId): Promise<{ team1Points, team2Points }>`

### 6.2 Routes ✅

#### `golf-handicaps.ts` ✅
- [x] `GET /api/accounts/:accountId/golf/handicaps/flight/:flightId` - League handicaps
- [x] `GET /api/accounts/:accountId/golf/handicaps/player/:contactId` - Player handicap
- [x] `GET /api/accounts/:accountId/golf/handicaps/player/:contactId/course-handicap` - Course handicap
- [x] `GET /api/accounts/:accountId/golf/handicaps/esc/:courseHandicap` - ESC max score

#### `golf-standings.ts` ✅
- [x] `GET /api/accounts/:accountId/golf/standings/flight/:flightId` - Flight standings
- [x] `GET /api/accounts/:accountId/golf/standings/season/:seasonId` - League standings
- [x] `GET /api/accounts/:accountId/golf/standings/match/:matchId/points` - Match points

### 6.3 OpenAPI & Testing ✅
- [x] Register all schemas in `openapiTypes.ts`
- [x] Run `npm run backend:lint` - passed
- [x] Run `npm run backend:type-check` - passed

---

## Phase 7: Backend Statistics & Leaders ✅

### 7.1 Service Layer ✅

#### `GolfStatsService.ts` ✅
- [x] `getLowScoreLeaders(flightId, type: 'actual' | 'net'): Promise<LeaderType[]>`
- [x] `getSkinsLeaders(flightId): Promise<SkinsLeaderType[]>`
- [x] `getScoringAverages(flightId): Promise<AverageType[]>`
- [x] `getFlightLeaders(flightId): Promise<GolfFlightLeadersType>` (combined endpoint)

### 7.2 Routes ✅

#### `golf-stats.ts` ✅
- [x] `GET /api/accounts/:accountId/golf/stats/flight/:flightId/leaders` - Flight leaders (all categories)
- [x] `GET /api/accounts/:accountId/golf/stats/flight/:flightId/low-scores` - Low score leaders
- [x] `GET /api/accounts/:accountId/golf/stats/flight/:flightId/scoring-averages` - Scoring averages
- [x] `GET /api/accounts/:accountId/golf/stats/flight/:flightId/skins` - Skins leaders

### 7.3 OpenAPI & Testing ✅
- [x] Register schemas in `openapiTypes.ts` (GolfLeader, GolfScoringAverage, GolfSkinsEntry, GolfFlightLeaders)
- [x] Run `npm run backend:lint` - passed
- [x] Run `npm run backend:type-check` - passed

---

## Phase 8: Frontend Core Components & Hooks (Partial) ✅

### 8.1 Directory Structure ✅
- [x] Create `components/golf/` directory
- [x] Create `components/golf/courses/` subdirectory
- [x] Create `components/golf/flights/` subdirectory
- [x] Create `components/golf/teams/` subdirectory
- [x] Create `components/golf/rosters/` subdirectory
- [x] Create `components/golf/schedule/` subdirectory
- [x] Create `components/golf/scores/` subdirectory
- [x] Create `components/golf/standings/` subdirectory
- [x] Create `components/golf/handicaps/` subdirectory
- [x] Create `components/golf/players/` subdirectory

### 8.2 Golf Menu Component ✅
#### `components/golf/GolfMenu.tsx` ✅
- [x] Create navigation menu for golf module
- [x] Include links: Courses, Flights, Teams, Schedule, Scores, Standings
- [x] Responsive design with hamburger menu on smaller screens
- [x] Follow MUI theme patterns (no hardcoded colors)

### 8.3 Golf Service Hooks (`hooks/`)

#### `useGolfCourses.ts` ✅
- [x] Use `useApiClient()` to create client
- [x] Include `client: apiClient` in all calls
- [x] Implement `listCourses()`
- [x] Implement `getCourse(courseId)`
- [x] Implement `createCourse(data)`
- [x] Implement `updateCourse(courseId, data)`
- [x] Implement `deleteCourse(courseId)`
- [x] Implement `addCourseToLeague(courseId)`
- [x] Implement `removeCourseFromLeague(courseId)`
- [x] Handle loading/error states per pattern

#### `useGolfTees.ts` ✅
- [x] Implement `listTees(courseId)`
- [x] Implement `getTee(courseId, teeId)`
- [x] Implement `createTee(courseId, data)`
- [x] Implement `updateTee(courseId, teeId, data)`
- [x] Implement `deleteTee(courseId, teeId)`
- [x] Implement `updatePriorities(courseId, priorities)`

#### `useGolfFlights.ts` ✅
- [x] Implement `listFlights(seasonId)`
- [x] Implement `createFlight(seasonId, data)`
- [x] Implement `updateFlight(seasonId, flightId, data)`
- [x] Implement `deleteFlight(seasonId, flightId)`

#### `useGolfTeams.ts` ✅
- [x] Implement `listTeams(seasonId)`
- [x] Implement `listTeamsForFlight(flightId)`
- [x] Implement CRUD operations
- [x] Implement flight assignment/removal

#### `useGolfRosters.ts` ✅
- [x] Implement `listRoster(teamSeasonId)`
- [x] Implement `listSubstitutesForSeason(seasonId)`
- [x] Implement `listSubstitutesForFlight(flightId)`
- [x] Implement `signPlayer`, `createAndSignPlayer`, `releasePlayer`, `deletePlayer`

#### `useGolfMatches.ts`
- [ ] Implement `getMatches(flightId)` (waiting for OpenAPI registration)
- [ ] Implement `getMatch(matchId)`
- [ ] Implement CRUD operations

#### `useGolfScores.ts`
- [ ] Implement `getMatchScores(matchId)` (waiting for OpenAPI registration)
- [ ] Implement `getPlayerScores(playerId)`
- [ ] Implement `saveScores(matchId, scores)`

#### `useGolfHandicaps.ts`
- [ ] Implement `getLeagueHandicaps(flightId)` (waiting for OpenAPI registration)
- [ ] Implement `getPlayerHandicap(playerId)`

#### `useGolfStandings.ts`
- [ ] Implement `getStandings(flightId)` (waiting for OpenAPI registration)

### 8.4 Testing ✅
- [x] Run `npm run frontend:lint` - passed
- [x] Run `npm run frontend:type-check` - passed

**Note:** Remaining hooks (teams, rosters, matches, scores, handicaps, standings) require OpenAPI path registration for the corresponding backend routes before the API client functions will be generated.

---

## Phase 9: Frontend Course Management UI ✅

### 9.1 Components ✅

#### `components/golf/courses/CourseList.tsx` ✅
- [x] Display list of courses for account
- [x] Use MUI List component with styled items
- [x] Include view/edit/delete actions
- [x] Follow theme patterns (no hardcoded colors)
- [x] Include confirmation dialog for delete

#### `components/golf/courses/CourseScorecard.tsx` ✅
- [x] Scorecard-style display layout
- [x] Show holes 1-18 with par and handicap
- [x] Display tee information with ratings/slopes
- [x] Per-hole distances per tee
- [x] Tee color styling for visual clarity

#### `components/golf/courses/CourseForm.tsx` ✅
- [x] Use React Hook Form with Zod resolver
- [x] Local Zod schema for form validation
- [x] Form fields: name, holes (9/18), par per hole, handicap per hole
- [x] Handle create and edit modes
- [x] Self-contained with `onSubmit`/`onCancel` callbacks
- [x] Address/location fields

#### `components/golf/courses/TeeForm.tsx` ✅
- [x] Tee color selector with visual preview
- [x] Men's/Women's rating and slope inputs
- [x] Per-hole distance inputs (holes 1-18)
- [x] 9-hole rating/slope inputs (optional)
- [x] Priority field for display order
- [x] Self-contained with callbacks

### 9.2 Pages ✅

#### `app/account/[accountId]/golf/courses/page.tsx` ✅
- [x] Server component with `generateMetadata`
- [x] Use `buildSeoMetadata` helper
- [x] Wrap with `<main>` and `AccountPageHeader`
- [x] Include FAB for adding new course
- [x] Permission check before rendering FAB

#### `app/account/[accountId]/golf/courses/[courseId]/page.tsx` ✅
- [x] Course detail/edit page
- [x] Display scorecard view
- [x] Edit functionality for authorized users
- [x] Tee management (add/edit/delete tees)

### 9.3 Testing ✅
- [x] Write component tests
- [x] Run lint and type-check

---

## Phase 10: Frontend Team & Roster Management UI ✅

### 10.1 Components ✅

#### `components/golf/teams/GolfTeamList.tsx` ✅
- [x] Display teams for flight/season
- [x] Show team name, flight info, player count
- [x] View/edit/delete actions
- [x] Flight assignment/removal with dropdown menu

#### `components/golf/teams/GolfTeamCard.tsx` ✅
- [x] Team info card with roster preview
- [x] Link to team detail page

#### `components/golf/teams/GolfTeamForm.tsx` ✅
- [x] Create/edit team dialog
- [x] Team name input
- [x] Follow dialog pattern with callbacks

#### `components/golf/teams/GolfRoster.tsx` ✅
- [x] Display team roster
- [x] Player list with initial differential
- [x] Actions: edit, release, delete
- [x] Separate sections for active/substitutes/inactive

#### `components/golf/teams/GolfPlayerForm.tsx` ✅
- [x] Create/edit player
- [x] Contact info (name, email), initial differential
- [x] Substitute option checkbox
- [x] Self-contained form with callbacks

#### `components/golf/teams/SubstituteList.tsx` ✅
- [x] Display available substitutes
- [x] Actions to sign to team

#### `components/golf/teams/SignPlayerDialog.tsx` ✅
- [x] Search existing contacts via Autocomplete
- [x] Sign to team with initial differential
- [x] Substitute option checkbox

### 10.2 Hooks ✅

#### `hooks/useGolfTeams.ts` ✅
- [x] Implement `listTeams(seasonId)`
- [x] Implement `listTeamsForFlight(flightId)`
- [x] Implement `getTeamById(teamSeasonId)`
- [x] Implement `getTeamWithRoster(teamSeasonId)`
- [x] Implement `createTeam(seasonId, data)`
- [x] Implement `updateTeam(teamSeasonId, data)`
- [x] Implement `deleteTeam(teamSeasonId)`
- [x] Implement `assignToFlight(teamSeasonId, flightId)`
- [x] Implement `removeFromFlight(teamSeasonId)`
- [x] Implement `listUnassignedTeams(seasonId)`

#### `hooks/useGolfRosters.ts` ✅
- [x] Implement `listRoster(teamSeasonId)`
- [x] Implement `getRosterEntry(rosterId)`
- [x] Implement `listSubstitutesForSeason(seasonId)`
- [x] Implement `listSubstitutesForFlight(flightId)`
- [x] Implement `listAvailablePlayers(seasonId)`
- [x] Implement `createAndSignPlayer(teamSeasonId, seasonId, data)`
- [x] Implement `signPlayer(teamSeasonId, seasonId, data)`
- [x] Implement `updatePlayer(rosterId, data)`
- [x] Implement `releasePlayer(rosterId, seasonId, data)`
- [x] Implement `deletePlayer(rosterId)`

### 10.3 Pages ✅

#### `app/account/[accountId]/golf/teams/page.tsx` ✅
- [x] Teams listing with FAB
- [x] Server component with metadata
- [x] Season selector dropdown
- [x] Flight filter dropdown

#### `app/account/[accountId]/golf/teams/[teamSeasonId]/page.tsx` ✅
- [x] Team detail with roster
- [x] Tabs for Roster and Substitutes
- [x] Add player (new or existing) dialogs

### 10.4 Testing ✅
- [x] Run lint - passed
- [x] Run type-check - passed

---

## Phase 11: Frontend Schedule & Results UI

### 11.1 Components

#### `components/golf/schedule/GolfSchedule.tsx`
- [x] Calendar or list view of matches
- [x] Filter by date range, status

#### `components/golf/schedule/GolfMatchCard.tsx`
- [x] Match info: teams, date, course, status
- [x] Link to results if completed

#### `components/golf/schedule/MatchForm.tsx`
- [x] Schedule new match dialog
- [x] Team selection, date, course, tee

#### `components/golf/scores/MatchResultsForm.tsx`
- [ ] Per-player score entry
- [ ] Hole-by-hole entry (1-18)
- [ ] Course/tee selection with dynamic loading
- [ ] Substitute player selection
- [ ] Absent player handling
- [ ] Auto-total calculation
- [ ] Wait for API confirmation before state update (no optimistic updates)

#### `components/golf/scores/PlayerScoreEntry.tsx`
- [ ] 18-hole score input grid
- [ ] Front 9 / Back 9 totals
- [ ] Overall total

#### `components/golf/scores/ScoreDisplay.tsx`
- [ ] View completed scores
- [ ] Scorecard format display

### 11.2 Pages

#### `app/account/[accountId]/golf/schedule/page.tsx`
- [ ] Schedule listing with FAB
- [ ] Server component with metadata

#### `app/account/[accountId]/golf/schedule/[matchId]/page.tsx`
- [ ] Match detail/preview

#### `app/account/[accountId]/golf/schedule/[matchId]/results/page.tsx`
- [ ] Enter or view match results

### 11.3 Testing
- [ ] Write component tests
- [ ] Run lint and type-check

---

## Phase 12: Frontend Dashboard & Standings UI

### 12.1 Components

#### `components/golf/GolfDashboard.tsx`
- [ ] Flight-based display
- [ ] Recent match results widget
- [ ] Standings preview widget
- [ ] Upcoming matches widget
- [ ] Season leaders widget (low scores, skins)
- [ ] Handicap summary

#### `components/golf/standings/GolfStandings.tsx`
- [ ] Full standings view
- [ ] Team rankings table

#### `components/golf/standings/StandingsTable.tsx`
- [ ] Match points column
- [ ] Stroke points column
- [ ] Total points column
- [ ] Sortable columns

### 12.2 Pages

#### `app/account/[accountId]/golf/page.tsx`
- [ ] Golf home/dashboard
- [ ] Server component with metadata

#### `app/account/[accountId]/golf/standings/page.tsx`
- [ ] Full standings page

### 12.3 Testing
- [ ] Write component tests
- [ ] Run lint and type-check

---

## Phase 13: Frontend Handicaps & Players UI

### 13.1 Components

#### `components/golf/handicaps/HandicapList.tsx`
- [ ] All players with current handicaps
- [ ] Sortable by name, handicap

#### `components/golf/handicaps/PlayerHandicap.tsx`
- [ ] Handicap calculation breakdown
- [ ] Recent scores used in calculation

#### `components/golf/players/GolfPlayerProfile.tsx`
- [ ] Player info display
- [ ] Current handicap
- [ ] Season statistics

#### `components/golf/players/PlayerScoreHistory.tsx`
- [ ] All rounds for player
- [ ] Course, date, score, differential
- [ ] Scores used in handicap highlighted

### 13.2 Pages

#### `app/account/[accountId]/golf/handicaps/page.tsx`
- [ ] League handicaps listing

#### `app/account/[accountId]/golf/players/[playerId]/page.tsx`
- [ ] Player profile with history

### 13.3 Testing
- [ ] Write component tests
- [ ] Run lint and type-check

---

## Phase 14: Frontend League Setup Admin UI

### 14.1 Components

#### `components/golf/GolfLeagueSetup.tsx`
- [ ] First tee time input
- [ ] Holes per match (9 or 18)
- [ ] Time between tee times
- [ ] League day selection
- [ ] Default course/tee selection
- [ ] Permission-gated (admin only)

### 14.2 Pages

#### `app/account/[accountId]/golf/setup/page.tsx`
- [ ] League configuration page
- [ ] Admin permission check

### 14.3 Testing
- [ ] Write component tests
- [ ] Run lint and type-check

---

## Phase 15: Integration & Testing

### 15.1 Backend Testing
- [ ] Write unit tests for all golf services
- [ ] Write integration tests for all golf routes
- [ ] Test handicap calculation accuracy against known values
- [ ] Test ESC score capping for all handicap ranges
- [ ] Test standings point calculation
- [ ] Test course par/handicap validation
- [ ] Run `npm run backend:test`

### 15.2 Frontend Testing
- [ ] Write component tests for all golf components
- [ ] Test form validation with Zod schemas
- [ ] Test hook error handling
- [ ] Run `npm run frontend:test`

### 15.3 E2E Testing
- [ ] Test complete match workflow (create → enter scores → view results)
- [ ] Test season progression
- [ ] Test multi-flight league operation
- [ ] Test handicap updates after score entry

### 15.4 Mobile Responsiveness
- [ ] Test all pages on mobile viewport
- [ ] Verify touch-friendly score entry
- [ ] Test responsive tables/grids

### 15.5 Final Validation
- [ ] Run `npm run backend:lint`
- [ ] Run `npm run frontend:lint`
- [ ] Run `npm run backend:type-check`
- [ ] Run `npm run frontend:type-check`
- [ ] Run `npm run build`

---

## Phase 16: Polish, Permissions & Documentation

### 16.1 Loading & Error States
- [ ] Add loading spinners to all data-fetching components
- [ ] Add error boundaries where appropriate
- [ ] Use consistent `loading`/`error`/`success` state pattern

### 16.2 User Feedback
- [ ] Add success toasts for create/update/delete operations
- [ ] Add error alerts with clear messages
- [ ] Add confirmation dialogs for destructive actions

### 16.3 Permission Checks
- [ ] Define golf-specific permissions:
  - `golf.courses.manage`
  - `golf.teams.manage`
  - `golf.rosters.manage`
  - `golf.schedule.manage`
  - `golf.scores.enter`
  - `golf.setup.manage`
- [ ] Add permissions to `ROLE_PERMISSIONS` in backend
- [ ] Bump `version` in `GET /api/roles/roles/metadata`
- [ ] Update `ROLE_METADATA_CLIENT_VERSION` in `RoleContext.tsx`
- [ ] Implement permission checks in all routes
- [ ] Implement permission checks in all frontend components

### 16.4 Navigation Integration
- [ ] Add golf module to main navigation
- [ ] Add golf menu for golf account types (AccountTypeId = 3)
- [ ] Ensure proper routing from main app

### 16.5 Sync API
- [ ] Final `npm run sync:api` run
- [ ] Verify frontend SDK is updated


### 16.6 Final Testing
- [ ] Complete regression testing
- [ ] Performance testing with sample data
- [ ] Run all linting and type checks

---

## Architecture Compliance Checklist

### Backend (per CLAUDE.md)
- [ ] All routes use `asyncHandler` wrapper
- [ ] All routes apply `authenticateToken` middleware
- [ ] All routes apply `routeProtection.enforceAccountBoundary()`
- [ ] All routes apply `routeProtection.requirePermission()`
- [ ] All services accessed via `ServiceFactory.getXxxService()`
- [ ] All repositories accessed via `RepositoryFactory.getXxxRepository()`
- [ ] All DB types converted via response formatters
- [ ] No direct Prisma calls in routes or services
- [ ] No Zod schemas defined in routes/services (use shared-schemas)
- [ ] All endpoints registered in OpenAPI

### Frontend (per CLAUDE.md)
- [ ] All API calls use `useApiClient()` with `client: apiClient`
- [ ] All types from `@draco/shared-schemas`
- [ ] All dialogs are self-contained with callbacks
- [ ] No optimistic updates anywhere
- [ ] All pages have `generateMetadata` with `buildSeoMetadata`
- [ ] All management pages have FAB
- [ ] All pages wrapped with `<main>` and `AccountPageHeader`
- [ ] All forms use React Hook Form with Zod resolver
- [ ] All styling uses theme (no hardcoded colors)
- [ ] Permission checks via `useRole().hasPermission()`

### Shared (per CLAUDE.md)
- [ ] All schema changes approved before editing `shared-schemas`
- [ ] All schemas have OpenAPI metadata
- [ ] Run `npm run sync:api` after schema changes
- [ ] Run `npm run build` to verify bundles

---

## Summary Statistics

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | ~30 | Database & Schema Foundation |
| 2 | ~25 | Course Management Backend |
| 3 | ~20 | League & Flight Backend |
| 4 | ~25 | Team & Roster Backend |
| 5 | ~25 | Match & Score Backend |
| 6 | ~15 | Handicap & Standings Backend |
| 7 | ~10 | Statistics Backend |
| 8 | ~25 | Frontend Core |
| 9 | ~15 | Course Management Frontend |
| 10 | ~20 | Team & Roster Frontend |
| 11 | ~20 | Schedule & Results Frontend |
| 12 | ~15 | Dashboard & Standings Frontend |
| 13 | ~15 | Handicaps & Players Frontend |
| 14 | ~8 | League Setup Frontend |
| 15 | ~15 | Integration Testing |
| 16 | ~20 | Polish & Permissions |

**Total: ~300+ individual tasks**
