# Season Scheduler — Specification

> **Status:** Experimental, unfinished. Currently gated to `NODE_ENV === 'development'` and `canEdit`. Not exposed in staging or production.
>
> **Purpose of this document:** Capture what exists today, define an immediate cleanup phase before any further feature work, and reserve a section for the completion roadmap that will be written after cleanup.

---

## 1. Current State

### 1.1 Goal

Automate the assignment of games in a season to fields and umpires while respecting a configurable set of constraints (season windows, blackout dates, team/umpire/field unavailability, field operating hours). The user configures constraints, runs a solver to produce a proposal, reviews the proposal, and applies the selected assignments — which writes field and umpire assignments back onto the existing `games` records.

### 1.2 User Flow (`/account/[accountId]/schedule-management`)

1. Admin opens **Schedule Management**.
2. Below the schedule filter bar, an **"Open Scheduler"** card is rendered by `SeasonSchedulerAdapter` only when running in development with edit permission.
3. Clicking it mounts `SeasonSchedulerWidget`, which loads constraint data on mount.
4. The user works through four conceptual stages, all in the same widget:
   - **Configure** — set the season scheduling window (start/end dates), select which leagues to schedule, set umpires-per-game (1–4) and optional max-games-per-umpire-per-day; save.
   - **Constrain** — open one of the five constraint dialogs to add/edit/delete entries:
     - Season exclusions (global blackout window)
     - Team exclusions (team unavailable during window)
     - Umpire exclusions (umpire unavailable during window)
     - Field exclusion dates (field closed on a date)
     - Field availability rules (when a field is open: days-of-week mask + start/end time)
   - **Generate** — *Preview Problem Spec* shows the assembled inputs without solving; *Generate Proposal* runs the solver and returns assignments + reasons for any unscheduled games.
   - **Review & Apply** — proposal renders grouped by date with per-assignment checkboxes; *Apply Selected* / *Apply All* persists the chosen assignments to `games`.

### 1.3 Frontend Architecture

| File | Lines | Role |
| --- | --- | --- |
| `app/account/[accountId]/schedule-management/ScheduleManagement.tsx` | ~520 | Mounts the adapter; passes shared schedule context (teams, fields, leagues, umpires, games) so the scheduler reuses existing data. |
| `components/scheduler/SeasonSchedulerAdapter.tsx` | 146 | Dev-only/edit gate; normalizes inbound name shapes; renders the widget once opened. |
| `components/scheduler/SeasonSchedulerWidget.tsx` | **1,911** | Monolith: window config UI, five constraint lists with dialogs, problem-spec preview, proposal review, apply controls, all state and load effects. |
| `components/scheduler/SchedulerSeasonExclusionDialog.tsx` | 123 | Create/edit a season exclusion. |
| `components/scheduler/SchedulerTeamExclusionDialog.tsx` | 148 | Create/edit a team exclusion. |
| `components/scheduler/SchedulerUmpireExclusionDialog.tsx` | 149 | Create/edit an umpire exclusion. |
| `components/scheduler/SchedulerFieldExclusionDateDialog.tsx` | 133 | Create/edit a field exclusion date. |
| `components/scheduler/SchedulerFieldAvailabilityRuleDialog.tsx` | 236 | Create/edit a field availability rule (days-of-week mask + time window). |
| `hooks/useSeasonSchedulerOperations.ts` | 519 | Thin wrapper around the OpenAPI client for every scheduler endpoint, with per-call loading/error state. |

### 1.4 Backend Architecture

**Routes**

`backend/src/routes/season-scheduler-field-availability.ts` (season-scoped, mounted under the account/season route tree):

- `GET/PUT  /season-window-config`
- `GET/POST/PUT/DELETE  /season-exclusions[/:id]`
- `GET/POST/PUT/DELETE  /season-field-availability[/:id]`
- `GET/POST/PUT/DELETE  /season-field-exclusion-dates[/:id]`
- `GET/POST/PUT/DELETE  /team-exclusions[/:id]`
- `GET/POST/PUT/DELETE  /umpire-exclusions[/:id]`
- `GET   /problem-spec-preview`
- `POST  /solve-season`
- `POST  /apply-season`

`backend/src/routes/scheduler.ts` (lower-level, accepts a fully-formed problem spec):

- `POST /solve` — direct solve from a `SchedulerProblemSpec` payload.
- `POST /apply` — direct apply from a `SchedulerApplyRequest` payload.

All routes require `account.games.manage` and enforce account boundary on the season/team/field/umpire IDs they touch.

**Services**

| Service | Purpose |
| --- | --- |
| `schedulerSeasonWindowConfigService` | CRUD for the per-(account, season) scheduling window config. |
| `schedulerSeasonExclusionsService` | CRUD for global exclusion windows. |
| `schedulerTeamSeasonExclusionsService` | CRUD for per-team exclusion windows. |
| `schedulerUmpireExclusionsService` | CRUD for per-umpire exclusion windows. |
| `schedulerFieldAvailabilityRulesService` | CRUD for per-field availability rules (DOW mask + time-of-day). |
| `schedulerFieldExclusionDatesService` | CRUD for per-field exclusion dates. |
| `schedulerProblemSpecService` | Assembles a `SchedulerProblemSpec` from window config, league selections, games, fields, umpires, and all constraint tables. Used by both `/problem-spec-preview` and `/solve-season`. |
| `schedulerEngineService` | The solver. Consumes a `SchedulerProblemSpec`, places games into field slots, assigns umpires, returns a `SchedulerSolveResult` (assignments + unscheduled-with-reasons). |
| `schedulerSeasonApplyService` | Translates a season-level apply request into the lower-level apply call. |
| `schedulerApplyService` | Persists the chosen assignments onto `games` records. |

Validation: `backend/src/utils/schedulerValidationUtils.ts`. Response shaping: `backend/src/responseFormatters/scheduler*ResponseFormatter.ts`.

**Tests**

Only three test files exist: `schedulerEngineService.test.ts`, `schedulerProblemSpecService.test.ts`, `schedulerApplyService.test.ts`. Coverage of the per-table CRUD services and of the season-level apply wrapper is missing.

### 1.5 Data Model

| Prisma table | Purpose |
| --- | --- |
| `schedulerseasonconfig` | One row per (account, season): window start/end, umpires-per-game, max-games-per-umpire-per-day. |
| `schedulerseasonleagueselections` | Which `leagueseason`s are included in scheduling. |
| `schedulerseasonexclusions` | Global blackout windows for a season. |
| `schedulerteamseasonexclusions` | Team-specific blackout windows. |
| `schedulerumpireexclusions` | Umpire-specific blackout windows. |
| `schedulerfieldavailabilityrules` | When each field is open (days-of-week bitmask, start/end time-of-day, slot increment). |
| `schedulerfieldexclusiondates` | One-off field closures by date. |

The solver output is *not* stored as a separate "proposal" entity — it is held in memory client-side until the user applies, and apply writes directly to `games`.

### 1.6 What Works Today

- CRUD on all five constraint tables, end-to-end (UI → API → DB).
- Window config save/load.
- Problem-spec preview returns a populated spec.
- Solver returns a deterministic proposal with per-game reasons for unscheduled games.
- Apply writes field and umpire assignments onto selected games.
- Engine, problem-spec, and apply services have unit tests for the happy path.

### 1.7 Known Rough Edges

The detailed list lives in §2 (cleanup); at a high level:

- The widget is a 1,911-line monolith that owns every concern.
- The five dialogs are 80–90% structural duplicates of each other.
- Days-of-week bitmask helpers are duplicated between the widget and the rule dialog.
- The operations hook repeats the same loading/error/abort pattern ~15 times.
- Backend test coverage is thin and skewed to the engine.
- First-time load of the window config can throw `NotFoundError` (the widget does not currently render a clean empty-state for that case).
- The dev-only gate is the only rollout control — there is no permission, feature flag, or environment flag suitable for staging.
- No persisted notion of a proposal — re-opening the widget loses the last solve.
- No pre-submit validation in dialogs (e.g. `start < end`); errors only surface from the backend.

---

## 2. Immediate Next Steps — Phase 0 (Cleanup)

The scheduler should not gain new features until the existing surface is decomposed and deduplicated. The goal of Phase 0 is to leave the feature **functionally identical** but structurally ready for the completion work in §3. Each step below is independently shippable.

### 2.1 Extract shared utilities

- **`utils/daysOfWeekUtils.ts`** — `DAYS`, `maskToSelectedBits`, `selectedBitsToMask`, `formatDaysOfWeekMask`. Replace the duplicate copies in `SeasonSchedulerWidget.tsx` and `SchedulerFieldAvailabilityRuleDialog.tsx`.
- **`hooks/useEntityNameMaps.ts`** — accepts fields/teams/umpires/games, returns memoization-stable lookup maps. Replace ad-hoc maps inside the widget.
- **`hooks/useApiOperation.ts`** — a generic `(operation) => { execute, loading, error, clearError }` factory. Refactor `useSeasonSchedulerOperations.ts` to use it; target reduction from 519 lines to ~100.

### 2.2 Decompose `SeasonSchedulerWidget`

Split into orchestrator + sub-components, each in its own file under `components/scheduler/`:

- `SeasonSchedulerConfigPanel` — window dates, league selection, umpires-per-game, max-games-per-umpire-per-day, save action.
- `SeasonSchedulerConstraintLists` — the five lists with their add/edit/delete affordances; renders the dialogs.
- `SeasonSchedulerProposalReview` — group-by-date rendering, selection state, apply controls, unscheduled-reasons summary.
- `SeasonSchedulerWidget` — slim orchestrator that owns shared state, the load effects, and the toolbar (Generate / Preview Spec / Apply).

Target: no single file in `components/scheduler/` exceeds ~400 lines.

### 2.3 Unify the constraint dialogs

Introduce `BaseSchedulerDialog` with the shared shell (title, mode handling, error display, submit/cancel, loading prop wired to button disabled + spinner). Each of the five dialogs becomes a thin wrapper that supplies only its own form fields and Zod schema. Move the shared `Props` interface into the same module.

### 2.4 Tighten dialog UX and validation

- Wire the `loading` prop through to button disabled state and inline spinner in every dialog.
- Add pre-submit validation in shared schemas: `start < end`, non-empty required notes if `enabled === false`, etc.
- Standardize error surfacing: dialog-local for validation, parent toast for API errors.
- Render a clean empty-state when `seasonWindowConfig` is missing on first load instead of letting `NotFoundError` bubble.

### 2.5 Replace the dev-only gate

Replace `process.env.NODE_ENV === 'development'` in `SeasonSchedulerAdapter` with one of:

- A new permission (e.g. `account.scheduler.use`) that is only granted in staging/test accounts initially, **or**
- A feature flag read from the role-metadata response.

Either approach must be reversible per-account so we can pilot without exposing to every admin. Do **not** ship completion work (§3) until this is in place.

### 2.6 Backend test coverage

Add Vitest coverage for:

- `schedulerSeasonApplyService` — happy path, partial-apply (some assignments rejected), all-rejected.
- `schedulerApplyService` — concurrency / re-apply idempotency, foreign-key error handling.
- `schedulerSeasonWindowConfigService` — first-time-load (no row), upsert.
- Each per-table CRUD service — at least one create + one delete test, account-boundary enforcement.
- Engine — at least one test per constraint type proving it actually constrains the solver, plus one test for an over-constrained case that returns unscheduled games with reasons.

### 2.7 Acceptance for Phase 0

- All existing flows still pass manually on a dev account.
- `pnpm frontend:lint`, `pnpm frontend:type-check`, `pnpm backend:lint`, `pnpm backend:type-check` clean.
- `pnpm backend:test` and `pnpm frontend:test` green; backend scheduler test count roughly doubled.
- No file under `components/scheduler/` exceeds ~400 lines.
- `useSeasonSchedulerOperations.ts` under ~150 lines.
- Adapter no longer references `NODE_ENV`.

---

## 3. Completion Roadmap *(to be written after Phase 0)*

Deferred until §2 is complete. Topics that need decisions before this section can be filled in:

- **Constraint coverage** — which of the following are required for real-world use, and are they hard or soft constraints? Examples: team rest days between games, home/away balance, doubleheader rules, travel distance, bye-week handling, division-vs-cross-division pairing requirements, round-robin completeness.
- **Solver semantics** — soft-constraint scoring, tie-breaking, determinism guarantees, time budget / cancellation.
- **Conflict diagnostics** — richer "why is this game unscheduled" output and a UI to act on it.
- **Proposal lifecycle** — should proposals be persisted (named, comparable, re-openable) or remain in-memory only?
- **Edit before apply** — manual override of an individual assignment in the review UI.
- **Rollback** — an "undo apply" path on `games`.
- **Cross-season scheduling** — playoffs or tournaments that span multiple `season` rows.
- **Performance ceiling** — measured limits on game / field / umpire count and a plan if those are exceeded.
- **Rollout** — staging pilot accounts, then opt-in production accounts, then general availability; what telemetry is needed to support each step.

---

## 4. Open Questions (general)

- Is "umpires-per-game" intended to be a per-league setting rather than per-season? Several leagues currently mix one-umpire and two-umpire formats.
- Should field availability rules support seasonal overrides (e.g. summer vs spring hours), or is one rule set per field sufficient?
- The schema stores exclusion windows as full DateTime ranges — should there be a recurring-pattern variant (e.g. "every Monday 6–8pm") to avoid creating dozens of rows?
- Apply currently writes to `games` directly. Do we need an audit log of who applied which proposal and when?
