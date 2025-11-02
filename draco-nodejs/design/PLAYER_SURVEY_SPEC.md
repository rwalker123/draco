# Player Survey Feature – Specification Draft

## Overview
The player survey feature reintroduces question-and-answer profiles in the Node/Next stack while complying with:
- Backend layering rules (`backend/BACKEND_ARCHITECTURE.md`)
- Shared contract workflow (`shared/SHARED_ARCHITECTURE.md`)
- Frontend composition patterns (`frontend-next/FRONTEND_ARCHITECTURE.md`)

Existing tables (`profilecategory`, `profilequestion`, `playerprofile`) remain canonical. No schema edits are anticipated; any discovered gaps require explicit maintainer approval before touching `shared/shared-schemas`.

## Core Requirements
- **Season scoping**: Only players active in the account’s current season appear in public/admin lists, search results, and random spotlight selections. Logged-in players can always open and edit their own survey even if they are not on a current-season roster.
- **Permissions**:
  - Account Admins: full CRUD on categories, questions, and any player’s answers; view all responses.
  - Authenticated players: read entire survey catalog filtered to current-season peers, edit only their own answers, always accessible via profile Contact Info.
  - Anonymous/public visitors: access the survey listing and spotlight widgets only when account visibility permits (reuse existing account gating). No editing.
- **Search & pagination**: Lists follow existing admin defaults (page size 20 unless platform provides another standard) with query string search on player name and optionally question text.
- **No optimistic updates**: All UI updates wait for confirmed API responses.

## User Experiences
### 1. Admin Survey Management (`/account/{accountId}/surveys/manage`)
- Category CRUD with priority ordering and question nesting.
- Question CRUD with question number ordering and cascade warnings.
- Player answer oversight: table filtered to current-season players, inline search, edit/delete dialogs.
- Success/error and destructive action confirmations mirroring poll management UX.

### 2. Player/Public Survey Page (`/account/{accountId}/surveys`)
- Public list of current-season players who completed surveys (accordion/expand per player).
- Logged-in player CTA to “Edit My Survey”; editing happens inline or via drawer with per-question text areas.
- Empty states when no current-season surveys exist or the viewer lacks roster status.
- Pagination + search controls consistent with other account pages.

### 3. Profile Integration
- Contact Info card button sends user to the survey page (or directly to the editor when appropriate).
- Clear messaging when a player is not eligible for public listing but may still edit their own survey.

### 4. Spotlight Widgets
- Account widget displayed on account home/dashboard pulling a random current-season answer.
- Team widget on team pages limited to the team’s current-season roster.
- Both provide link to the survey page and display empty state when zero eligible answers exist.

## API Surface (Draft)
All endpoints live under `/api/accounts/{accountId}/surveys` and must be declared in `src/openapi/zod-to-openapi.ts` with schemas sourced from `@draco/shared-schemas`.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/accounts/{accountId}/surveys/categories` | GET | Account Admin or authenticated player | Returns survey categories and their questions for editing or response entry. |
| `/api/accounts/{accountId}/surveys/categories` | POST | Account Admin | Create a category; cascades follow database rules. |
| `/api/accounts/{accountId}/surveys/categories/{categoryId}` | PUT/DELETE | Account Admin | Update or delete an existing category. Delete cascades questions and answers. |
| `/api/accounts/{accountId}/surveys/categories/{categoryId}/questions` | POST | Account Admin | Create a question under a category. |
| `/api/accounts/{accountId}/surveys/questions/{questionId}` | PUT/DELETE | Account Admin | Update or delete a specific question. |
| `/api/accounts/{accountId}/surveys/answers` | GET | Public (account visibility rules) | Paginated list of current-season player surveys with optional search. |
| `/api/accounts/{accountId}/surveys/answers/{playerId}` | GET | Public (account visibility rules) | Full answer set for a player; non-current-season players surface only for the authenticated owner. |
| `/api/accounts/{accountId}/surveys/answers/{playerId}/questions/{questionId}` | PUT/DELETE | Authenticated player or Account Admin | Upsert or delete an individual answer, respecting ownership rules. |
| `/api/accounts/{accountId}/surveys/spotlight` | GET | Public (account visibility rules) | Random current-season answer for account widgets. |
| `/api/accounts/{accountId}/surveys/teams/{teamSeasonId}/spotlight` | GET | Public (team visibility rules) | Random current-season answer scoped to a team for team widgets. |

### Query Parameters
- `page` (default 1) and `pageSize` (default platform standard, e.g., 20).
- `search` matches player name (first/last) and optionally question text; case-insensitive.
- `includeInactiveSelf` (boolean) allows a logged-in player to fetch their own answers even if not current-season; only honored when `playerId` equals authenticated contact.

### Error Handling
- Standard error types (`NotFound`, `Forbidden`, `ValidationError`, etc.) via global handler.
- Spotlight endpoints return HTTP 404 when no eligible answers exist.

## Data & Business Logic Notes
- Current-season filtering relies on existing season services; repository layer should expose helpers to:
  - Resolve current season id for an account.
  - Fetch current-season rostered contact ids per account/team.
- Random selection should occur in service layer with deterministic fallback for single-entry sets.
- Cascading deletions handled via Prisma transactions to remove dependent questions/answers.

## Frontend Integration Points
- Generate hooks in services/components folder using API client (`@draco/shared-api-client`).
- Admin page follows dialog + table pattern; leverage reusable table components if available.
- Public page should be a server component shell with client subcomponents for pagination/search (per Next.js architecture).
- Widgets should be small client components with effect-based fetch and skeleton states.

## Testing Strategy
- Backend: route tests covering permissions, season filters, and search; service tests for random selection and cascades.
- Frontend: unit tests for admin dialogs, list search, widget empty states; integration test for player edit flow.
- Manual QA checklist includes admin CRUD, player self-edit, public visibility, and widget output.

## Shared Schema Impact
- New schemas required to represent survey categories, questions, answers, listings, and update payloads (e.g., `PlayerSurveyCategoryType`, `PlayerSurveyQuestionType`, `PlayerSurveyAnswerType`, paginated response wrappers).
- These schemas must live under `shared/shared-schemas` with OpenAPI metadata, requiring maintainer approval before implementation.
- Once approved, `npm run sync:api` will regenerate the SDK so frontend components can consume the new types.

## Open Questions
- Confirm exact pagination defaults across admin/public tables (currently assuming 20).
- Determine whether survey listing is public by default or behind existing account privacy setting.
- Verify need for audit logging for admin edits (reuse existing logging middleware if required).
