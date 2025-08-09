## Account Signup & Registration Plan

### Goals
- Support main-site signup (login creation only) without `accountId`.
- Support account membership registration flows:
  1) Logged-in, not a member → register self to account (create `contacts` with `creatoraccountid` and link to `userid`).
  2) Not logged-in → create login (`aspnetusers`) and account contact (`contacts`) together, with an "I'm already a user" option to login and register in one step.

### Current State (observed)
- Backend
  - POST `/api/auth/register` creates `aspnetusers` and optionally creates a contact in a default account if `firstName/lastName` are provided. We will keep this endpoint for main-site signup only and stop auto-creating contacts.
  - Account contact creation is admin-only: POST `/api/accounts/:accountId/contacts` requires `account.contacts.manage` permission, blocking self-registration.
- Frontend
  - `app/signup/Signup.tsx` posts to `/api/auth/register` and redirects to login; does not create an account contact.
  - Signup accepts optional `accountId` in query but does not register to the account.

### API Changes (Backend)
1) Membership check
- GET `/api/accounts/:accountId/contacts/me`
  - Auth required.
  - Returns the current user’s contact in the account (by `contacts.userid === req.user.id` and `creatoraccountid === accountId`); 404 if none.

2) Self-registration (logged-in)
- POST `/api/accounts/:accountId/contacts/me`
  - Auth required. No special account role required.
  - Body: `{ firstName: string, lastName: string, email?: string }` (extendable later).
  - Creates contact with `creatoraccountid = :accountId`, `userid = req.user.id`, default `dateofbirth` if not provided.
  - Guards: if a contact already exists for `(userid, accountId)` return 409.

3) Combined login + account registration (not-logged-in)
- POST `/api/accounts/:accountId/registration`
  - Rate-limited.
  - Two modes via payload:
    - New user: `{ mode: 'newUser', email, password, firstName, lastName }` → creates `aspnetusers`, issues token, creates contact, returns `{ token, user, contact }`.
    - Existing user: `{ mode: 'existingUser', usernameOrEmail, password, firstName, lastName? }` → verifies creds, creates contact, returns `{ token, user, contact }`.
  - Use `prisma.$transaction` to ensure atomicity. Roll back on failure.

4) Adjust `/api/auth/register`
- Keep semantics strictly for main-site signup (login only). Remove/deprecate implicit contact creation in a default account.

5) Optional
- Enforce unique contact per `(userid, creatoraccountid)` at application level.
- Keep admin-only endpoints unchanged for staff usage.

### Services & Routing (Backend)
- Extend `accounts-contacts` router for `contacts/me` GET/POST or add `accounts-registration` router for the combined endpoint.
- Create `RegistrationService` to orchestrate:
  - New user creation (reuse `AuthService`), login (reuse `AuthService.login`), contact creation, and transaction boundaries.

### Validation & Security
- Basic validation: name required, email format if provided, password strength for new user.
- Rate limiting on registration endpoints.
- Sanitize input and enforce account boundary checks where applicable.

### Frontend Changes
1) Account pages (e.g., `app/account/[accountId]/...`)
- On load, call `GET /api/accounts/:accountId/contacts/me`.
- If 404 and user is logged in → show "Register for this account" CTA/form.
- If 404 and user not logged in → show combined flow with tabs:
  - "Create login + register" → POST `/api/accounts/:accountId/registration` with `mode: 'newUser'`.
  - "I'm already a user" → POST `/api/accounts/:accountId/registration` with `mode: 'existingUser'`.
- On success: store token in AuthContext, refresh Role/Account contexts, and redirect (e.g., to account home or Teams).

2) Signup page
- If `accountId` query is present, add a checkbox/option:
  - "Also register me to this account now" → uses combined endpoint instead of main `/api/auth/register`.
  - Otherwise, default to main-site login creation only.

### UX/Copy
- Logged-in non-member: "You’re not registered with this organization yet. Register to continue."
- Not logged-in: Provide both options clearly with brief descriptions.

### Edge Cases
- Contact already exists for `(userid, accountId)` → 409 with clear message.
- Name-based contact uniqueness collisions → Return actionable error; suggest using different middle name or ask admin for help.
- Duplicate login email/username → standard errors from `AuthService.register`.

### Telemetry & Logging
- Log registration attempts and outcomes (no sensitive data).

### Testing
- Unit: RegistrationService, new routes.
- Integration: end-to-end for both flows, idempotency, and error cases.

### Deployment & Migration
- No schema changes required.
- Update Swagger for new endpoints.
- Coordinate FE release with BE.

### Open Questions
- Endpoint names OK? (`contacts/me`, `registration`)
- Minimum fields for self-registration? (first/last only for now)
- Default roles on registration? (assume none)
- Post-registration redirect target?

