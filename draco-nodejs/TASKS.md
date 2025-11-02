# Player Survey Feature Tasks

> Follow architecture guidance in `backend/BACKEND_ARCHITECTURE.md`, `shared/SHARED_ARCHITECTURE.md`, and `frontend-next/FRONTEND_ARCHITECTURE.md` for every checklist item.

## Phase 1 – Specification & Contracts
- [x] Produce detailed API + UI spec covering season scoping, permissions, pagination/search, and widget behavior; review with stakeholders.
- [x] Model required endpoints in `src/openapi/zod-to-openapi.ts`, ensuring schemas come from `@draco/shared-schemas`.
- [x] Confirm shared schema updates were required, obtained approval, and documented regeneration workflow.

## Phase 2 – Backend Implementation
- [ ] Implement repositories/services for categories, questions, answers, and random spotlight queries constrained to the current season.
- [ ] Add Express routes enforcing authentication/authorization per account boundary rules and documenting endpoints in OpenAPI.
- [ ] Cover new logic with unit/integration tests (season filtering, permissions, cascade deletes, random selection).

## Phase 3 – Shared Schema & Client Sync
- [x] Apply approved schema updates (if any) under `shared/shared-schemas` and run `npm run sync:api`.
- [ ] Verify generated SDK changes in `@draco/shared-api-client` and update consumers.

## Phase 4 – Frontend Admin Experience
- [ ] Build account admin survey management page (category/question/answer CRUD, pagination, search) using generated client and architecture patterns.
- [ ] Add confirmation dialogs and success/error messaging consistent with existing admin tools.
- [ ] Write component/unit tests for admin flows.

## Phase 5 – Player & Public Survey Pages
- [ ] Create account survey page listing current-season player surveys with search/pagination and player-specific editor access.
- [ ] Ensure logged-in players can edit their survey regardless of current-season status while others remain filtered.
- [ ] Update profile Contact Info card (and other entry points) to link into the new survey experience.
- [ ] Add frontend tests covering visibility rules and edit flows.

## Phase 6 – Spotlight Widgets
- [ ] Implement reusable survey spotlight widget that selects random current-season answers for account and team contexts.
- [ ] Embed widgets on target pages with graceful empty states and links to the survey page.
- [ ] Add tests validating season filtering and fallback behavior.

## Phase 7 – QA & Launch Readiness
- [ ] Run backend/frontend test suites and add regression coverage for new endpoints/components.
- [ ] Perform manual verification with seeded data (admin CRUD, player editing, public listing, widgets).
- [ ] Update documentation/changelog and plan rollout (feature flag, navigation updates, comms).
