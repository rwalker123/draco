# Social Sync Status & Background Posting — Implementation Plan

## Goal
Persist and expose per-game social sync status (Discord, Twitter, etc.) and move posting into a background worker with retries/backoff. Users should be able to see whether a game result was posted, failed (with reason), is pending, or not configured.

## Work Breakdown

1) Data model & migration
- Add Prisma model `gamesocialsyncstatus`:
  - `id` (PK), `accountid` (FK), `gameid` (FK), `source` enum (`discord`, `twitter`, future: `bluesky`, …)
  - `status` enum (`pending`, `posted`, `failed`, `not_configured`)
  - `errormessage` (nullable), `attempts` int, `nextattemptat` datetime, `lastattemptat` datetime, timestamps
  - Unique `(gameid, source)`; index on `accountid`.
- Generate migration and Prisma client.

2) Status initialization on game save
- In `ScheduleService.updateGameResults`:
  - Determine enabled sources (settings/config).
  - Upsert status rows:
    - `not_configured` if source disabled/missing config.
    - `pending` with `attempts=0`, `nextattemptat=now` if configured.
- Do not block the game save on posting.

3) Background worker for social sync
- Add SocialSync worker/service:
  - Select `pending` rows with `nextattemptat <= now`.
  - Attempt posting per source.
  - On success: set `posted`, clear error, update timestamps.
  - Retryable failure (429/5xx/network): increment attempts, set `nextattemptat` via exponential backoff (with cap), keep pending or mark failed with `retryAt`.
  - Non-retryable failure: set `failed` + `errormessage`.
  - Cap retries to avoid hammering.
- Start worker on app startup (similar to social ingestion).

4) Posting adapters
- Reuse existing Discord/Twitter posting logic via helper methods callable from the worker (ensure creds/config available).

5) API surfacing
- Option A: Include `socialSync` summary in `updateGameResults` response.
- Option B: Add `GET /games/:gameId/social-sync-status` returning per-source status/error.
- Update game card/UX to show posted/pending/failed (and optional retry affordance).

6) Logging & observability
- Log per-attempt outcomes (source, gameId, accountId).
- Optional metrics for success/failure/retry counts.

7) Retry/backoff policy
- Retryable: 429, 5xx, network errors.
- Backoff: exponential with cap (e.g., 2s → 10s → 1m), max attempts (e.g., 3–5).

8) Testing
- Validate status upsert on save, worker transitions, retry behavior on mocked 429/500, success path.
- Verify migration and Prisma types regenerate cleanly.
