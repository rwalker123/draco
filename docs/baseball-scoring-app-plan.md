# Live Scoring App Design Overview

## Goals
- Enable scorekeepers to capture full play-by-play game data in Retrosheet-style notation from phones and tablets.
- Sync captured data to the central baseball site in near real time while supporting offline entry and conflict resolution.
- Provide lineup management, schedule awareness, and post-game editing to streamline stat generation.

## Target Users & Use Cases
- **Official scorekeepers**: score games live, adjust plays, submit final box score.
- **Team managers**: preconfigure lineups, view upcoming games, review completed scorecards.
- **League administrators**: monitor game status, validate submissions, trigger stat recalculations.

## Key Capabilities
1. **Schedule Integration**
   - Fetch authenticated user's assignments and upcoming games from the league schedule.
   - Provide quick launch of scorecard from a game detail entry (includes teams, location, first pitch time).
2. **Lineup Preparation**
   - Load saved batting orders/fielding positions per team.
   - Support drag-and-drop reordering, quick substitutions, and roster search.
3. **In-Game Scoring**
   - Capture every play in Retrosheet (e.g., `1/3S/G`, `K`, `W`) with assist/error support.
   - Maintain inning/outs/baserunner state, automatically advance runners, and allow manual corrections.
   - Track pitch count, mound visits, substitutions, and scoring notes.
4. **Offline-First Operation**
   - Local persistent store (SQLite/WatermelonDB) caching schedules, rosters, and in-progress games.
   - Queue mutations while offline and replay with optimistic concurrency when back online.
5. **Live Sync & Collaboration**
   - Publish incremental play events to server via WebSocket channels layered atop the existing REST API.
   - Allow multi-device viewers (e.g., scoreboard, fans) to follow live play-by-play, with public distribution deferred to a later phase.
6. **Post-Game Workflow**
   - Mark game as `Final`, prompt for verification of key stats (pitch counts, errors).
   - Provide edit history, audit trail, and ability to reopen games for corrections.
7. **Accessibility & Usability**
   - Responsive layout for phones and tablets, large tap targets, dark mode for night games.
   - Haptic/audio confirmation of recorded plays and undo/redo support.

## Technical Architecture
### Mobile App
- **Framework**: React Native (Expo) for shared iOS/Android build, leveraging existing React expertise from web frontend.
- **State Management**: Zustand or Redux Toolkit for predictable play state, combined with React Query for server data caching.
- **Offline Storage**: SQLite via Expo SQLite or WatermelonDB; structured caches for schedules, rosters, and play events.
- **Retrosheet Parser**: Shared TypeScript library to validate/canonicalize notation before persistence.
- **Sync Layer**: Background task that flushes pending mutations to backend; handles retries with exponential backoff.

### Backend Integration
- **API Surface**:
  - Extend existing REST endpoints to pull schedules, rosters, saved lineups, and submit scoring updates.
  - Real-time WebSocket endpoints for devices to publish play events and receive authoritative state updates.
  - Server-side fan feeds remain internal-only at launch, with hooks to expose a public channel in the future if demand materializes.
- **Data Model Extensions**:
  - `games` table enriched with schedule metadata, status, and scoring lock flags.
  - `lineups` table storing user-defined batting orders with effective dates.
  - `plays` table referencing Retrosheet notation, timestamp, inning, sequence number, runners, and metadata.
  - `sync_events` table to track device mutations for conflict resolution.
- **Stat Calculation**: Backend service consumes final play stream to compute box score and per-player season stats.

### Sync & Conflict Resolution
1. **Change Tracking**
   - Each play event gets a deterministic `sequence` tied to inning/at-bat plus UUID.
   - Client maintains last synced sequence per game; server rejects conflicting sequence numbers.
2. **Offline Entry**
   - Local queue stores mutations with `pending`, `synced`, `failed` status and retains unsynced game data for 30 days before purging.
   - On reconnection, client sends batched mutations; server responds with authoritative state hash.
3. **Conflict Handling**
   - First-in submissions win: the earliest successfully synced play entry becomes authoritative, and later conflicts are reject
ed with guidance to edit the existing record if the user has adequate permissions.
   - Server maintains audit log with user/device/time for each change.

## UX Flow
1. **Dashboard**: Upcoming assignments list, status indicator (online/offline), quick link to last active game, and shortcuts to media capture/social modules when they are introduced.
2. **Game Prep**: Select game → review schedule details → assign lineup templates or create new ones.
3. **Scorecard**: Grid-based inning display with controls for pitch outcomes, runner advances, substitutions.
4. **Review & Submit**: Summary screen showing scoring highlights, computed totals vs manual tallies.
5. **Post-Game Edit**: Access completed games, view play timeline, edit entries with validation and re-sync.

## Implementation Phases
1. **Foundation (Milestone 1)**
   - Set up React Native app shell with authentication, schedule fetch, and offline caching scaffolding.
   - Implement lineup management CRUD and saved templates.
2. **Core Scoring (Milestone 2)**
   - Build scorecard UI, Retrosheet entry parser, and state machine for inning/out logic.
   - Enable local storage of play events and undo/redo.
3. **Sync & Live Updates (Milestone 3)**
   - Implement mutation queue, background sync, and WebSocket broadcasting.
   - Integrate server-side ingestion service storing plays and computing provisional box scores.
   - Introduce pluggable event bus abstractions so future modules (e.g., photo uploads, social reactions) can reuse sync/retry logic.
4. **Post-Game & Editing (Milestone 4)**
   - Finalization workflow, edit history, and stat recalculation triggers.
   - Add admin tools for resolving conflicts and viewing audit logs.
5. **Polish & QA (Milestone 5)**
   - Accessibility improvements, offline edge case testing, integration with existing website dashboards.
   - Automated tests for parser, state transitions, and sync reliability.
   - Extensibility audit ensuring new modules (media uploads, social interactions) share navigation patterns and offline strategies.
   - Harden the embedded website experience (navigation chrome, auth persistence) once the mobile shell begins surfacing the full site alongside native scoring tools.

## Permissions Model
- **Scorekeeper Roles**: Introduce a dedicated `scorekeeper` permission that can be assigned at three scopes:
  - **Account-wide**: authorized to score any game under the managing account (multi-league operations).
  - **League-level**: restricted to games belonging to a particular league.
  - **Team-level**: limited to games for a specific team.
- **Administration**: League administrators can escalate permissions and reopen games; team managers retain edit access to their own submissions until final approval.

## Extensibility Strategy
- **Modular Feature Shell**: Core navigation and state containers treat scoring as one module, enabling future additions (e.g., photo uploads, social feeds, announcements) to plug in with minimal restructuring.
- **Shared Offline & Sync Services**: Abstract storage/sync utilities (queues, file cache) so upcoming media or social features inherit 30-day retention, retry policies, and conflict resolution UI.
- **Reusable UI Primitives**: Establish component library for list/detail flows, media cards, and feed interactions to maintain a cohesive experience across scoring and social features.
- **In-App Web View Bridge**: Embed the primary website within a secure WebView shell (a mini web browser inside the app) so users can reach existing desktop features until native counterparts ship, while preserving authentication and respecting offline constraints.
- **TODO**: Coordinate with backend photo service once implemented to respect storage and size limits during upload flows.

## Web Integration & Adoption
- **Hybrid Navigation**: Provide a discoverable entry point from the native shell into the embedded website for advanced management tasks, with analytics to understand which flows still need native parity.
- **On-Site Promotion**: Plan targeted announcements about the mobile scorekeeping app inside the web experience (team-admin banner on the main landing page, account-level notice on the baseball home view) to recruit pilot users and channel support inquiries once the messaging is ready to launch.
- **Rollout Comms**: Pair in-product notices with email or social updates when permissions open beyond the pilot so scorekeepers know how to request access and install the app.

## Decisions & Follow-Ups
- **Transport Choice**: Retain REST as the primary API, augmented with WebSocket channels for low-latency play updates; GraphQL is unnecessary currently because REST already fulfills data fetching needs and WebSockets provide real-time capabilities.
- **Offline Retention**: Device caches purge unsynced or historical game data after 30 days, with user warnings before deletion to encourage timely submissions.
- **Permission Scope**: The dedicated scorekeeper role can be provisioned at account, league, or team scope, with league admins controlling assignments and overrides.
- **Fan Access**: Public real-time feeds are deferred; internal dashboards can subscribe today, and the WebSocket layer can expose limited read-only topics later without architectural changes.

## Remaining Open Questions & TODOs
- Determine whether escalation tooling is needed on top of the "first-in wins" rule when multiple scorekeepers contest the sam
e play or finalization.
- TODO: Confirm device storage thresholds for large media uploads once social/photo features roll out and align with backend en
forcement.
- TODO: Align with product on notification strategy (push, email) for upcoming assignments and post-game approvals.
- TODO: Coordinate with the web team on timing for the team-admin landing banner and baseball account home notice so those announcements launch alongside the scorekeeping app rollout.

