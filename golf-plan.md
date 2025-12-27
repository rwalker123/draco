# Golf Module Migration Plan

## Executive Summary

This document outlines the migration plan for golf-related functionality from the ASP.NET application (`../draco.aspnet`) to the new Node.js/React/Next.js application (`draco-nodejs`). The golf module enables management of golf leagues, courses, matches, rosters, scores, handicaps, and standings.

---

## Part 1: ASP.NET Golf Implementation Analysis

### 1.1 Backend Implementation

#### Controllers (Areas/Golf/Controllers/)

| Controller | Responsibility |
|------------|----------------|
| `GolfController.cs` | Entry point, renders golf home view |
| `LeagueController.cs` | Golf league management, account creation, league setup |
| `CoursesController.cs` | Golf course CRUD (name, holes, men's/women's par & handicaps) |
| `CourseTeeController.cs` | Tee management (color, ratings, slopes, hole distances) |
| `FlightsController.cs` | Flight/division management within seasons |
| `TeamsController.cs` | Team CRUD for golf leagues |
| `RostersController.cs` | Player roster management, substitutes handling |
| `PlayerController.cs` | Player profile, handicap display, score history |
| `ScheduleController.cs` | Match scheduling, results entry, standings calculation |
| `LeagueHandicapsController.cs` | League-wide handicap display |
| `IndividualController.cs` | Individual golfer mode (placeholder) |

#### Data Access Layer (Areas/Golf/Models/DataAccess/)

| Class | Purpose |
|-------|---------|
| `GolfCourses.cs` | Course queries, league courses, tee information |
| `GolfLeagues.cs` | League setup, default tees |
| `GolfMatches.cs` | Match CRUD, match results, completed/pending matches |
| `GolfRosters.cs` | Roster management, player signing, subs handling |
| `GolfScores.cs` | Score CRUD, handicap index calculation, ESC scoring |
| `GolferStats.cs` | Golfer statistics tracking |
| `Golfer.cs` | Individual golfer data |
| `TeeInformation.cs` | Tee data retrieval |

#### Model Objects (Areas/Golf/Models/ModelObjects/)

- `GolfCourse.cs` - Course definition with holes, par, handicaps
- `GolfCoursePar.cs` - Per-hole par information
- `GolfCourseForContact.cs` - Course-contact associations
- `GolfLeagueCourse.cs` - League-course associations with default tees
- `GolfLeagueSetup.cs` - League configuration (tee times, holes per match)
- `GolfMatch.cs` - Match definition with teams, course, status
- `GolfMatchScore.cs` - Links matches to scores
- `GolfRoster.cs` - Player on team/sub list
- `GolfScore.cs` - Individual round scores (18 holes + metadata)
- `GolfStatDef.cs` - Statistic definitions
- `GolferStatsConfiguration.cs` - Player stat configuration
- `GolferStatsValue.cs` - Stat values per score
- `GolfTeeInformation.cs` - Tee details (color, ratings, slopes)
- `GolfTeeHoleDistance.cs` - Per-hole distances for tee
- `GolfTeeSlopeRating.cs` - Slope/rating for tee (men's/women's)

#### View Models (Areas/Golf/Models/ViewModels/Controllers/)

- `GolfCoursesViewModel.cs` / `GolfCourseViewModel.cs` - Course display/edit
- `GolfTeeViewModel.cs` - Tee display/edit
- `FlightsViewModel.cs` / `FlightViewModel.cs` - Flight management
- `TeamViewModel.cs` - Team display
- `PlayerViewModel.cs` - Player info with handicap
- `PlayerHandicapViewModel.cs` - Handicap display
- `GolfMatchViewModel.cs` - Match scheduling
- `MatchResultsViewModel.cs` - Match results entry
- `GolfScoreViewModel.cs` - Score entry
- `LeagueStandingsViewModel.cs` - Standings with points
- `LeagueHomeViewModel.cs` - League dashboard
- `LeagueScheduleViewModel.cs` - Complete schedule
- `LeagueHandicapViewModel.cs` - League handicaps
- `LeagueMatchResultsViewModel.cs` - Match day results
- `PreviewMatchViewModel.cs` - Upcoming match preview
- `CompletedMatchViewModel.cs` - Recently completed match
- `LeagueIndexViewModel.cs` - League listing
- `GolfLeagueSetupViewModel.cs` - League configuration
- `PlayerHoleSkinViewModel.cs` - Skins game tracking

### 1.2 API Endpoints (Routes)

The ASP.NET MVC routes follow this pattern from `GolfAreaRegistration.cs`:

```
Golf/{controller}/{action}/{accountId}/{seasonId}/{flightId}/{teamId}/{id}
Golf/{controller}/{action}/{accountId}/{seasonId}/{flightId}/{id}
Golf/{controller}/{action}/{accountId}/{seasonId}/{id}
Golf/{controller}/{action}/{accountId}/{id}
Golf/{controller}/{action}/{accountId}
Golf/{controller}/{action}
```

#### Core API Actions

| Controller | Action | HTTP | Purpose |
|------------|--------|------|---------|
| **League** | Index | GET | List golf leagues |
| | Home | GET | League dashboard (current season) |
| | CreateAccount | GET/POST | Create new golf account |
| | LeagueSetup | GET/POST | Configure league settings |
| **Courses** | Index | GET | List league courses |
| | Create | GET/POST | Add course |
| | Edit | GET/POST | Edit course |
| | Delete | GET/POST | Remove course |
| **CourseTee** | GetTees | GET (JSON) | Get tees for course |
| | Create | GET/POST | Add tee |
| | Edit | GET/POST | Edit tee |
| | Delete | GET/POST | Remove tee |
| **Flights** | Index | GET | List flights for season |
| | Create | GET/POST | Add flight |
| | Edit | GET/POST | Edit flight |
| | Delete | POST | Remove flight |
| **Teams** | Index | GET | List teams for flight |
| | GetTeamsGrid | GET (partial) | Teams grid |
| | GetTeams | GET (JSON) | Teams data |
| | ShowTeam | GET | Team details & schedule |
| | Create | GET/POST | Add team |
| | Edit | GET/POST | Edit team |
| | Delete | POST | Remove team |
| **Rosters** | Index | GET | Team roster |
| | GetRosterGrid | GET (partial) | Roster grid |
| | SubsIndex | GET | Substitutes list |
| | AvailableSubs | GET (JSON) | Available subs |
| | SignPlayer | GET/POST | Sign existing contact |
| | Create | GET/POST | Create new player |
| | Edit | GET/POST | Edit player |
| | Delete | POST | Remove player |
| | Release | POST | Release from team |
| | ReleaseAsSub | POST | Move to subs |
| **Schedule** | Index | GET | Schedule for flight |
| | GetScheduleGrid | GET (partial) | Schedule grid |
| | Create | GET/POST | Add match |
| | Edit | GET/POST | Edit match |
| | Delete | POST | Remove match |
| | MatchResults | GET/POST | Enter match scores |
| | ShowMatchResults | GET | View match scores |
| | ShowLeagueMatchResults | GET | Match day results |
| | LeagueStandings | GET | Current standings |
| | PreviewMatch | GET | Preview upcoming |
| | CompleteSchedule | GET | Full schedule |
| | MobileRecentMatch | GET | Recent match (mobile) |
| **Player** | Index | GET | Player profile & handicap |
| | PlayerAllScores | GET | All player scores |
| **LeagueHandicaps** | Index | GET | All league handicaps |

### 1.3 Frontend Implementation (Views)

#### Primary Views (Areas/Golf/Views/)

| Directory | Views | Purpose |
|-----------|-------|---------|
| **Golf/** | GolfHome | Golf module landing page |
| **League/** | Index, Home, Home.Mobile, CreateAccount, LeagueSetup | League management & dashboard |
| **Courses/** | Index, Create | Course management |
| **CourseTee/** | Create | Tee management |
| **Flights/** | Index, Create | Flight/division management |
| **Teams/** | Index, TeamsGrid, Create, ShowTeam, ShowTeam.Mobile | Team management |
| **Rosters/** | Index, RostersGrid, SubsIndex, Create, SignPlayer | Player roster management |
| **Schedule/** | Index, ScheduleGrid, Create, CompleteSchedule | Schedule management |
| | MatchResults, MatchResults.Mobile, ShowMatchResults, ShowMatchResults.Mobile | Score entry & display |
| | LeagueStandings, LeagueStandings.Mobile | Standings display |
| | ShowLeagueMatchResults, PreviewMatch, MobileRecentMatch.Mobile | Match views |
| | _PlayerScore, _PlayerScoreMobile, _PlayerScoreView, _PlayerScoreViewMobile, _PlayerMatchPreview | Score entry partials |
| **Player/** | Index, Index.Mobile, PlayerAllScores, PlayerAllScores.Mobile | Player profiles |
| **LeagueHandicaps/** | Index | Handicap listing |
| **Individual/** | Index | Individual mode |
| **Shared/** | _ShowMatches, _LeagueStandings, _LeagueStandingsMobile, _LeagueResults | Reusable partials |
| | EditorTemplates/* | Form helpers (dropdowns, selectors) |

#### Key UI Features

1. **League Dashboard** (`League/Home.cshtml`)
   - Flight-based display
   - Most recent match results
   - Standings table
   - Upcoming matches preview
   - Season leaders (low scores, skins)
   - Handicap listings

2. **Match Results Entry** (`Schedule/MatchResults.cshtml`)
   - Course selection with dynamic tee loading
   - Per-player score entry (holes 1-18)
   - Substitute player selection
   - Absent player handling
   - Auto-total calculation

3. **Course Management** (`Courses/Index.cshtml`)
   - Scorecard-style display
   - Men's/Women's par and handicaps
   - Multiple tee sets with ratings
   - Per-hole distances

4. **Standings** (`_LeagueStandings.cshtml`)
   - Team rankings
   - Match points, stroke points, total points

---

## Part 2: Feature Mapping to Node.js Architecture

### 2.1 Backend Routes Mapping

| ASP.NET Controller | Node.js Route File | Path Prefix |
|-------------------|-------------------|-------------|
| GolfController | `golf-core.ts` | `/api/golf` |
| LeagueController | `golf-leagues.ts` | `/api/golf/leagues` |
| CoursesController | `golf-courses.ts` | `/api/golf/courses` |
| CourseTeeController | `golf-tees.ts` | `/api/golf/tees` |
| FlightsController | `golf-flights.ts` | `/api/golf/flights` |
| TeamsController | `golf-teams.ts` | `/api/golf/teams` |
| RostersController | `golf-rosters.ts` | `/api/golf/rosters` |
| PlayerController | `golf-players.ts` | `/api/golf/players` |
| ScheduleController | `golf-schedule.ts` | `/api/golf/schedule` |
| LeagueHandicapsController | `golf-handicaps.ts` | `/api/golf/handicaps` |

### 2.2 Backend Services Mapping

| ASP.NET Data Access | Node.js Service |
|--------------------|-----------------|
| GolfCourses.cs | `golfCourseService.ts` |
| GolfLeagues.cs | `golfLeagueService.ts` |
| GolfMatches.cs | `golfMatchService.ts` |
| GolfRosters.cs | `golfRosterService.ts` |
| GolfScores.cs | `golfScoreService.ts` |
| GolferStats.cs | `golfStatsService.ts` |
| TeeInformation.cs | `golfTeeService.ts` |
| (Handicap calc) | `golfHandicapService.ts` |

### 2.3 Shared Schema Mapping

New files to create in `draco-nodejs/shared/shared-schemas/`:

| Schema File | Schemas |
|-------------|---------|
| `golfCourse.ts` | GolfCourseSchema, GolfCourseParSchema, GolfCourseTeeSchema, CreateCourseSchema, UpdateCourseSchema |
| `golfLeague.ts` | GolfLeagueSetupSchema, GolfLeagueSchema, CreateGolfLeagueSchema |
| `golfMatch.ts` | GolfMatchSchema, GolfMatchScoreSchema, CreateMatchSchema, MatchResultsSchema |
| `golfRoster.ts` | GolfRosterSchema, GolfPlayerSchema, CreatePlayerSchema, SignPlayerSchema |
| `golfScore.ts` | GolfScoreSchema, HoleScoreSchema, CreateScoreSchema |
| `golfStandings.ts` | GolfTeamStandingSchema, GolfLeagueStandingsSchema |
| `golfHandicap.ts` | GolfHandicapSchema, PlayerHandicapSchema |
| `golfFlight.ts` | GolfFlightSchema, CreateFlightSchema |

### 2.4 Frontend Components Mapping

New directories to create in `draco-nodejs/frontend-next/components/`:

| Directory | Components |
|-----------|------------|
| `golf/` | GolfMenu.tsx, GolfDashboard.tsx |
| `golf/courses/` | CourseList.tsx, CourseForm.tsx, CourseScorecard.tsx, TeeForm.tsx |
| `golf/flights/` | FlightList.tsx, FlightForm.tsx |
| `golf/teams/` | GolfTeamList.tsx, GolfTeamCard.tsx, GolfTeamForm.tsx |
| `golf/rosters/` | GolfRoster.tsx, GolfPlayerForm.tsx, SubstituteList.tsx, SignPlayerDialog.tsx |
| `golf/schedule/` | GolfSchedule.tsx, GolfMatchCard.tsx, MatchForm.tsx |
| `golf/scores/` | MatchResultsForm.tsx, PlayerScoreEntry.tsx, ScoreDisplay.tsx |
| `golf/standings/` | GolfStandings.tsx, StandingsTable.tsx |
| `golf/handicaps/` | HandicapList.tsx, PlayerHandicap.tsx |
| `golf/players/` | GolfPlayerProfile.tsx, PlayerScoreHistory.tsx |

### 2.5 Frontend Pages Mapping

New pages in `draco-nodejs/frontend-next/app/account/[accountId]/`:

| Route | Page Component |
|-------|---------------|
| `golf/page.tsx` | Golf home/dashboard |
| `golf/courses/page.tsx` | Course management |
| `golf/courses/[courseId]/page.tsx` | Course detail/edit |
| `golf/flights/page.tsx` | Flight management |
| `golf/flights/[flightId]/page.tsx` | Flight detail |
| `golf/teams/page.tsx` | Team listing |
| `golf/teams/[teamId]/page.tsx` | Team detail with roster |
| `golf/schedule/page.tsx` | Match schedule |
| `golf/schedule/[matchId]/page.tsx` | Match detail |
| `golf/schedule/[matchId]/results/page.tsx` | Enter/view results |
| `golf/standings/page.tsx` | League standings |
| `golf/handicaps/page.tsx` | League handicaps |
| `golf/players/[playerId]/page.tsx` | Player profile |
| `golf/setup/page.tsx` | League setup |

---

## Part 3: Migration Task List

### Phase 1: Database Verification & Schema Foundation
*Estimated effort: Small - Database exists, schema needs TypeScript types*

- [ ] **1.1** Verify all golf tables in Prisma schema match ASP.NET models
  - `golfcourse`, `golfcourseforcontact`, `golfleaguecourses`
  - `golfleaguesetup`, `golfmatch`, `golfmatchscores`
  - `golfroster`, `golfscore`, `golfstatdef`
  - `golferstatsconfiguration`, `golferstatsvalue`
  - `golfteeinformation`
- [ ] **1.2** Create Zod schemas in `shared-schemas/golfCourse.ts`
  - GolfCourseSchema with par arrays
  - GolfCourseTeeSchema with ratings
  - Request/response schemas
- [ ] **1.3** Create Zod schemas in `shared-schemas/golfLeague.ts`
  - GolfLeagueSetupSchema
  - GolfFlightSchema (uses existing LeagueSeason)
- [ ] **1.4** Create Zod schemas in `shared-schemas/golfMatch.ts`
  - GolfMatchSchema
  - GolfMatchScoreSchema
  - MatchResultsSchema
- [ ] **1.5** Create Zod schemas in `shared-schemas/golfRoster.ts`
  - GolfRosterSchema (player on team)
  - GolfPlayerSchema (extended contact)
- [ ] **1.6** Create Zod schemas in `shared-schemas/golfScore.ts`
  - GolfScoreSchema (18 holes + metadata)
  - HoleScoreSchema
- [ ] **1.7** Create Zod schemas in `shared-schemas/golfHandicap.ts`
  - PlayerHandicapSchema
  - HandicapCalculationSchema
- [ ] **1.8** Create Zod schemas in `shared-schemas/golfStandings.ts`
  - GolfTeamStandingSchema
  - LeagueStandingsSchema
- [ ] **1.9** Run `npm run sync:api` to generate API client

### Phase 2: Backend Core Services
*Golf Course Management*

- [ ] **2.1** Create `golfCourseService.ts`
  - getCourseById, getLeagueCourses
  - createCourse, updateCourse, deleteCourse
  - Course par/handicap management
- [ ] **2.2** Create `golfTeeService.ts`
  - getTeesForCourse
  - createTee, updateTee, deleteTee
  - Rating/slope management
- [ ] **2.3** Create `golf-courses.ts` route
  - GET/POST/PUT/DELETE `/api/golf/courses`
  - GET `/api/golf/courses/:courseId/tees`
- [ ] **2.4** Create `golf-tees.ts` route
  - GET/POST/PUT/DELETE `/api/golf/tees`

### Phase 3: Backend League & Flight Management
*Golf League Configuration*

- [ ] **3.1** Create `golfLeagueService.ts`
  - getLeagueSetup, updateLeagueSetup
  - Golf-specific account creation
- [ ] **3.2** Create `golfFlightService.ts`
  - getFlightsForSeason
  - createFlight, updateFlight, deleteFlight
- [ ] **3.3** Create `golf-leagues.ts` route
  - GET/PUT `/api/golf/leagues/:accountId/setup`
  - GET `/api/golf/leagues` (golf accounts list)
- [ ] **3.4** Create `golf-flights.ts` route
  - GET/POST/PUT/DELETE `/api/golf/flights`

### Phase 4: Backend Team & Roster Management
*Golf Team and Player Management*

- [ ] **4.1** Create `golfTeamService.ts`
  - getTeamsForFlight
  - createTeam, updateTeam, deleteTeam
  - Team schedule retrieval
- [ ] **4.2** Create `golfRosterService.ts`
  - getRoster, getSubstitutes
  - signPlayer, createPlayer, editPlayer
  - releasePlayer, releaseAsSub
  - Available players lookup
- [ ] **4.3** Create `golf-teams.ts` route
  - GET/POST/PUT/DELETE `/api/golf/teams`
- [ ] **4.4** Create `golf-rosters.ts` route
  - GET/POST/PUT/DELETE `/api/golf/rosters`
  - GET `/api/golf/rosters/subs`
  - POST `/api/golf/rosters/sign`

### Phase 5: Backend Match & Score Management
*Match Scheduling and Scoring*

- [ ] **5.1** Create `golfMatchService.ts`
  - getMatchesForFlight
  - getCompletedMatches, getUpcomingMatches
  - createMatch, updateMatch, deleteMatch
- [ ] **5.2** Create `golfScoreService.ts`
  - getScoresForMatch
  - getPlayerScores
  - saveMatchScores
  - Score validation (ESC rules)
- [ ] **5.3** Create `golf-schedule.ts` route
  - GET/POST/PUT/DELETE `/api/golf/schedule`
  - GET/POST `/api/golf/schedule/:matchId/results`
- [ ] **5.4** Create `golf-scores.ts` route
  - GET `/api/golf/scores/player/:playerId`

### Phase 6: Backend Handicap & Standings
*Calculations and Rankings*

- [ ] **6.1** Create `golfHandicapService.ts`
  - calculateHandicapIndex (18-hole and 9-hole)
  - calculateDifferential
  - updateStartIndexes
  - ESC score calculation
- [ ] **6.2** Create `golfStandingsService.ts`
  - calculateStandings
  - getMatchPoints, getStrokePoints
  - Tiebreaker logic
- [ ] **6.3** Create `golf-handicaps.ts` route
  - GET `/api/golf/handicaps/:flightId`
  - GET `/api/golf/handicaps/player/:playerId`
- [ ] **6.4** Create `golf-standings.ts` route
  - GET `/api/golf/standings/:flightId`

### Phase 7: Backend Statistics & Leaders
*Stats Tracking and Leaderboards*

- [ ] **7.1** Create `golfStatsService.ts`
  - Low score leaders (actual and net)
  - Skins tracking
  - Scoring averages
- [ ] **7.2** Create `golf-stats.ts` route
  - GET `/api/golf/stats/:flightId/leaders`
  - GET `/api/golf/stats/:flightId/skins`

### Phase 8: Frontend Core Components
*Shared Golf Components*

- [ ] **8.1** Create `GolfMenu.tsx` component
  - Navigation links for golf module
  - Role-based visibility
- [ ] **8.2** Create `components/golf/` directory structure
- [ ] **8.3** Create golf-specific hooks
  - useGolfCourses, useGolfTees
  - useGolfMatches, useGolfScores
  - useHandicap, useStandings
- [ ] **8.4** Add golf API methods to frontend API client

### Phase 9: Frontend Course Management
*Course CRUD Interface*

- [ ] **9.1** Create `CourseList.tsx` component
- [ ] **9.2** Create `CourseScorecard.tsx` component
  - Scorecard-style display
  - Tee information with ratings
- [ ] **9.3** Create `CourseForm.tsx` component
  - Course details
  - Par/handicap grid entry
- [ ] **9.4** Create `TeeForm.tsx` component
  - Tee color, ratings, slopes
  - Per-hole distances
- [ ] **9.5** Create course pages
  - `/golf/courses/page.tsx`
  - `/golf/courses/[courseId]/page.tsx`

### Phase 10: Frontend Team & Roster Management
*Team and Player UI*

- [ ] **10.1** Create `GolfTeamList.tsx` component
- [ ] **10.2** Create `GolfTeamCard.tsx` component
  - Team info with roster summary
- [ ] **10.3** Create `GolfRoster.tsx` component
  - Player list with actions
- [ ] **10.4** Create `GolfPlayerForm.tsx` component
  - Player details with initial handicap
- [ ] **10.5** Create `SubstituteList.tsx` component
- [ ] **10.6** Create `SignPlayerDialog.tsx` component
- [ ] **10.7** Create team pages
  - `/golf/teams/page.tsx`
  - `/golf/teams/[teamId]/page.tsx`

### Phase 11: Frontend Schedule & Results
*Match Management UI*

- [ ] **11.1** Create `GolfSchedule.tsx` component
  - Calendar/list view of matches
- [ ] **11.2** Create `GolfMatchCard.tsx` component
  - Match info with status
- [ ] **11.3** Create `MatchForm.tsx` component
  - Schedule new match
- [ ] **11.4** Create `MatchResultsForm.tsx` component
  - Score entry per player
  - Hole-by-hole entry
  - Substitute handling
  - Dynamic tee selection
- [ ] **11.5** Create `PlayerScoreEntry.tsx` component
  - 18-hole score input
  - Auto-total calculation
- [ ] **11.6** Create `ScoreDisplay.tsx` component
  - View completed scores
- [ ] **11.7** Create schedule pages
  - `/golf/schedule/page.tsx`
  - `/golf/schedule/[matchId]/page.tsx`
  - `/golf/schedule/[matchId]/results/page.tsx`

### Phase 12: Frontend Dashboard & Standings
*Main Golf Views*

- [ ] **12.1** Create `GolfDashboard.tsx` component
  - Recent results
  - Upcoming matches
  - Standings preview
  - Leaders widget
- [ ] **12.2** Create `GolfStandings.tsx` component
- [ ] **12.3** Create `StandingsTable.tsx` component
  - Match/stroke/total points
- [ ] **12.4** Create dashboard pages
  - `/golf/page.tsx`
  - `/golf/standings/page.tsx`

### Phase 13: Frontend Handicaps & Players
*Player Statistics UI*

- [ ] **13.1** Create `HandicapList.tsx` component
  - All players with handicaps
- [ ] **13.2** Create `PlayerHandicap.tsx` component
  - Handicap calculation display
- [ ] **13.3** Create `GolfPlayerProfile.tsx` component
  - Player info with handicap
- [ ] **13.4** Create `PlayerScoreHistory.tsx` component
  - All rounds for player
- [ ] **13.5** Create player pages
  - `/golf/handicaps/page.tsx`
  - `/golf/players/[playerId]/page.tsx`

### Phase 14: Frontend League Setup
*Admin Configuration*

- [ ] **14.1** Create `GolfLeagueSetup.tsx` component
  - First tee time
  - Holes per match
  - Time between tee times
  - League day
- [ ] **14.2** Create setup page
  - `/golf/setup/page.tsx`

### Phase 15: Integration & Testing

- [ ] **15.1** Write backend unit tests for golf services
- [ ] **15.2** Write backend integration tests for golf routes
- [ ] **15.3** Write frontend component tests
- [ ] **15.4** End-to-end testing with sample data
- [ ] **15.5** Mobile responsiveness testing

### Phase 16: Polish & Documentation

- [ ] **16.1** Add loading states and error handling
- [ ] **16.2** Add success/error toasts
- [ ] **16.3** Permission checks for admin actions
- [ ] **16.4** Update main navigation to include golf
- [ ] **16.5** Create migration guide for existing users

---

## Database Tables Reference

The following tables already exist in the PostgreSQL schema:

```
golfcourse              - Course definitions
golfcourseforcontact    - User-course associations
golfleaguecourses       - League-course associations
golfleaguesetup         - League configuration
golfmatch               - Match definitions
golfmatchscores         - Links matches to scores
golfroster              - Players on teams
golfscore               - Individual round scores
golfstatdef             - Statistic definitions
golferstatsconfiguration - Player stat configs
golferstatsvalue        - Stat values per score
golfteeinformation      - Tee sets per course
```

---

## Key Business Logic to Migrate

### Handicap Index Calculation
From `GolfScores.cs`:
1. Get last 40 rounds (or 20 9-hole rounds)
2. Combine two 9-hole rounds into one 18-hole equivalent
3. Calculate differential: `(Score - Rating) * 113 / Slope`
4. Use lowest N differentials based on round count (1-10 differentials)
5. Average and multiply by 0.96

### ESC (Equitable Stroke Control)
- Maximum hole score based on course handicap
- Applied before differential calculation

### Standings Points
- Match points: Based on head-to-head results
- Stroke points: Based on total strokes
- Combined for final standings

---

## Testing Strategy

### Unit Tests Required
- Handicap calculation accuracy
- ESC score capping
- Standings point calculation
- Course par/handicap validation

### Integration Tests Required
- Match creation with roster validation
- Score entry with handicap updates
- Standings recalculation on new results

### E2E Tests Required
- Complete match workflow
- Season progression
- Multi-flight league operation

---

## Migration Notes

1. **Account Type**: Golf accounts have `AccountTypeId = 3` (Golf)
2. **Flights**: Golf uses `LeagueSeason` as "flights" (divisions)
3. **Rosters**: `GolfRoster` links contacts to teams, with `IsSub` flag
4. **Scores**: 18 individual hole scores + metadata stored per round
5. **Handicap**: Calculated dynamically from recent scores
6. **Start Index**: Stored per score for ESC calculations

---

## Dependencies

### Backend
- Prisma for database access
- Zod for validation
- Express for routing

### Frontend
- React with Next.js App Router
- Material-UI for components
- React Query for data fetching

### Shared
- TypeScript schemas
- OpenAPI spec generation
