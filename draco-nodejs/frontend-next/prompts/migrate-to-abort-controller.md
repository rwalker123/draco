# Migrate useEffect API Calls to AbortController

## Task

Replace boolean guard patterns (`let cancelled = false`, `let ignore = false`, `let isMounted = true`) with proper `AbortController` in the specified file's `useEffect` hooks that make API calls.

## Why

Boolean flags only prevent `setState` after unmount — they do **not** cancel the in-flight HTTP request. The fetch promise continues resolving, holding closure references to component state until GC reclaims them. With rapid navigation, old closures accumulate faster than GC can collect, causing memory leaks. `AbortController` cancels the actual network request immediately on cleanup.

## Before You Start

1. Read `draco-nodejs/frontend-next/CLAUDE.md` — especially the "AbortController for Effect Cleanup" and "React Compiler (Automatic Memoization)" sections.
2. **Do not add `useCallback` or `useMemo`** — React Compiler handles memoization.
3. **Do not add code comments** unless explicitly requested.

## Pattern to Apply

Replace this:

```typescript
useEffect(() => {
  let cancelled = false; // or: let ignore = false / let isMounted = true

  const loadData = async () => {
    try {
      const result = await apiOperation({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      if (cancelled) return; // or: if (ignore) return / if (!isMounted) return
      // ... setState calls
    } catch (err) {
      if (cancelled) return;
      // ... error handling
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  void loadData();

  return () => {
    cancelled = true; // or: ignore = true / isMounted = false
  };
}, [deps]);
```

With this:

```typescript
useEffect(() => {
  const controller = new AbortController();

  const loadData = async () => {
    try {
      const result = await apiOperation({
        client: apiClient,
        path: { accountId },
        signal: controller.signal,
        throwOnError: false,
      });

      if (controller.signal.aborted) return;
      // ... setState calls
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      // ... error handling
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  void loadData();

  return () => {
    controller.abort();
  };
}, [deps]);
```

## Key Rules

1. **Pass `signal: controller.signal`** to every API call (`@draco/shared-api-client` operations, service methods, etc.)
2. **Check `controller.signal.aborted`** after every `await` before calling any `setState`
3. **Guard `finally` blocks** with `if (!controller.signal.aborted)` to prevent `setLoading(false)` after abort
4. **Thread signal through service wrappers** — if the effect calls a service method that wraps an API call, add an optional `signal?: AbortSignal` parameter to that method and pass it through to the underlying API call
5. **Multiple API calls in one effect** — pass the same `controller.signal` to all of them; check `controller.signal.aborted` after each `await`
6. **`Promise.all` calls** — pass `controller.signal` to each promise in the array; check `controller.signal.aborted` after the `Promise.all` resolves
7. **Do not change the dependency array** unless a dependency was previously excluded via a ref workaround. If `apiClient` is used inside the effect, it belongs in the dependency array (AbortController cleanup handles stale calls)
8. **Remove boolean variables** (`cancelled`, `ignore`, `isMounted`) and any refs used solely for mounted-state tracking (`isMountedRef`)

## Signal Threading for Service Methods

If the effect calls a service or hook function that wraps API calls, that function needs to accept and forward the signal:

```typescript
// In the service/hook
const fetchItems = async (query: QueryType, signal?: AbortSignal) => {
  const result = await listItems({
    client: apiClient,
    path: { accountId },
    query,
    signal,
    throwOnError: false,
  });
  return unwrapApiResult(result, 'Failed to load items');
};

// In the effect
useEffect(() => {
  const controller = new AbortController();
  fetchItems(query, controller.signal).then(/* ... */);
  return () => { controller.abort(); };
}, [fetchItems, query]);
```

## Verification

After making changes:

1. `npm run frontend:type-check` — no type errors
2. `npm run frontend:lint` — no lint warnings
3. `npm run frontend:test` — no test regressions
4. Manual: navigate to the page, navigate away quickly, check browser console for errors

## Files Needing Migration

### Hooks (boolean guard → AbortController)

| File | Guard Pattern | API Calls |
|------|--------------|-----------|
| `hooks/useAccountSettings.ts` | `let cancelled = false` | `getAccountSettings`, `getAccountSettingsPublic` |
| `hooks/useGolfLeagueSetup.ts` | `let cancelled = false` | `getGolfLeagueSetup` |
| `hooks/usePlayerCareerStatistics.ts` | `let cancelled = false` | `searchPublicContacts`, `fetchPlayerCareerStatistics` |
| `hooks/useAccountHeader.ts` | `let cancelled = false` | `apiGetAccountHeader` |
| `hooks/useAdminDashboardSummary.ts` | `let cancelled = false` | `getAdminDashboardSummary` |
| `hooks/useClassifiedsConfig.ts` | `let cancelled = false` | `getPlayerClassifiedsConfig` |
| `hooks/useContactIndividualAccount.ts` | `let cancelled = false` | `getContactIndividualGolfPlayerScores` |
| `hooks/useEmailRecipients.ts` | `let cancelled = false` | `service.getRecipientData` |
| `hooks/useFeaturedAccounts.ts` | `let ignore = false` | `getAccountById` (multiple) |
| `hooks/useTeamHandoutHeader.ts` | `let ignore = false` | `apiListAccountSeasons`, `apiGetTeamSeasonDetails`, `apiGetAccountUserTeams` |
| `hooks/useTeamMembership.ts` | `let ignore = false` | `getAccountUserTeams` |
| `hooks/useAccountMembership.ts` | `let mounted = true` | `AccountRegistrationService.fetchMyContact` |
| `hooks/useLeaderCategories.ts` | `isMountedRef` | `fetchLeaderCategories` |
| `hooks/usePlayerClassifieds.ts` | none | `playerClassifiedService.getPlayersWanted`, `getTeamsWanted` |
| `hooks/useUserManagement.ts` | none | `fetchCurrentSeasonRef.current()` |
| `hooks/useLeaguePlayerProfile.ts` | none | `getPlayerSeasonScores` |

### Components (boolean guard → AbortController)

| File | Guard Pattern | API Calls |
|------|--------------|-----------|
| `components/BaseballMenu.tsx` | `let isMounted = true` | API calls in effect |
| `components/Layout.tsx` | `let isMounted = true` | API calls in effect |
| `components/alerts/AlertsTicker.tsx` | `let isMounted = true` | API calls in effect |
| `components/golf/league-setup/GolfLeagueSetupPage.tsx` | `let isMounted = true` | API calls in effect |
| `components/hall-of-fame/HofNominationWidget.tsx` | `let isMounted = true` | API calls in effect |
| `components/hall-of-fame/HofSpotlightWidget.tsx` | `let isMounted = true` | API calls in effect |
| `components/join-league/WorkoutPreview.tsx` | `let isMounted = true` | API calls in effect |
| `components/social/SocialPostsWidget.tsx` | `let isMounted = true` | API calls in effect |
| `components/scheduler/SeasonSchedulerWidget.tsx` | `let isMounted = true` | API calls in effect |

### App Pages (boolean guard → AbortController)

| File | Guard Pattern |
|------|--------------|
| `app/account/[accountId]/BaseballAccountHome.tsx` | `let isMounted = true` |
| `app/account/[accountId]/GolfLeagueAccountHome.tsx` | `let isMounted = true` |
| `app/account/[accountId]/IndividualGolfAccountHome.tsx` | `let isMounted = true` |
| `app/account/[accountId]/hall-of-fame/HallOfFamePage.tsx` | `let isMounted = true` |
| `app/account/[accountId]/home/AccountHome.tsx` | `let isMounted = true` |
| `app/account/[accountId]/seasons/[seasonId]/golf/admin/GolfFlightsAdminPage.tsx` | `let isMounted = true` |
| `app/account/[accountId]/seasons/[seasonId]/golf/flights/GolfFlightManagement.tsx` | `let isMounted = true` |
| `app/account/[accountId]/seasons/[seasonId]/league-seasons/LeagueSeasonManagement.tsx` | `let isMounted = true` |
| `app/account/[accountId]/surveys/SurveyAccountPage.tsx` | `let isMounted = true` |
| `app/login/LoginClientWrapper.tsx` | `let isMounted = true` |
| `app/reset-password/PasswordReset.tsx` | `let isMounted = true` |

### Context Files

| File | Guard Pattern |
|------|--------------|
| `context/AccountContext.tsx` | `let cancelled = false` |
