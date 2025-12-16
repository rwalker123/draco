# Scheduler API (Agentic Workflow)

## Solve (proposal-only)

`POST /api/accounts/:accountId/scheduler/solve`

- Auth: bearer JWT
- Permission: `account.games.manage`
- Determinism: given the same request body and constraints, the response is deterministic.
- Safe retries: send `Idempotency-Key: <string>` to derive a stable `runId` even across retries.

Request body
- `SchedulerProblemSpec` (see OpenAPI schema `SchedulerProblemSpec`)

Response body
- `SchedulerSolveResult` (see OpenAPI schema `SchedulerSolveResult`)

Notes
- This endpoint does not persist anything to the database; it returns a proposed set of assignments.

## Apply (future, persistence)

The follow-up endpoints persist proposals into `leagueschedule` (and related assignments).

### Apply all assignments

`POST /api/accounts/:accountId/scheduler/apply`

Request body (draft)
- `SchedulerApplyRequest` with `mode: 'all'` (see OpenAPI schema `SchedulerApplyRequest`)

Response body (draft)
- `SchedulerApplyResult` (see OpenAPI schema `SchedulerApplyResult`)

### Apply a subset of games

`POST /api/accounts/:accountId/scheduler/apply`

Request body (draft)
- `SchedulerApplyRequest` with `mode: 'subset'` and `gameIds` (see OpenAPI schema `SchedulerApplyRequest`)

Additional notes
- Apply should be idempotent at the game level (re-applying the same assignment should be a no-op).
- Apply should validate account boundary and permission, and reject assignments that reference unknown IDs.
