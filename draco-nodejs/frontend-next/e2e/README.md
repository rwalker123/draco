# E2E Tests

Playwright-based end-to-end suite. Targets a locally running dev stack (`pnpm dev` from repo root) and a local Postgres database.

## Running

From the repo root:

```bash
pnpm frontend:e2e                    # full suite
pnpm frontend:e2e:last-failed        # rerun only the last-failed tests
pnpm frontend:e2e:reap               # delete orphaned E2E-* rows older than 24h (localhost only)
pnpm frontend:e2e -- <spec> --project=chromium --workers=4   # scope to one file or project
```

`pnpm frontend:e2e` wraps `dotenv -e .env.local -e .env.e2e -- playwright test` — do **not** call `playwright test` directly, or env vars will be missing.

## Test accounts

Two accounts are used in the dev DB:

| Env var | Account | Mutable? | Purpose |
| --- | --- | --- | --- |
| `E2E_ACCOUNT_ID=1` | "Detroit MSBL" seed | **Read-only** | Smoke, public-page, hall-of-fame, social-hub, photo-gallery — tests that rely on stable seed content. |
| `E2E_TEST_ACCOUNT_ID=29` | "E2E Test Account" | Write-heavy | Worker fixtures create fresh leagues / seasons / teams / contacts here and clean them up on worker teardown. |

The admin user (`.env.e2e` `E2E_ADMIN_EMAIL`) has `AccountAdmin` on both.

## Layout

```
e2e/
├── fixtures/                # Worker-scoped test data fixtures
│   ├── base-fixtures.ts     # Shared options (accountId, seasonId, etc.) from env
│   ├── account-scoped-fixtures.ts
│   ├── team-scoped-fixtures.ts
│   ├── contact-scoped-fixtures.ts
│   └── golf-*.ts            # Golf-specific write fixtures
├── helpers/
│   ├── api.ts               # Typed ApiHelper wrapping the generated SDK
│   ├── auth.ts              # getJwtToken, BASE_URL
│   ├── cleanupLog.ts        # Log-not-throw cleanup error recorder
│   └── date.ts
├── pages/                   # Page-object classes
├── scripts/
│   └── reap-e2e-data.ts     # Safety-gated cleanup of orphan E2E rows
├── tests/                   # *.spec.ts organized by domain
│   ├── account/
│   ├── community/
│   ├── golf/
│   ├── smoke/
│   ├── sports/
│   └── fixtures-smoke.spec.ts  # Smoke-tests the three worker fixtures
├── .auth/admin.json         # Cached admin JWT (created by global-setup)
└── global-setup.ts          # Logs in once and stores auth state
```

## Worker fixtures

Use a worker fixture when your test **mutates** data and you don't want it to collide with other workers or the shared seed. Worker fixtures run once per Playwright worker, not per test.

### Pick the right fixture

| Fixture | Provides | Use when |
| --- | --- | --- |
| `accountScoped` | `accountId`, `seasonId`, `leagueId`, `leagueSeasonId`, `suffix` | You need league/season context but no team (announcements, polls, sponsors, handouts, etc.). |
| `teamScoped` | All of above + `teamId`, `teamSeasonId`, `rosterContactIds`, `rosterMemberIds` | You need a team with roster (team pages, schedule, standings, statistics). |
| `contactScoped` | `accountId`, 3 players + 1 manager contact | You need a pool of contacts but no team (user management, player classifieds, communications). |

### Usage

```ts
import { test, expect } from '../../fixtures/account-scoped-fixtures';

test('create an announcement', async ({ page, accountScoped }) => {
  await page.goto(`/account/${accountScoped.accountId}/announcements`);
  // ... mutate data scoped to accountScoped.leagueSeasonId, etc.
});
```

To use multiple fixtures in one file, merge them:

```ts
import { mergeTests } from '@playwright/test';
import { test as accountTest } from '../../fixtures/account-scoped-fixtures';
import { test as contactTest } from '../../fixtures/contact-scoped-fixtures';

const test = mergeTests(accountTest, contactTest);
```

Worker-scoped fixtures are lazy — they only instantiate when a test in the worker actually references them.

### Do not

- Do **not** mutate `E2E_ACCOUNT_ID=1` seed data. Use `E2E_TEST_ACCOUNT_ID=29` via a fixture instead.
- Do **not** introduce per-test (test-scoped) data fixtures — setup cost swamps the test. Keep `{ scope: 'worker' }`.
- Do **not** inline raw `fetch` calls inside a fixture — add the operation to `helpers/api.ts` first, then call it.
- Do **not** throw from cleanup — accumulate errors in an array via `tryCleanup` and pass to `appendCleanupLog`. Teardown must always complete.
- Do **not** rename existing fixture properties without auditing every consumer.

## Adding a new fixture

Follow the shape of `golf-substitute-fixtures.ts`:

1. Create a `create<Thing>Data(baseURL, workerIndex)` function that makes a unique `suffix = \`\${Date.now() % 10_000_000}w\${workerIndex}\`` and calls `ApiHelper` methods to build the data.
2. Create a `cleanup<Thing>Data(baseURL, data)` function that deletes in **reverse FK order** using `tryCleanup`, then calls `appendCleanupLog('<label> \${suffix}', errors)`.
3. Export a `test` via `base.extend<object, WorkerFixtures>({ <name>: [async fn, { scope: 'worker' }] })` and re-export `expect`.
4. If `ApiHelper` doesn't have a method you need, add it there rather than inlining fetches.
5. Add a smoke assertion to `tests/fixtures-smoke.spec.ts` so fixture regressions are caught fast.

## Waits and flake avoidance

- **Never use `waitForLoadState('networkidle')`.** It is unreliable — any background fetch resets the idle timer. This was audited out of the suite in the April 2026 cleanup. Use `waitForLoadState('domcontentloaded')` when the only need is "page has started rendering," or — strongly preferred — wait on an explicit element:
  ```ts
  await expect(page.getByRole('heading', { name: 'Announcements' })).toBeVisible({ timeout: 15_000 });
  ```
- When branching on which of two UI states rendered (e.g., mobile hamburger vs desktop nav), gate the branch with `locator.or(otherLocator)`:
  ```ts
  const signIn = page.getByRole('button', { name: 'Sign In' });
  const menu = page.getByRole('button', { name: 'menu' });
  await expect(signIn.or(menu)).toBeVisible({ timeout: 15_000 });
  if (await menu.isVisible()) { ... } else { ... }
  ```
- Avoid `page.waitForTimeout(...)` as a flake band-aid. If something needs extra time, wait on the real condition instead.
- Avoid `test.skip` / `test.fixme` to bypass flake. Fix or remove the test.

## Cleanup & orphan recovery

- Each worker's cleanup runs in reverse FK order via `tryCleanup`, and errors are written to `e2e/.results/cleanup-errors-*.log` — check these logs if the DB accumulates `E2E` rows over time.
- To reap stale orphans (older than 24h):
  ```bash
  pnpm frontend:e2e:reap
  ```
  The script refuses to run unless `DATABASE_URL` matches `postgresql://<user>@localhost/...` (no password, no remote host). Do **not** weaken this check.

## Global auth setup

`global-setup.ts` logs in as the admin once per Playwright run and stores state to `.auth/admin.json`. Every browser project depends on this project. If auth fails, all tests are skipped — check `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` in `.env.e2e` and that the dev stack is up on `http://localhost:4001`.
