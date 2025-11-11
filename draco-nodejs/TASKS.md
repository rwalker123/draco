# Social Hub & Integrations Tasks

> Track work related to the new Social Hub experience, backend ingestion layer, and community strategy. Keep this file in sync with product specs and architecture docs (`backend/BACKEND_ARCHITECTURE.md`, `frontend-next/FRONTEND_ARCHITECTURE.md`, `shared/SHARED_ARCHITECTURE.md`).

## Phase 1 – Strategy & Requirements
- [x] Document the updated platform matrix (official broadcast vs. community channels) and secure stakeholder sign-off. _See `docs/social-hub-plan.md` for matrix, ownership, priorities, and stakeholder alignment notes._
- [x] Decide whether the legacy message board remains, is rebuilt, or replaced with Discord; capture moderation/compliance requirements. _Decision captured in `docs/social-hub-plan.md` (“Community Channel Decision”)._
- [x] Define success metrics (engagement, participation drivers, adoption targets) and attach baseline analytics needs. _Deferred for now due to single-developer scope; treat analytics as future enhancement._

## Phase 2 – Shared Contracts & API Planning
- [x] Draft shared schema additions for `SocialFeed`, `CommunityThread`, and related DTOs (pause for approval before editing `shared/shared-schemas`). _See proposed Zod schemas in `docs/social-hub-plan.md` (“Phase 2 Draft – Shared Schema Additions”)._
- [x] Extend the OpenAPI spec with `/social/feed`, `/social/videos`, `/social/community`, and `/social/live-events` endpoints and map response formatters. _Endpoint plan captured in `docs/social-hub-plan.md` (“Phase 2 Draft – OpenAPI Endpoints”)._
- [x] Outline ingestion jobs per platform (Twitter/X, Facebook, Instagram, TikTok, YouTube, Twitch, Discord) including rate-limit and auth handling. _Automation matrix documented in `docs/social-hub-plan.md` (“Phase 2 Draft – Ingestion & Automation Jobs”)._

## Phase 3 – Backend Implementation
- [x] Implement repository/service/formatter layers for social content following the layered backend architecture. _See `backend/prisma/schema.prisma` + migration `20250215_social_content_tables`, new repositories (`PrismaSocialContentRepository`, `PrismaLiveEventRepository`), response formatters, and `SocialHubService`. _
- [x] Add schedulable ingestion workers or queue consumers to hydrate the social tables. _`SocialIngestionService` now boots Twitter/YouTube/Discord connectors (configurable via `SOCIAL_INGESTION_*` env vars) to populate the new social tables; see `backend/src/services/socialIngestion/*` and `backend/src/config/socialIngestion.ts`. _
- [x] Gate routes with RBAC + account boundary middleware and wire tests covering route/service/repository interactions. _New `/api/accounts/:accountId/seasons/:seasonId/social/*` routes (see `backend/src/routes/accounts-social.ts`) enforce `authenticateToken`, account boundary, and `account.manage` permissions for mutating actions; exercised by `src/services/__tests__/socialHubService.test.ts` for live event service logic. _

## Phase 4 – Frontend Social Hub
- [ ] Promote `app/social-hub-test` into a real `/social-hub` route with navigation entry points.
- [ ] Build typed service hooks for the new social/community APIs and integrate them into each tab (Timeline, Video, Q&A, Boards, Looking For, Live Chat).
- [ ] Persist layout preferences (grid/timeline/dashboard) and add analytics events for tab/view interactions.

## Phase 5 – Community & Adoption
- [ ] Implement Discord SSO + role mapping (if Discord replaces or supplements the custom board).
- [ ] Automate thread creation from key system events (new video, game result, scheduled stream) to drive participation.
- [ ] Ship announcements/notifications surfacing “needs reply” items and weekly engagement prompts.
