# Migration Batch 6: Hooks Layer + Boolean Guards + Golf Components

## Context
We are removing manual `useMemo` and `useCallback` calls to let React Compiler handle memoization automatically, and migrating boolean guard patterns to `AbortController`. Read `draco-nodejs/frontend-next/CLAUDE.md` before starting — it contains all the rules.

This batch targets the remaining **hooks layer**, all remaining **boolean guard patterns** in the codebase, and the **golf component family**. After this batch, no boolean guards should remain anywhere in the codebase, and the hooks directory should be fully migrated.

## Key Rules

1. **No `useMemo` or `useCallback`** — React Compiler handles memoization at build time.
2. **No IIFEs** — When replacing `useMemo`, use simple inline expressions or extract a module-level helper function. Never use immediately-invoked function expressions.
3. **AbortController required** — Every `useEffect` making API calls must use `AbortController`. Boolean guard patterns (`let cancelled`, `let ignore`, `let isMounted`, `let active`, `let mounted`, `isMountedRef`) must be migrated to `AbortController` when the file is touched. Pass `signal` to API calls, check `controller.signal.aborted` after awaits, guard `setLoading(false)` in `finally`.
4. **Inline API calls in useEffect** — Do not use hook-returned functions (like `fetchData` from `useSomeHook()`) as useEffect dependencies. Inline the API call directly using the generated client and `useApiClient()`, with stable deps like `[accountId, apiClient]`.
5. **Thread signal through service wrappers** — When calling a service wrapper function, it **must** accept an optional `signal?: AbortSignal` parameter and pass it through to the underlying API call. If the wrapper doesn't accept `signal` yet, update it. Creating an AbortController without passing its signal to the network call only guards state updates — it does NOT cancel the HTTP request.
6. **Abort-first catch blocks** — Always check `controller.signal.aborted` as the **first line** of catch blocks, before `console.error` or any other logic. This prevents noisy error logging on normal unmount/re-render cycles.
7. **No comments** unless explicitly requested.
8. **Run lint and type-check** after all changes: `npm run frontend:lint` and `npm run frontend:type-check`.

## Files to Migrate (27 files)

### Hooks (7 files — useMemo/useCallback removal):
- `hooks/useLiveScoringOperations.ts` — useCallback (×10)
- `hooks/useIndividualLiveScoringOperations.ts` — useCallback (×9)
- `hooks/useIndividualGolfAccountService.ts` — useCallback (×11)
- `hooks/usePlayerClassifieds.ts` — useCallback/useMemo (×12)
- `hooks/useHierarchicalSelection.ts` — useMemo/useCallback (×3)
- `hooks/useHierarchicalData.ts` — useMemo (×2)
- `hooks/useHierarchicalMaps.ts` — useMemo (×2)

### Remaining Boolean Guards (6 files — AbortController migration):
- `app/account/[accountId]/AccountMembershipGate.tsx` — `let mounted = true`
- `hooks/useAccountMembership.ts` — `let mounted = true`
- `components/account-management/dialogs/CreateAccountDialog.tsx` — `let isActive = true` + useMemo/useCallback (×3)
- `components/social/FeaturedVideosWidget.tsx` — `let isActive = true`
- `components/schedule/hooks/useScheduleData.ts` — `isMountedRef` (×8 occurrences) + useMemo/useCallback (×19)
- `components/surveys/SurveySpotlightWidget.tsx` — `isMountedRef` (×7 occurrences) + useMemo/useCallback (×3)

### Golf Components (14 files — useMemo/useCallback removal):
- `components/golf/flights/DeleteFlightDialog.tsx` — useCallback (×3)
- `components/golf/flights/CreateFlightDialog.tsx` — useCallback (×4)
- `components/golf/flights/EditFlightDialog.tsx` — useCallback (×4)
- `components/golf/GolfScorecardDialog.tsx` — useMemo/useCallback (×6)
- `components/golf/courses/TeeForm.tsx` — useMemo/useCallback (×5)
- `components/golf/courses/CourseSearchDialog.tsx` — useMemo/useCallback (×6)
- `components/golf/courses/CourseDetailView.tsx` — useMemo/useCallback (×4)
- `components/golf/courses/CreateCourseDialog.tsx` — useCallback (×2)
- `components/golf/courses/CourseList.tsx` — useMemo/useCallback (×6)
- `components/golf/courses/CourseScorecard.tsx` — useMemo (×3)
- `components/golf/live-scoring/LiveScoringDialog.tsx` — useCallback (×2)
- `components/golf/live-scoring/IndividualLiveScoringDialog.tsx` — useCallback (×4)
- `components/golf/live-scoring/IndividualLiveWatchDialog.tsx` — useCallback (×2)
- `components/golf/dialogs/IndividualRoundEntryDialog.tsx` — useMemo/useCallback (×7)

## Migration Patterns

### useMemo for simple derivation → inline expression
```typescript
// Before
const combined = useMemo(() => localError ?? serviceError, [localError, serviceError]);
// After
const combined = localError ?? serviceError;
```

### useMemo for computation → inline expression or module-level helper
```typescript
// Before
const sanitized = useMemo(() => sanitizeRichContent(html), [html]);
// After
const sanitized = html ? sanitizeRichContent(html) : null;

// If try/catch is needed, extract a module-level helper:
const safeSanitize = (html: string): string => {
  try { return sanitizeRichContent(html); } catch { return ''; }
};
// Then inline:
const sanitized = html ? safeSanitize(html) : '';
```

### useMemo for object construction (e.g. return values from hooks) → plain object
```typescript
// Before
const actions: ManagerActions = useMemo(() => ({
  fetchManagers,
  searchManagers,
  reset,
}), [fetchManagers, searchManagers, reset]);
// After
const actions: ManagerActions = {
  fetchManagers,
  searchManagers,
  reset,
};
```

### useCallback for event handlers → plain function
```typescript
// Before
const handleDelete = useCallback(async () => { ... }, [deps]);
// After
const handleDelete = async () => { ... };
```

### useCallback for service methods in hooks → plain function
```typescript
// Before
const createFaq = useCallback<LeagueFaqService['createFaq']>(
  async (data) => { ... },
  [apiClient, accountId],
);
// After
const createFaq: LeagueFaqService['createFaq'] = async (data) => { ... };
```

### useCallback used as useEffect dependency → inline into useEffect
```typescript
// Before
const loadData = useCallback(async () => { ... }, [dep1, dep2]);
useEffect(() => { loadData(); }, [loadData]);

// After — inline with AbortController
useEffect(() => {
  const controller = new AbortController();
  const loadData = async () => {
    try {
      const result = await apiCall({ signal: controller.signal, ... });
      if (controller.signal.aborted) return;
      setData(result);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };
  void loadData();
  return () => { controller.abort(); };
}, [accountId, apiClient]);
```

### Boolean guard → AbortController
```typescript
// Before
useEffect(() => {
  let ignore = false;
  fetchData().then(result => { if (!ignore) setData(result); });
  return () => { ignore = true; };
}, [fetchData]);

// After
useEffect(() => {
  const controller = new AbortController();
  const loadData = async () => {
    try {
      const result = await apiCall({ signal: controller.signal, throwOnError: false });
      if (controller.signal.aborted) return;
      setData(unwrapApiResult(result, 'Failed'));
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error('Failed to load data', err);
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };
  void loadData();
  return () => { controller.abort(); };
}, [accountId, apiClient]);
```

### isMountedRef → AbortController
```typescript
// Before
const isMountedRef = useRef(true);
useEffect(() => { return () => { isMountedRef.current = false; }; }, []);
// ... later in async code:
if (isMountedRef.current) { setState(data); }

// After — use AbortController per-effect instead of a component-wide ref
useEffect(() => {
  const controller = new AbortController();
  const loadData = async () => {
    const result = await apiCall({ signal: controller.signal, ... });
    if (controller.signal.aborted) return;
    setState(result);
  };
  void loadData();
  return () => { controller.abort(); };
}, [deps]);
```

### Service wrapper signal threading
```typescript
// Before — service wrapper doesn't accept signal
async listHandouts(): Promise<HandoutType[]> {
  const result = await listAccountHandouts({
    client: this.client,
    path: { accountId },
    throwOnError: false,
  });
  return unwrapApiResult(result, 'Failed to load handouts');
}

// After — service wrapper accepts and passes signal
async listHandouts(signal?: AbortSignal): Promise<HandoutType[]> {
  const result = await listAccountHandouts({
    client: this.client,
    path: { accountId },
    signal,
    throwOnError: false,
  });
  return unwrapApiResult(result, 'Failed to load handouts');
}
```

## Special Notes

### `useScheduleData.ts`
The most complex file in this batch (19 occurrences, 8 `isMountedRef` checks). Has a component-wide `isMountedRef` pattern that guards multiple async operations. Each effect that makes API calls needs its own `AbortController`. Remove the `isMountedRef` entirely and replace with per-effect AbortControllers.

### `useLiveScoringOperations.ts` and `useIndividualLiveScoringOperations.ts`
These hooks have ~10 `useCallback` wrappers for scoring operations (submit scores, start/stop sessions, etc.). These are user-initiated actions called from click handlers — convert to plain async functions. They do NOT need AbortController since they're not in useEffect.

### `usePlayerClassifieds.ts`
Has 12 occurrences — likely a mix of `useCallback` for service methods and `useMemo` for return objects. Convert service methods to plain functions and return objects to plain object literals.

### `useIndividualGolfAccountService.ts`
Has 11 occurrences — similar pattern to `usePlayerClassifieds.ts`. Service wrapper hook with `useCallback` on each method. Convert all to plain functions.

### Hierarchical hooks (`useHierarchicalSelection`, `useHierarchicalData`, `useHierarchicalMaps`)
These three hooks work together for the email recipients tree. Low occurrence counts (2-3 each) — likely `useMemo` for derived data structures. Convert to inline expressions.

### `SurveySpotlightWidget.tsx`
Uses `isMountedRef` across multiple effects. Each effect with an API call needs its own AbortController. Remove the shared `isMountedRef` and replace with per-effect controllers.

### Golf flight dialogs (`DeleteFlightDialog`, `CreateFlightDialog`, `EditFlightDialog`)
Simple dialogs with `useCallback` for form handlers and submit actions. Convert to plain functions.

### Golf course components
Mixed `useMemo` (for derived data like filtered/sorted lists) and `useCallback` (for event handlers). Convert memos to inline expressions and callbacks to plain functions.

## Checklist
- [ ] Read `draco-nodejs/frontend-next/CLAUDE.md` before starting
- [ ] Read each file fully before editing
- [ ] Remove `useMemo`/`useCallback` import if no longer used
- [ ] Replace with inline expression or plain function (NO IIFEs)
- [ ] If file has boolean guard pattern (`let mounted`, `let isActive`, `isMountedRef`), migrate to AbortController
- [ ] If useCallback was a useEffect dependency, inline the API call into the effect
- [ ] Thread `signal` through to actual HTTP requests (update service wrappers if needed)
- [ ] Place abort check as **first line** in catch blocks (before `console.error`)
- [ ] Run `npm run frontend:lint` — zero errors
- [ ] Run `npm run frontend:type-check` — zero errors
