# Multi-tenant frontend URL tasks

1) Define base URL lookup helper **(done)**
   - Implemented `AccountBaseUrlResolver` in `backend/src/services/utils/accountBaseUrlResolver.ts` to fetch an account’s base URL (first `accountsurl` entry), normalize scheme/host, and fallback to env `FRONTEND_URL`/`BASE_URL`.
   - Added tests in `backend/src/services/utils/__tests__/accountBaseUrlResolver.test.ts`.

2) CORS origin handling **(done)**
   - Replaced fixed `FRONTEND_URL` in `app.ts` with dynamic origin validation using `OriginAllowList` (`backend/src/utils/originAllowList.ts`) that allows origins matching account URLs or the env fallback base URL.
   - Non-test enforcement and credentialed requests remain intact; added tests in `backend/src/utils/__tests__/originAllowList.test.ts`.

2a) Domain routing cleanup **(done)**
   - Removed backend domain redirect logic (`domainRouting`) now that Next.js middleware handles root redirects; backend APIs expect explicit accountId.

3) OAuth/redirect flows
   - `config/twitterOAuth.ts`: build result URL with account base URL.
   - `routes/discord.ts`: use `accountId` from state to pick account URL for link/install redirects.
   - Review any other redirect templates using `FRONTEND_URL`.

4) Email/link builders
   - `config/email.ts` and `services/emailService.ts` (password reset): generate links with account base URL; callers may need to supply or infer `accountId`.
   - `player-classified/PlayerClassifiedEmailService.ts`: build verification links with account base URL.

5) Social posting services
   - `twitterIntegrationService.ts`, `workoutService.ts`, `blueskyIntegrationService.ts`: use account base URL for announcement/workout links so shared links point to tenant domains.

6) Docs/tests cleanup
   - Update `API_KEY_SECURITY_OPTIONS.md` and tests that set/expect `FRONTEND_URL` (CORS, email, redirect, social) to reflect per-account URL behavior.

7) schedulemanagement has all the dialogs contained in the page, they need to be broken out
