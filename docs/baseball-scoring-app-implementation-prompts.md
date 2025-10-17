# Live Scoring App Implementation Prompt Pack

This companion document translates the implementation phases from `docs/baseball-scoring-app-plan.md` into a series of ready-to-send prompts. Each prompt is scoped to a manageable milestone or sub-milestone so another AI agent can execute the plan iteratively. Before running any prompt, ensure the repository is checked out on a dedicated feature branch and dependencies are installed per the workspace setup instructions.

## Milestone 1 – Foundation

### Prompt 1.1 – Bootstrap React Native Shell & Auth
```
You are an expert React Native engineer. Set up the initial React Native application for the baseball scorekeeping project.

Requirements:
- Initialize a monorepo-friendly React Native app (Expo or bare React Native as appropriate for the existing tooling).
- Configure TypeScript, ESLint, Prettier, and Jest to align with the main repository conventions.
- Implement authentication screens that integrate with the existing REST login endpoints (reuse shared auth utilities if available).
- Add navigation scaffolding (stack + tab as needed) with placeholders for Dashboard, Games, Lineups, and Settings.
- Wire up secure storage for auth tokens with 30-day retention awareness, handling login, logout, and token refresh.
- Document setup steps and any new scripts in the project README.

When finished, run lint/tests that apply to the new app and provide a summary of changes and verification steps.
```

### Prompt 1.2 – Schedule Fetch & Offline Cache Scaffolding
```
Build the foundational data layer for the React Native app.

Requirements:
- Create REST API clients for schedules, teams, and user assignments using the existing backend endpoints.
- Implement a normalized state store (e.g., Zustand, Redux Toolkit) to cache schedule data locally.
- Add offline persistence using SQLite or AsyncStorage with hydration on app launch and eviction after 30 days of inactivity.
- Display the upcoming games list on the Dashboard screen with online/offline indicators.
- Add basic error handling, retry logic, and a developer-facing network logger for debugging.
- Ensure TypeScript types align with shared schemas (generate or import as needed).
- Update documentation describing the offline caching approach.

Validate the data layer with unit tests or integration tests for the caching logic and include screenshots if relevant.
```

### Prompt 1.3 – Lineup Management CRUD & Templates
```
Implement lineup management capabilities.

Requirements:
- Build UI flows to create, edit, and delete lineup templates associated with teams/leagues.
- Support assigning lineup templates to specific games and editing player positions/order.
- Persist lineups locally while offline and sync with the backend when online, following the 30-day retention policy.
- Respect scorekeeper permission scopes (account, league, team) when determining editable entities.
- Provide optimistic updates with rollback when the server rejects changes.
- Add unit tests for lineup reducers/services and include user docs or help text for scorekeepers.

Next steps once the lineup API is available:
- Flip the `lineupSyncEnabled` mobile feature flag so refresh/sync calls re-enable.
- Point the lineup API client at the new endpoints and expand tests to cover online mutations.

Deliver code, tests, and a summary highlighting key architectural decisions.
```

## Milestone 2 – Core Scoring

### Prompt 2.1 – Scorecard UI & State Machine
```
Construct the live scorecard interface and inning/out state machine.

Requirements:
- Design a responsive scorecard grid supporting phones and tablets.
- Implement controls for pitch outcomes, runner advances, substitutions, and scoring events using Retrosheet-style inputs.
- Build a deterministic state machine that maintains inning, outs, base runners, and score while validating play legality.
- Include undo/redo stacks for play events.
- Ensure accessibility (screen reader labels, large tap targets) and theming alignment with the main brand.
- Provide component/unit tests covering state transitions and UI logic.

Share implementation notes and testing evidence upon completion.
```

### Prompt 2.2 – Retrosheet Parser & Local Event Log
```
Develop the Retrosheet parser and event logging layer.

Requirements:
- Implement a parser that converts user inputs into Retrosheet-compatible notation.
- Maintain a local event log per game with metadata (timestamp, user, device, provisional scores).
- Support editing or deleting prior events with automatic recalculation of downstream state.
- Persist logs in the offline store with schema versioning for future migrations.
- Expose derived stats (e.g., pitch counts, batting line) for quick validation during scoring.
- Add comprehensive tests for parser edge cases and recalculation behavior.

Provide documentation for the parser format and update developer docs describing the event log structure.
```

## Milestone 3 – Sync & Live Updates

### Prompt 3.1 – Mutation Queue & Background Sync
```
Implement reliable data synchronization for scoring events.

Requirements:
- Create a mutation queue that tracks pending/synced/failed mutations with exponential backoff and manual retry controls.
- Handle offline submission by enqueuing mutations and flushing when connectivity returns.
- Enforce the "first-in wins" conflict policy by checking server responses and guiding users to edit existing entries when rejected.
- Store audit metadata for each mutation (user, timestamp, device id).
- Add background sync tasks for both iOS and Android respecting power/network constraints.
- Cover the queue logic with unit tests and document failure-handling flows.
```

### Prompt 3.2 – WebSocket Broadcast & Server Integration
```
Integrate real-time updates with the backend.

Requirements:
- Establish WebSocket subscriptions for live play updates per game, reusing authentication tokens.
- Update the local store when external updates arrive (e.g., another scorekeeper or admin edits a play).
- Implement server endpoints/services to accept queued mutations, apply ordering rules, and broadcast authoritative events.
- Ensure extensibility of the sync layer so future modules (photo uploads, social reactions) can reuse the transport and retry mechanisms.
- Write integration tests (client + server) covering a full sync cycle, including conflict rejection and reconciliation.
- Update API documentation and any relevant OpenAPI specs.
```

## Milestone 4 – Post-Game & Editing

### Prompt 4.1 – Finalization Workflow & Stat Recalculation
```
Finish the post-game finalization experience.

Requirements:
- Provide a review screen summarizing all plays, calculated totals, and discrepancies versus manual tallies.
- Allow authorized users to finalize a game, triggering backend stat recalculation and lockouts for unauthorized edits.
- Implement reopening flow for admins to make corrections with audit logging.
- Surface warnings before purging local data older than 30 days.
- Add automated tests for finalization logic and stat recalculation triggers.
- Document the finalization workflow for support teams.
```

### Prompt 4.2 – Edit History & Conflict Resolution Tools
```
Enhance post-game editing and oversight.

Requirements:
- Build an edit history timeline showing who changed each play, with device and timestamp details.
- Provide admin tools to resolve conflicts, including forced overrides when necessary.
- Ensure edits propagate through the sync layer with clear user messaging.
- Integrate permission checks for account-, league-, and team-level scorekeeper roles.
- Include tests for history rendering and permission enforcement.
- Update documentation on conflict handling, referencing the "first-in wins" policy.
```

## Milestone 5 – Polish & QA

### Prompt 5.1 – Accessibility, QA, and Offline Edge Cases
```
Polish the app and harden offline behavior.

Requirements:
- Conduct an accessibility pass (VoiceOver/TalkBack, dynamic text sizing, color contrast) and implement fixes.
- Expand automated test coverage for parser, state machine, sync queue, and offline storage.
- Simulate extended offline periods to validate 30-day retention and user notifications.
- Add telemetry/analytics hooks to measure feature adoption and error rates (respecting privacy policies).
- Produce QA test plans and update release documentation.
```

### Prompt 5.2 – Embedded WebView & Adoption Readiness
```
Complete the extensibility and rollout readiness work.

Requirements:
- Embed the main baseball website within an authenticated WebView, including navigation chrome and deep link handling.
- Ensure the WebView respects offline constraints and falls back gracefully when network is unavailable.
- Integrate analytics to monitor WebView usage vs native flows.
- Prepare in-app messaging hooks for future announcements and coordinate with the web team on timing for site banners promoting the app.
- Deliver final documentation summarizing extensibility strategy, future social/photo integration points, and outstanding TODOs (photo limits, notification strategy).
- Provide release notes and deployment checklist for the launch.
```

---

Use these prompts sequentially. After each milestone, conduct a retrospective to capture lessons learned, update documentation, and adjust subsequent prompts if new constraints emerge.
