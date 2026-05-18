# Email Recipient Service Refactor Plan

## Background

`frontend-next/services/emailRecipientService.ts` is the only service in the frontend that:

- Returns a custom `AsyncResult<T>` (`{ success: true, data } | { success: false, error }`) from every public method instead of throwing.
- Wraps every API call in `executeRequest` → `withRetry` + `safeAsync` → `logError` from `utils/errorHandling.ts`.
- Treats transient network conditions as "retryable" and auto-retries up to `config.maxRetries` (default 3) times, each with exponential backoff.

Every other service in the codebase calls generated OpenAPI operations directly, lets errors throw, and relies on the caller's `useEffect` (with `AbortController`) to discard results on unmount / dep change.

## Problem the refactor addresses

This service's pipeline has three observed downsides:

1. **Intentional `AbortController` aborts are treated as errors.** When a consumer's effect aborts an in-flight request, the rejection flows into `safeAsync`, which normalizes it to `UNKNOWN_ERROR` and logs a MEDIUM SEVERITY warning. A narrow fix (detect abort in `safeAsync` / `withRetry`) already shipped to stop the log noise, but the root issue is that the wrapper considers every rejection a logged error.
2. **Retries are silent and can multiply load.** A transient 503 gets retried three times before the consumer sees it, with no UI signal in between. Consumers have no way to opt out.
3. **Consumers work around the wrapper.** `useContactFetching.ts` and `useEmailRecipients.ts` both branch on `result.success`, immediately re-throwing or mapping `result.error.message` back into a plain string for display. The `AsyncResult` shape adds ceremony without adding information the caller actually uses.

## Goals

- Bring `emailRecipientService` in line with the rest of the codebase: methods throw, callers handle errors in their `useEffect` with `AbortController`.
- Remove the custom retry layer. If retry is ever wanted, it should be opt-in at the call site, not default.
- Remove the centralized `logError` hop for this service. Error reporting is the consumer's job.
- Delete or relocate the `utils/errorHandling.ts` machinery if `emailRecipientService` was its only consumer.

## Non-goals

- Changing backend error shapes.
- Touching the email compose UI flow or business logic.
- Changing how other services handle errors.
- Changing the shared `ApiClientError` / `unwrapApiResult` helpers.

## Scope

### Files that change

| File | Change |
|---|---|
| `services/emailRecipientService.ts` | All 11 public methods switch from `AsyncResult<T>` to `Promise<T>` (throw on error). Drop `executeRequest`, `withRetry`, `safeAsync`, `logError`. Drop per-method pre-validation that currently returns an `AsyncResult` error — throw instead, or move the validation to the caller if it is actually caller input. |
| `services/__tests__/emailRecipientService.test.ts` | Rewrite. Tests currently assert the `AsyncResult` shape and the retry/log behavior. After the refactor, assert the promise resolves / rejects with `ApiClientError` (or the appropriate thrown error). Retry-specific tests are deleted. |
| `hooks/useEmailRecipients.ts` | Remove `result.success` branching. Wrap calls in `try/catch` inside effects. Thread `signal?: AbortSignal` through the service where consumers hold an `AbortController`. |
| `components/emails/recipients/hooks/useContactFetching.ts` | Same treatment as `useEmailRecipients.ts`. This is the heaviest consumer — three call sites (`fetchContacts` x2, `searchContacts`). |
| `components/emails/recipients/TeamRosterRecipientPanel.tsx` | Replace `if (result.success) { ... } else { setError(result.error.message) }` with `try/catch`; keep the existing `AbortController` pattern. |
| `components/emails/compose/GroupBadgeEditDialog.tsx` | Same as above for `fetchGroupContacts`. |

### Files to investigate for deletion

| File | Reason |
|---|---|
| `utils/errorHandling.ts` | If `emailRecipientService` is the only caller of `safeAsync`, `safe`, `withRetry`, `logError`, `normalizeError`, `createEmailRecipientError`, `handleApiError` — delete. Grep before removing. |
| `types/errors.ts` | Same — if `EmailRecipientError`, `EmailRecipientErrorCode`, `AsyncResult`, `Result`, `ErrorSeverity`, the type guards (`isEmailRecipientError`, `isNetworkError`, etc.) are only consumed inside `emailRecipientService` and `utils/errorHandling.ts`, delete. |

Grep before deleting: `AsyncResult`, `Result<`, `EmailRecipientError`, `safeAsync`, `withRetry`, `logError` across the whole `frontend-next` tree.

## Migration strategy

1. **Add `signal?: AbortSignal` parameters** to every service method that a consumer calls from inside a `useEffect`. Several already have one (`fetchTeamRosterContacts`, `fetchGroupContacts`); the rest need to be added. Thread straight through to the generated client call.
2. **Flip one method at a time, bottom-up.** Start with a leaf method with a single caller (`fetchTeamRosterContacts` → `TeamRosterRecipientPanel`). Change the method to return `Promise<T>` and throw, update the one caller's `try/catch`, re-run type-check + the relevant Vitest file. Repeat for each method.
3. **Delete `executeRequest` last.** Once no method references it, remove it plus the `config` / `configureErrorHandling` / `enableRetries` wiring on the service class.
4. **Rewrite tests as each method migrates.** Don't defer — the existing tests will fail the moment a method stops returning `AsyncResult`.
5. **Delete `utils/errorHandling.ts` and `types/errors.ts` last,** only after grep confirms no remaining consumers.

## Consumer `try/catch` template

```typescript
useEffect(() => {
  if (!accountId) return;
  const controller = new AbortController();

  const loadContacts = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchTeamRosterContacts(
        accountId,
        token,
        seasonId,
        teamSeasonId,
        { signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      setContacts(data);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to load roster contacts');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  void loadContacts();
  return () => controller.abort();
}, [accountId, seasonId, teamSeasonId, token]);
```

This matches the AbortController pattern documented in `frontend-next/AGENTS.md` and used throughout the codebase (e.g. `hooks/usePendingPhotoSubmissions.ts`, `components/team/TeamManagersWidget.tsx`).

## Risk assessment

- **Blast radius:** five files plus the 470-line test file. All within the email compose feature.
- **Regression surface:** the email compose flow, the advanced recipient dialog, the group badge edit dialog, and the hierarchical recipient tree. Covered by the service test file today and by e2e tests in `frontend-next/e2e/tests/account/communications-compose-attachments.spec.ts`.
- **Silent behavior change:** consumers currently get up to 3 retries on transient errors. After the refactor, they get one attempt. This is a deliberate behavior change — document it in the PR and confirm with stakeholders before merging.

## Effort estimate

- Service rewrite: ~half day.
- Consumer updates: ~half day (three `try/catch` sites are trivial; `useContactFetching.ts` and `useEmailRecipients.ts` are the time sinks).
- Test rewrite: ~half to one day depending on how much of the existing coverage is worth keeping vs. deleting.
- Cleanup of `utils/errorHandling.ts` and `types/errors.ts`: ~an hour once grep confirms they're unused.

Total: 1.5–2 working days. No database or backend changes.

## Open questions

- Is the retry behavior load-bearing anywhere in production? If so, the three call sites that were relying on it need explicit retry logic after the refactor.
- Should `ApiClientError` grow a `isAbort` getter so consumers can distinguish abort from real failures without string matching? (Follow-up, not required for this refactor.)
- Does any telemetry / monitoring rely on the `MEDIUM SEVERITY ERROR:` log line emitted by `logError`? If so, replace it with equivalent reporting at the consumer layer before deleting the logger.
