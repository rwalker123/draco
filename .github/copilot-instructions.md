# GitHub Copilot Instructions — Draco Sports Manager

These instructions apply to all Copilot interactions in this repository, including the **code review agent**. Use them to evaluate diffs against project conventions. When a PR violates a rule below, flag it as a review comment with the rule name.

The repository is a pnpm workspace containing a TypeScript Express backend (`draco-nodejs/backend`), a Next.js App Router frontend (`draco-nodejs/frontend-next`), shared Zod schemas and a generated OpenAPI client (`draco-nodejs/shared/*`), a React Native mobile app (`draco-mobile`), and Prisma migrations (`dbMigration`).

---

## 1. Absolute Prohibitions (flag any violation)

1. **Never cast via `unknown`.** Patterns like `value as unknown as SomeType` are forbidden. If an assertion is truly required, cast directly to the target type and prefer fixing the upstream typings.
2. **Never use `any`** for backend/frontend data exchange. All API contracts must use types from `@draco/shared-schemas`.
3. **Never disable ESLint** via inline pragmas (`// eslint-disable-line`, `// eslint-disable-next-line`, file-level disables). Fix the underlying issue.
4. **Never add comments** unless the surrounding code already uses comments for a non-obvious invariant. Self-documenting names and TypeScript types are preferred. Reject comments that restate what the code does or reference the PR/task.
5. **Never introduce optimistic UI updates.** Do not mutate state, transition UI, or render new values before the server confirms the change. This applies everywhere — tables, filters, form submissions, dialogs. Wait for the API response, then update.
6. **Never modify API response shapes** without evidence that all consumers (frontend components, backend services, tests, mobile app) were updated in the same PR.
7. **Never edit files under `draco-nodejs/shared/shared-schemas`** unless the PR description documents explicit maintainer approval. The same applies to generated directories: `shared-schemas/dist/**` and `shared-api-client/generated/**` are build outputs — flag manual edits.
8. **Never hardcode theme colors** in the frontend. All colors must come from `theme.palette` (including the custom `theme.palette.widget` namespace).
9. **Never commit secrets.** Flag any added `.env`, credential file, API key, token, or password in the diff.
10. **Never use `window.location.reload()`** or other full-page reloads to refresh data. Use state updates after confirmed API responses.

## 2. Permissions Versioning

When a PR adds or renames a backend permission (any new entry in `ROLE_PERMISSIONS`), **both** of these must be updated in the same PR:

- The `version` string returned from `GET /api/roles/roles/metadata` in `backend/src/routes/roles.ts`
- The `ROLE_METADATA_CLIENT_VERSION` constant in `frontend-next/context/RoleContext.tsx`

If only one side is bumped, flag it — the frontend will serve stale role metadata from cache.

## 3. Backend Architecture (`draco-nodejs/backend`)

The backend follows a strict four-layer architecture. Reject PRs that blur these boundaries.

### Layer responsibilities
- **Routes (`src/routes`)** — Untrusted boundary. Own validation, authentication, authorization, account-boundary enforcement. Must use `asyncHandler`, `extractAccountParams`/`extractContactParams`, and `routeProtection.requirePermission()`. Routes return shared schema types directly — **no wrapper objects** like `{ success: true, data: ... }`.
- **Services (`src/services`)** — Business logic. Orchestrate repositories, assume input is already validated and the caller is authorized. Never call Prisma directly.
- **Repositories (`src/repositories`)** — Prisma access only. Return native Prisma types. Define interfaces in `/interfaces`, implementations in `/implementations`.
- **Response Formatters (`src/responseFormatters`)** — Pure type conversion from Prisma types to shared schema types (BigInt → string, `firstname` → `firstName`, nullable handling). No business logic.

### Factory rules (critical)
- **Never instantiate services or repositories with `new`.** Always use `ServiceFactory.getXxxService()` and `RepositoryFactory.getXxxRepository()`.
- Services take **no constructor arguments** — dependencies come from the factories inside the service.
- If a service is missing from `ServiceFactory`, it must be added there first, not bypassed.

### Route file naming
Backend route files use **kebab-case** (e.g., `player-classifieds.ts`, `golf-flights.ts`). All other backend files use **camelCase**.

### Raw interfaces
Interfaces whose names contain "Raw" represent database shapes (lowercase field names like `firstname`). They must **never** reference non-Raw interfaces. Mixing formatted and raw interfaces is a type-safety bug.

### Season-scoped tables
Statistics and season-scoped queries must use season tables (`leagueseason`, `divisionseason`, `teamsseason`) — never the definition tables (`league`, `divisiondefs`, `teams`).

### Zod schemas
**Do not introduce new Zod schemas or shared type definitions in backend routes, services, or helpers.** All type-shape changes must go through `@draco/shared-schemas` with explicit maintainer approval. Flag any `z.object(...)` introduced in `backend/src` outside `src/openapi/`.

### OpenAPI
Every new endpoint must be registered in `backend/src/openapi/zod-to-openapi.ts`. If a PR adds an Express route without a matching OpenAPI registration, flag it — the frontend SDK will be out of sync.

### Error handling
Throw custom error types (`NotFoundError`, `ConflictError`, etc.) and let `asyncHandler` catch them. Do not return error-shaped JSON manually.

## 4. Frontend Architecture (`draco-nodejs/frontend-next`)

### React Compiler — no manual memoization
The frontend uses React Compiler (`babel-plugin-react-compiler` with `reactCompiler: true` in `next.config.ts`). **Flag any newly introduced `useMemo`, `useCallback`, or `React.memo`.** Plain inline expressions and module-level helpers are correct.

**Exception — stable reference patterns:** Do NOT flag the `useState(() => ...)` lazy-initializer + `useRef` pattern used in hooks like `useNotifications` and `useWelcomeMessageOperations`. That pattern creates identity-stable function references that React Compiler cannot replicate. Removing it causes infinite re-render loops when consumers depend on the function in `useEffect` arrays. Treat `useState(() => ...)` as distinct from `useMemo`/`useCallback`.

### API client usage
- **Always use the OpenAPI-generated methods** from `@draco/shared-api-client` (e.g., `apiGetContactRoster`, `apiCreateAccount`).
- **Never** call `apiClient.get(...)`, `apiClient.post(...)`, `apiClient.put(...)`, `apiClient.delete(...)`, or raw `fetch(...)` for backend APIs. A pre-commit hook enforces this; flag any such usage in PRs.
- Every generated operation call must include `client: apiClient` (from `useApiClient()`) in its options. Omitting `client` throws at runtime.

### AbortController for effect cleanup
Every `useEffect` that makes API calls **must** use `AbortController`:

- Create `const controller = new AbortController()` at the top of the effect.
- Pass `signal: controller.signal` to the API call options. If the call goes through a service/hook wrapper, the wrapper must accept and thread an optional `signal?: AbortSignal`.
- After every `await`, guard state updates with `if (controller.signal.aborted) return;`.
- Return `() => controller.abort()` as cleanup.

**Reject boolean-guard patterns** (`let cancelled = false`, `let ignore = false`, `let isMounted = true`) in new code — they prevent setState but do not cancel the HTTP request. Creating an `AbortController` without threading its signal to the network call is also insufficient.

### Derived data in render
Derive view state synchronously during render using plain functions. Do **not** use `useEffect` to copy props into state or "sync" derived values. Effects are reserved for real side effects (fetches, subscriptions). Reference React's [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect).

### Dialog pattern
Dialogs are self-contained: they own their form state, validation, and API calls, and communicate with parents via `onSuccess` / `onError` callbacks. Parents should not pass setters into dialogs (no `setUsers`, `setRoles` prop drilling).

### Forms
Use React Hook Form with `zodResolver(...)` and schemas imported from `@draco/shared-schemas`. Extend shared schemas for UI-only fields (e.g., file uploads) rather than redefining validation inline.

### File naming
- Default: **camelCase** (`authService.ts`, `userManagement.tsx`).
- React component files may use **PascalCase** when the filename matches the component's exported name (`AccountPageHeader.tsx`).
- Route files in the backend use **kebab-case** (see §3).

### Page layout
Account-scoped and team-scoped management pages must wrap content in `<main>` followed by `<AccountPageHeader>`. Data-management pages that allow creating records must include a Material-UI `<Fab>` fixed to the bottom-right with an `<AddIcon>`.

### Metadata
Every account/team `page.tsx` must export `generateMetadata` that delegates to `buildSeoMetadata` from `lib/seoMetadata`. When adding a new route with metadata, use the helpers in `lib/metadataParams` for both `searchParams` and `params`.

### Theming
Use `useTheme()` and read from `theme.palette` (including `theme.palette.widget.{surface,border,headerText,supportingText}`). Check `theme.palette.mode` for conditional light/dark styling. Never hardcode hex colors.

### Permissions
Use `const { hasPermission } = useRole()` and check before rendering admin UI or invoking privileged handlers. Do not rely on backend errors alone.

## 5. Shared Schemas & API Client (`draco-nodejs/shared`)

- `shared-schemas/` is the single source of truth for Zod schemas. Edits require explicit approval.
- `shared-schemas/dist/**` and `shared-api-client/generated/**` are regenerated outputs — flag any manual edits.
- When backend contracts change, the PR must show `pnpm sync:api` was run (both the updated OpenAPI spec and regenerated client should be committed).

## 6. Database & Migrations

- Prisma CLI commands run from `draco-nodejs/backend`, not the repo root.
- Migrations are authored as **raw SQL files** under `backend/prisma/migrations/`. Reject PRs that use `prisma migrate dev` — this project does not use Prisma's dev-migration flow.
- After schema changes, the PR should include updated generated Prisma client artifacts (`pnpm exec prisma generate`).

## 7. Testing

- Vitest powers both backend and frontend suites.
- Unit tests live in `__tests__/` beside source, named `*.test.ts` / `*.test.tsx`.
- Backend integration tests use `*.integration.test.ts` under `backend/src/__tests__/`.
- Integration tests must hit a **real database**, not mocks — mock/prod divergence has caused past migration incidents.
- When API response shapes change, test fixtures must be updated in the same PR.
- E2E tests must run via `pnpm frontend:e2e` (never `pnpm exec playwright test` directly).

## 8. Coding Style

- TypeScript, ES modules, two-space indentation, trailing commas.
- `camelCase` for variables and functions, `PascalCase` for React components/services/types, `SCREAMING_SNAKE_CASE` for constants.
- Match filenames to the primary export.
- Prefer editing existing files over creating new ones.
- Do not add speculative abstractions, features, or error handling for impossible scenarios. Three similar lines is better than a premature abstraction.

## 9. Commit & PR Standards

- Commit messages use concise imperative summaries (e.g., `refine player classifieds pagination`). Bundle lint/test fixes with the related code change.
- PRs should outline intent, highlight affected areas, list manual/automated test evidence, link the tracking issue, and attach screenshots or payload samples for UI and API changes.

## 10. Security

- Flag any diff that introduces command injection, SQL injection (raw queries with string interpolation), XSS, unsanitized `dangerouslySetInnerHTML`, open redirects, missing authorization checks on routes, or OWASP Top 10 issues.
- Route-layer middleware must include `authenticateToken`, `routeProtection.enforceAccountBoundary()`, and `routeProtection.requirePermission(...)` for any non-public account-scoped endpoint.
- `detect-secrets` guards the repo — if the baseline changes in a PR, verify the finding was reviewed, not blindly suppressed.

---

## Review Checklist (use for every PR)

1. Does the diff violate any absolute prohibition in §1?
2. If backend permissions changed, are both version strings bumped (§2)?
3. Do backend routes follow the layer separation and factory rules (§3)?
4. Do new endpoints have matching OpenAPI registrations and regenerated clients (§3, §5)?
5. Does frontend code avoid manual memoization while preserving stable-reference patterns (§4)?
6. Do new `useEffect` API calls use AbortController with the signal threaded through (§4)?
7. Are all frontend API calls going through generated OpenAPI methods (§4)?
8. Are API response shape changes reflected across all consumers (§1.6)?
9. Are tests updated, using real databases for integration tests (§7)?
10. Are file names, TypeScript types, and security middleware correct (§3, §4, §8, §10)?

When in doubt, flag for human review rather than approve. Authorization-sensitive changes, schema changes, and API contract changes always warrant explicit maintainer sign-off.
