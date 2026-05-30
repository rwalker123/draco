# Season Scheduler — Specification

> **Status:** Experimental, unfinished. Currently gated to the `SHOW_SEASON_SCHEDULER` feature-flag constant in `frontend-next/constants/featureFlags.ts` (default `false`) and `canEdit`. Not exposed in staging or production.
>
> **Purpose of this document:** Capture what exists today, define an immediate cleanup phase before any further feature work, and reserve a section for the completion roadmap that will be written after cleanup.

---

## 1. Current State

### 1.1 Goal

Automate the assignment of games in a season to fields and umpires while respecting a configurable set of constraints (season windows, blackout dates, team/umpire/field unavailability, field operating hours). The user configures constraints, runs a solver to produce a proposal, reviews the proposal, and applies the selected assignments — which writes field and umpire assignments back onto the existing `games` records.

### 1.2 User Flow (`/account/[accountId]/schedule-management`)

1. Admin opens **Schedule Management**.
2. Below the schedule filter bar, an **"Open Scheduler"** card is rendered by `SeasonSchedulerAdapter` only when the `SHOW_SEASON_SCHEDULER` feature flag is enabled and the user has edit permission.
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
| `components/scheduler/SeasonSchedulerAdapter.tsx` | ~115 | Feature-flag (`SHOW_SEASON_SCHEDULER`) + edit gate; normalizes inbound name shapes; renders the widget once opened. |
| `components/scheduler/SeasonSchedulerWidget.tsx` | ~460 | Slim orchestrator: owns widget-level state, load effects, toolbar (Preview Spec / Generate / Apply), and composes the config / constraints / proposal sub-panels. |
| `components/scheduler/SeasonSchedulerConfigPanel.tsx` | ~240 | Window-config form: season dates, league selection, umpires-per-game, max-games-per-umpire-per-day, save action, empty-state hint when not configured. |
| `components/scheduler/SeasonSchedulerConstraintLists.tsx` | ~345 | Renders the five constraint sections + their add/edit/delete buttons + dialog instances; delegates row layout to `ConstraintListSection`. |
| `components/scheduler/SeasonSchedulerProposalReview.tsx` | ~270 | Group-by-date proposal rendering, selection state, apply controls, unscheduled-reasons summary. |
| `components/scheduler/ConstraintListSection.tsx` | ~60 | Reusable section + row + `ListRowActions` building blocks shared by all five constraint lists. |
| `components/scheduler/ProposalAssignmentRow.tsx` | ~115 | Per-assignment row with checkbox + collapsible technical-details panel. |
| `components/scheduler/SchedulerSpecPreviewDialog.tsx` | ~60 | Modal that JSON-dumps the assembled problem spec for inspection. |
| `components/scheduler/BaseSchedulerDialog.tsx` | ~60 | Shared dialog shell (title, mode, error Alert, submit/cancel, loading wired to disabled + spinner). |
| `components/scheduler/SchedulerSeasonExclusionDialog.tsx` | ~100 | Create/edit a season exclusion (wraps `BaseSchedulerDialog`). |
| `components/scheduler/SchedulerTeamExclusionDialog.tsx` | ~130 | Create/edit a team exclusion. |
| `components/scheduler/SchedulerUmpireExclusionDialog.tsx` | ~130 | Create/edit an umpire exclusion. |
| `components/scheduler/SchedulerFieldExclusionDateDialog.tsx` | ~115 | Create/edit a field exclusion date. |
| `components/scheduler/SchedulerFieldAvailabilityRuleDialog.tsx` | ~200 | Create/edit a field availability rule (days-of-week mask + time window). |
| `hooks/useSeasonSchedulerOperations.ts` | ~160 | Single shared loading/error state; auto-binds every scheduler service method with internal `list`/`mutate` helpers. |
| `hooks/useSeasonSchedulerConstraintHandlers.ts` | ~385 | Owns the per-list constraint state plus create/edit/delete handlers shared by the constraint dialogs. |
| `hooks/useEntityNameMaps.ts` | n/a | Builds lookup maps for fields, teams, umpires, and a game-summary label from the supplied entity arrays (fresh `Map` instances per call; consumers don't rely on stable identities). |
| `hooks/useConstraintDialog.ts` | ~50 | Generic create/edit dialog state hook reused by all five constraint dialogs. |
| `utils/daysOfWeekUtils.ts` | n/a | `DAYS`, `maskToSelectedBits`, `selectedBitsToMask`, `formatDaysOfWeekMask`. |
| `utils/schedulerTimeFormat.ts` | n/a | `formatLocalHhmmTo12Hour`, `formatLocalTimeRange` (timezone-aware). |

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

Backend Vitest coverage now includes the engine, problem-spec assembly, lower-level apply, season-level apply wrapper, window-config service, and all five per-table CRUD services (`schedulerEngineService`, `schedulerProblemSpecService`, `schedulerApplyService`, `schedulerSeasonApplyService`, `schedulerSeasonWindowConfigService`, `schedulerSeasonExclusionsService`, `schedulerTeamSeasonExclusionsService`, `schedulerUmpireExclusionsService`, `schedulerFieldAvailabilityRulesService`, `schedulerFieldExclusionDatesService`). Per-constraint engine assertions and over-constrained / unscheduled-with-reason cases are still thin.

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

The Phase 0 cleanup in §2 closed most of the structural items. Outstanding:

- The rollout gate is the `SHOW_SEASON_SCHEDULER` feature-flag constant in `constants/featureFlags.ts` (currently `false`). A permission- or role-metadata-driven flag is still preferable for per-account piloting (§2.5).
- No persisted notion of a proposal — re-opening the widget loses the last solve.
- Engine test coverage is still happy-path / single-constraint; over-constrained "unscheduled with reasons" cases are thin.
- `useSeasonSchedulerConstraintHandlers` still owns a large per-list state graph (~385 lines) that could be split per-constraint when the proposal-lifecycle work lands.

---

## 2. Immediate Next Steps — Phase 0 (Cleanup)

The scheduler should not gain new features until the existing surface is decomposed and deduplicated. The goal of Phase 0 is to leave the feature **functionally identical** but structurally ready for the completion work in §3. Each step below is independently shippable.

### 2.1 Extract shared utilities

- **`utils/daysOfWeekUtils.ts`** — `DAYS`, `maskToSelectedBits`, `selectedBitsToMask`, `formatDaysOfWeekMask`. Replaces the duplicate copies that previously lived in `SeasonSchedulerWidget.tsx` and `SchedulerFieldAvailabilityRuleDialog.tsx`.
- **`utils/schedulerTimeFormat.ts`** — `formatLocalHhmmTo12Hour`, `formatLocalTimeRange` (per-zone `Intl.DateTimeFormat` cache so per-row rendering stays cheap).
- **`hooks/useEntityNameMaps.ts`** — builds lookup maps for fields, teams, umpires, and a game-summary label from the supplied entity arrays (fresh `Map` instances per call; consumers don't rely on stable identities — React Compiler handles consumer-side memoization).
- **`hooks/useSeasonSchedulerOperations.ts`** — single shared loading/error state with an in-flight counter; auto-binds every scheduler service method through internal `list`/`mutate` helpers (~160 lines, down from 519). _Note: an earlier draft introduced a generic `useApiOperation` factory, but it didn't fit the multi-method shared-state pattern and was removed._

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

## 3. Completion Roadmap

Decisions in §3/§4 were resolved with the maintainer on 2026-05-29. This roadmap reflects those answers. Phase 0 (§2) remains a prerequisite for shipping any of this to a pilot account; the §2.5 gate is the one outstanding Phase 0 item but does **not** block authoring or building the work below.

### 3.0 Architecture shift: Generator → Placer

Today the scheduler is a **placer** only: it consumes matchups that already exist as `games` rows (`schedulerProblemSpecService` sources them via `listSeasonGames`) and assigns field/time/umpire. Completion adds a **generator** in front of it.

- **Generator (new, Phase A)** — given a per-league round-robin config, produces the *set* of matchups (home/visitor pairs). It does **not** assign dates, times, fields, or umpires.
- **Placer (exists today, upgraded in Phase B)** — the current engine; takes matchups + constraints and assigns field/time/umpire.

The two stay separate components (per maintainer decision G-d). The generator's output feeds the placer. Per §2 / B.8, generated matchups are held **in memory** (not written to new DB tables) and only persisted to `games` on apply.

### Phase A — Matchup Generation (independently shippable)

Produces matchups; placement uses the existing "first valid slot" engine until Phase B.

- **A1. Per-league round-robin config.** Each league configures how many times a team plays opponents, with **separate counts for in-division vs. out-of-division (same league)** opponents — e.g. "5 games vs each in-division team, 3 vs each other-division team." Divisions are read from `divisionseason` membership.
- **A2. Volume modes.** Long-term, three ways to express volume (all requested in G-a): round-robin cycles, target games-per-team, target season length. **Ship round-robin cycles first**; the per-opponent counts in A1 are the cycle multipliers. Other modes are later options.
- **A3. Home/away.** Driven by the generated counts (G-c). Even count → split home/away evenly. Odd count → alternate and balance across the season using a running per-team home/away tally so totals stay as even as possible (supports the A.2 home/away-balance goal). The odd-count tie-break must be deterministic.
- **A4. Determinism.** Same config + same team set → same matchup set (stable/seeded ordering), consistent with the existing engine's determinism guarantees.
- **A5. Output.** An in-memory list of unplaced matchups (home, visitor, league/division context) fed directly into the placer. No new persisted entity (B.8).

### Phase B — Soft-constraint scoring (smarter placement)

Today the placer takes the **first** slot that violates no hard rule. Phase B makes it pick the **best** legal slot: each soft preference contributes a penalty, and the placer chooses the lowest total penalty among valid candidates. Hard constraints are unchanged.

Soft constraints:

- **Team rest days (A.1, soft)** — penalty when two of a team's games fall closer together than a configurable minimum gap; larger penalty the closer they are.
- **Home/away balance (A.2)** — penalty when an assignment worsens a team's home/away imbalance.
- **Division / cross-division pairing (A.5, soft)** — best-effort; penalty when the generated target counts cannot be met exactly (they often can't divide evenly).

**Default weights (D.11), fixed initially, configurable later:** rest-days = 3, home/away imbalance = 2, pairing shortfall = 1. Lower total score = better placement. Ties broken by the existing stable sort, preserving determinism.

> Note: this changes the engine from "first valid" to "best valid among candidates," a non-trivial refactor. No solve time budget / cancellation (D.12) — the greedy approach is fast; revisit only if E.14 limits are exceeded.

### Phase C — Persistence, edit, audit

- **C1. Proposal persistence (B.8).** Serialize the in-memory proposal to **localStorage as JSON**, keyed by (account, season), so re-opening the widget restores the last solve. **No backend proposal table.**
- **C2. Edit before apply (C.9).** Allow manual override of an individual assignment (field/time/umpire) in the review UI before apply. Edits update the stored proposal and are re-validated against hard constraints; a hard-constraint violation is **warned but allowed** (manual override is an intentional admin decision).
- **C3. Apply audit log (G.19).** Record who applied which assignments and when. This is the one place a small **durable DB table is justified** despite B.8 (audit must survive; localStorage won't do): account, season, applying user, timestamp, and the applied assignments / affected game count. **Requires schema approval before building.**
- **C4. No rollback (C.10).** No "undo apply" path on `games`.

### Scale (E.14)

The solver must handle realistic league sizes. Proposed ceilings to measure and add a perf test against (numbers TBD pending real data): ~50 teams, ~12 fields, ~30 umpires, a few hundred games per season. If exceeded, revisit the greedy algorithm and D.12.

### Rollout (F.15)

Keep behind the §2.5 gate → enable on a staging pilot account → opt-in production accounts → general availability. Minimal telemetry to gate steps: solve count, unscheduled rate, apply count, error rate. Low priority; revisit when §2.5 lands.

### Sequencing

Phase A → Phase B → Phase C. Phase A is shippable on its own (generate matchups, place with today's engine). Phase B upgrades placement quality. Phase C adds persistence, edit, and audit.

---

## 4. Open Questions — Resolved (2026-05-29)

| Question | Decision |
| --- | --- |
| Constraint: team rest days | **Soft** (Phase B, weight 3). |
| Constraint: home/away balance | **Required**, soft target (Phase A3 + Phase B, weight 2). |
| Constraint: doubleheaders | **Config option**, not hardcoded. |
| Constraint: division/cross-division pairing | **Soft**, best-effort (often can't divide evenly). |
| "Bye weeks" / "plays once a week" | **Not a thing** — no such concept; do not introduce it. |
| Round-robin completeness / matchup generation | **In scope** — scheduler must generate matchups (Phase A); generator is separate from the placer. |
| Round-robin counts | **Per-league**, separate in-division vs. out-of-division counts. |
| Proposal lifecycle | **localStorage JSON**, keyed by (account, season). No backend proposal schema yet. |
| Edit before apply | **Yes** — manual override, warn-but-allow on hard-constraint violations. |
| Rollback / undo apply | **No.** |
| Apply audit log | **Yes** — small durable DB table (needs schema approval). |
| Travel distance | **Not relevant.** |
| Conflict diagnostics | Current single-reason string is **sufficient for now**. |
| Solve time budget / cancellation | **Not needed now.** |
| Umpires-per-game per-league | **No change** — stays per-season. |
| Field availability seasonal overrides | **No.** |
| Recurring-pattern exclusion windows | **No.** |
| Cross-season scheduling (playoffs/tournaments) | Still deferred — no decision requested. |
