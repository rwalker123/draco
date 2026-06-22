# Proposal: Asynchronous Schedule Generation (background job)

**Status:** ✅ Implemented (approved). See "Implementation notes" below for the as-built deviations.
**Scope flagged as approval-gated:** introduces a new persistence table (Prisma migration) and
new **shared-schema** types (restricted per `draco-nodejs/shared/AGENTS.md`) — both approved.

## Implementation notes (as built)

- **Additive endpoints, not a replacement.** Rather than turning `POST .../scheduler/solve` into an
  enqueue, the async flow is exposed as new endpoints `POST .../scheduler/runs` (202 + `runId`) and
  `GET .../scheduler/runs/:runId`. The synchronous `/solve` endpoint is left intact for backward
  compatibility and can be removed in a follow-up once the async path is fully validated.
- **Status enum naming.** A `SchedulerRunStatus` enum already existed for the *solve outcome*
  (`completed|partial|infeasible|failed`). The job lifecycle uses a distinct
  `SchedulerRunLifecycleStatus` (`queued|running|completed|failed`) to avoid the collision.
- **Engine.** `solve()` was refactored into shared `prepareSolve`/`placeGameAt`/`finalizeSolve`
  helpers; a new `solveAsync()` reuses them, yields every N games, and reports `onProgress`.
- **Worker.** In-process (`setImmediate`), idempotent by deterministic `runId`, persists progress
  (throttled), result, or error to the `schedulerrun` table. Multi-instance caveat below still
  applies.
- **Frontend.** `SeasonSchedulerWidget` enqueues then polls `GET .../runs/:runId` every ~1s with an
  `AbortController`, shows a determinate `LinearProgress`, then loads the proposal. localStorage
  behavior unchanged.
- **DB migration** `20260621000000_add_schedulerrun` must be applied (`pnpm exec prisma migrate
  deploy`); Railway applies it automatically on deploy.

## Problem

`POST /api/accounts/:accountId/seasons/:seasonId/scheduler/solve` runs the solve **synchronously**
inside the request handler. For large inputs the solve can take long enough that the Next.js dev
proxy resets the connection (`socket hang up` / `ECONNRESET`) before the backend responds, with no
useful error surfaced to the user. The synchronous solve also blocks the Node event loop for the
duration.

The diagnostics + saturation early-out shipped alongside this proposal make the *current* failure
mode fast and observable, but they do not change the fundamental shape: a single request both does
the work and waits for it. This proposal moves generation to a background job so the request returns
immediately and the client tracks progress.

## Goals

- The Generate Schedule request returns immediately (no long-held connection, no socket hang up).
- The user sees real progress (a progress bar) and a clear terminal state (completed / failed).
- The solve no longer blocks the event loop for other requests.
- Idempotency is preserved (re-submitting the same problem reuses the existing run).

## Non-goals

- Distributed/cross-instance job processing (see "Multi-instance caveat").
- Changing the scheduling algorithm or its results.

## Proposed design

### 1. Enqueue endpoint

`POST .../scheduler/solve` becomes an **enqueue**:

1. Validate the request (as today).
2. Build a deterministic `runId` (reuse `buildDeterministicRunId` from `schedulerEngineService`).
3. Upsert a run row in `status: 'queued'` (return the existing row if the `runId`/idempotency key is
   already present — preserves current idempotency behavior).
4. Kick off background processing (see §3) and return **`202 Accepted`** with
   `{ runId, status }` immediately.

### 2. Status + result endpoints

- `GET .../scheduler/runs/:runId` → `{ runId, status, progress: { processed, total }, result?, error? }`.
  - `status`: `queued | running | completed | failed`.
  - `result` is the existing `SchedulerSolveResult` when `status === 'completed'`.
- Optionally `GET .../scheduler/runs` for a recent-runs list (not required for v1).

### 3. Background worker

- A simple in-process job runner (a module-level queue drained on `setImmediate`) runs
  `buildProblemSpecForSolve` + `solve` for each queued run.
- **Make the solve yield.** Refactor `SchedulerEngineService.solve` to optionally accept a
  `{ onProgress?(processed, total): void; yieldEveryN?: number }` option and `await` a microtask
  (`await new Promise((r) => setImmediate(r))`) every N games. This keeps the event loop responsive
  and lets the worker persist progress. The existing synchronous call path can remain for unit tests
  by defaulting to no yielding.
- On completion/failure, persist `status`, `result`/`error`, and timestamps.

### 4. Frontend

In `SeasonSchedulerWidget`:

- `handleGenerateMatchups` calls `generateMatchups` (unchanged), then the new enqueue endpoint,
  stores `runId`, and renders a progress bar driven by the status endpoint.
- **Notification:** reuse the existing SSE infrastructure (as used by alerts) to push a
  "run updated/completed" event; fall back to polling `GET .../runs/:runId` on an interval if SSE is
  unavailable. All polling uses `AbortController` per the frontend guide.
- On `completed`, load the proposal into the existing review UI; on `failed`, show the error.
- Persisted-proposal localStorage behavior is unchanged once the result is loaded.

## Data model (new table — migration required)

`schedulerrun` (illustrative):

| column        | type          | notes                                            |
| ------------- | ------------- | ------------------------------------------------ |
| `runid`       | text PK       | deterministic run id                             |
| `accountid`   | bigint        | FK → accounts (cascade)                          |
| `seasonid`    | bigint        | FK → season (cascade)                            |
| `status`      | text          | queued / running / completed / failed            |
| `processed`   | int           | progress numerator                               |
| `total`       | int           | progress denominator                             |
| `result`      | jsonb (null)  | `SchedulerSolveResult` when completed            |
| `error`       | text (null)   | message when failed                              |
| `createdat`   | timestamptz   | default now()                                    |
| `updatedat`   | timestamptz   | `@updatedAt`                                     |

Migrations are authored as raw SQL under `backend/prisma/migrations/` and applied with
`pnpm exec prisma migrate deploy` (per project convention); Railway runs migrate on deploy.

## Shared-schema additions (restricted — needs approval)

New types in `@draco/shared-schemas` (then `pnpm sync:api`):

- `SchedulerRunStatus` enum.
- `SchedulerRunProgress` `{ processed, total }`.
- `SchedulerRunState` `{ runId, status, progress, result?, error? }` — response for the enqueue and
  status endpoints.

No change to `SchedulerSolveResult` itself (it becomes the `result` payload).

## Multi-instance caveat (Railway)

An in-process queue does not survive a restart and does not span instances. Acceptable for the
current single-backend-instance deployment, but document the limitation. If horizontal scaling is
introduced later, options are:

- DB-backed claim/lease (a worker polls for `queued` rows and claims them transactionally), or
- `worker_threads` for CPU isolation within an instance, or
- an external queue (out of scope here).

The DB-backed status table above is the foundation for any of these — only the *drainer* changes.

## Rollout

1. Land the table + shared-schema types (approved separately).
2. Add enqueue/status endpoints + in-process worker with the yielding solve.
3. Switch the frontend to enqueue + progress; keep the synchronous endpoint temporarily behind the
   same route or a feature flag until the async path is verified.
4. Remove the synchronous path once the async path is confirmed in production.

## Testing

- Backend: worker transitions (queued → running → completed/failed); progress callback invoked;
  idempotent enqueue returns the existing run; yielding solve produces identical results to the
  synchronous solve for the same input.
- Frontend: enqueue → progress → completed renders the proposal; failed surfaces the error; polling
  aborts on unmount.
