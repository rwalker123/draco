# Player Survey Feature Tasks

> Follow architecture guidance in `backend/BACKEND_ARCHITECTURE.md`, `shared/SHARED_ARCHITECTURE.md`, and `frontend-next/FRONTEND_ARCHITECTURE.md` for every checklist item.

## Phase 1 – Specification & Contracts
- [x] Produce detailed API + UI spec covering season scoping, permissions, pagination/search, and widget behavior; review with stakeholders.
- [x] Model required endpoints in `src/openapi/zod-to-openapi.ts`, ensuring schemas come from `@draco/shared-schemas`.
- [x] Confirm shared schema updates were required, obtained approval, and documented regeneration workflow.

## Phase 2 – Backend Implementation
- [x] Implement Prisma-backed player survey repository (categories, questions, answers, listings, spotlights) with current-season filters.
- [x] Add response formatter and PlayerSurveyService handling permissions, season lookups, and business rules.
- [x] Wire ServiceFactory/RepositoryFactory entries and create Express routes for `/surveys` endpoints with appropriate middleware.
- [x] Author backend tests covering repository queries, service permission logic, and route integration (auth + search/pagination + spotlights).

## Phase 3 – Shared Schema & Client Sync
- [x] Apply approved schema updates (if any) under `shared/shared-schemas` and run `npm run sync:api`.
- [x] Verify generated SDK changes in `@draco/shared-api-client` and update consumers.

## Phase 4 – Frontend Admin Experience
- [x] Build account admin survey management page (category/question/answer CRUD, pagination, search) using generated client and architecture patterns (`frontend-next/app/account/[accountId]/surveys/manage/SurveyManagementPage.tsx`).
- [x] Add confirmation dialogs and success/error messaging consistent with existing admin tools (`SurveyManagementPage.tsx` delete dialogs and toast alerts).
- [x] Write component/unit tests for admin flows (`frontend-next/app/account/[accountId]/surveys/manage/__tests__/SurveyManagementPage.test.tsx`).
- [x] Profile `listPlayerSurveys` end-to-end (Prisma query logs, EXPLAIN plans, UI timings) to quantify current latency.
- [x] Implement lighter survey response payload (summary list + lazy detail fetch) to reduce render weight.
- [x] Plan frontend state/rendering changes to decouple the player search field from the heavy response list.
  - [x] Extracted `SurveyPlayerSearchPanel` to own debounced search state and results rendering (`frontend-next/app/account/[accountId]/surveys/manage/SurveyPlayerSearchPanel.tsx`).
  - Lift selection callbacks to `SurveyPlayerResponsesManager`, exposing a `handleContactSelected` that refreshes summaries without resetting pagination.
  - [x] Memoize the response list (`useMemo` + stable props) and gate detail fetches behind controlled expansion so search input updates never re-trigger accordion renders (`frontend-next/app/account/[accountId]/surveys/manage/SurveyManagementPage.tsx`).
  - Introduce a small `useSurveyResponses` hook to encapsulate summary/detail loading, allowing both the search panel and list to subscribe without sharing mutable state.
- [x] Implement decoupled player search panel and shared response hook to prevent response list re-renders during typing.
- [x] Recommend database indexes or query tweaks that target the roster/answer search filters surfaced in the profiling step.

## Phase 5 – Player & Public Survey Pages
- [x] Create account survey page listing current-season player surveys with search/pagination and player-specific editor access.
- [x] Ensure logged-in players can edit their survey regardless of current-season status while others remain filtered.
- [x] Update profile Contact Info card (and other entry points) to link into the new survey experience.
- [x] Add frontend tests covering visibility rules and edit flows.

## Phase 6 – Spotlight Widgets
- [ ] Implement reusable survey spotlight widget that selects random current-season answers for account and team contexts.
- [ ] Embed widgets on target pages with graceful empty states and links to the survey page.
- [ ] Add tests validating season filtering and fallback behavior.

## Phase 7 – QA & Launch Readiness
- [ ] Run backend/frontend test suites and add regression coverage for new endpoints/components.
- [ ] Perform manual verification with seeded data (admin CRUD, player editing, public listing, widgets).
- [ ] Update documentation/changelog and plan rollout (feature flag, navigation updates, comms).
