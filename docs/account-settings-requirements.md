# Account Settings (Backend Administration) Requirements

## Purpose & Scope
- Recreate the Account Settings experience from the legacy ASP.NET MVC app inside the new Node/React stack.
- Focus for this iteration: **backend administration** — expose APIs that allow Account Admins to toggle account-level feature flags and housekeeping values. No UI or downstream feature gating changes are included yet.
- Reference architecture documents: `draco-nodejs/backend/BACKEND_ARCHITECTURE.md` and `draco-nodejs/shared/SHARED_ARCHITECTURE.md`.

## Legacy Implementation Findings

### Data Model
- `accountsettings` table (also present in Prisma schema at `draco-nodejs/backend/prisma/schema.prisma:70`):
  - Composite primary key on `(accountid, settingkey)`.
  - `settingvalue` is a 25-character `varchar`, so every value was stored as a string (`"true"`, `"false"`, `"30"`, etc.).
- Helper methods `DBExtensions.GetAccountSetting` / `SetAccountSetting` performed the DB lookups/upserts (`Draco/Controllers/DBExtensions.cs:403-436`). Missing rows defaulted to `"False"`.

### Server APIs in the ASP.NET app
- `GET /api/AccountAPI/{accountId}/Settings` returned all existing rows for the account (`Draco/Controllers/AccountAPIController.cs:362-371`).
- `POST /api/AccountAPI/{accountId}/Settings` upserted a single `{ Id, Value }` pair (`Draco/Controllers/AccountAPIController.cs:373-378`).
- Both endpoints required `AccountAdmin` role (`SportsManagerAuthorize` attribute).
- `GET/POST /api/DiscussionsAPI/{accountId}/expirationdays` wrapped the special `MessageBoardCleanup` numeric setting (`Draco/Controllers/DiscussionsAPIController.cs:358-409`).
- No validation beyond coarse role guarding; any `settingkey` string would be persisted if the UI posted it.

### Legacy UI Flow
1. `LeagueController.Settings` (Account Admin only) rendered `SettingsView.cshtml` (`Draco/Areas/Baseball/Controllers/LeagueController.cs:55-63`).
2. The Knockout view model (`SettingsView.cshtml:42-205`) defined all available setting keys, grouped checkboxes, and mapped each observable to a corresponding `settingkey`.
3. On load, the client fetched `/api/AccountAPI/{accountId}/Settings`, iterated through the rows, and toggled local observables (`SettingsView.cshtml:207-224`).
4. Each observable pushed updates immediately via AJAX `POST` calls once the initial fetch completed (`settingsInitialized` gate).
5. No metadata (display labels, descriptions, defaults) came from the backend; everything was hard-coded in the view.

### Setting Key Determination
- Keys were **not computed or stored anywhere centrally** — they were simply hard-coded string literals inside the view model and feature consumers (see `SettingsView.cshtml` and the `GetAccountSetting` calls listed below).
- This answers the open question: _the ASP.NET page relied on predefined strings such as `"ShowPlayerSurvey"` or `"TrackGamesPlayed"`; administrators could only manage the keys the UI knew about_.

### Downstream Feature Usage
- Multiple controllers/view models queried these settings to decide which UI elements to show:
  - Roster/Managers/Schedule/Scoreboard view models for player data tracking (`Draco/Areas/Baseball/Models/ViewModels/Controllers/*.cs`).
  - `LeagueHomeViewModel` for homepage widgets (`LeagueHomeViewModel.cs:27-99`).
  - `TeamViewModel` for interviews/videos toggles (`TeamViewModel.cs:33-67`).
  - `MenuHelper` for building navigation entries (`Draco/Models/Helpers/MenuHelper.cs:120-185`).
  - Discussions/message board view models for photos, classifieds, and cleanup (`Draco/Models/ViewModels/Controllers/DiscussionsViewModel.cs:8-40`, `Draco/Controllers/DiscussionsAPIController.cs:358-409`).
  - `AccountController.Manage` decided whether to show/edit contact information (`Draco/Controllers/AccountController.cs:249-315`).

## Legacy Settings Catalog

| Setting Key | Type | Legacy UI Group | Consuming Areas (non-exhaustive) | Notes |
|-------------|------|-----------------|----------------------------------|-------|
| `ShowBusinessDirectory` | boolean | Account Features | MenuHelper adds “Member Business”; Discussions VM toggles panel | Enables the “Member Business Directory” page/link. |
| `ShowSponsorSpotlight` | boolean | Account Features | LeagueHomeViewModel | Requires sponsors; controls home page sponsor spotlight panel. |
| `ShowPlayerClassified` | boolean | Account Features | MenuHelper, DiscussionsViewModel | Adds Player Classified menu and stats; toggles “Team needs player / player needs team.” |
| `ShowPlayerSurvey` | boolean | Account Features | MenuHelper, TeamViewModel, LeagueHomeViewModel | Drives survey menu link and “Player Interview” widgets (only if profiles exist). |
| `ShowHOF` | boolean | Account Features | LeagueHomeViewModel, MenuHelper | Enables Hall of Fame section and nav link (requires HOF data). |
| `TrackWaiver` | boolean | Player Data | RosterViewModel | Allows staff to record waiver submission state for players. |
| `ShowWaiver` | boolean | Player Data | RosterViewModel | Displays waiver status column on roster pages (depends on `TrackWaiver`). |
| `TrackIdentification` | boolean | Player Data | RosterViewModel | Enables capturing ID/submitted documents. |
| `ShowIdentification` | boolean | Player Data | RosterViewModel | Renders identification status column when tracking is enabled. |
| `TrackGamesPlayed` | boolean | Player Data | RosterViewModel, ScheduleViewModel, ScoreboardViewModel | Turns on per-player games played tracking across roster, schedule, and scoreboard views. |
| `ShowRosterCard` | boolean | Team Pages | ManagersViewModel | Displays printable roster card on team admin page. |
| `ShowUserInfoOnRosterPage` | boolean | Team Pages | RosterViewModel | Reveals contact info (phone/address) on roster page. |
| `MsgBoardShowPhoto` | boolean | Message Board | DiscussionsViewModel | Adds poster photos to message board posts. |
| `ShowContactInfo` | boolean | Contact Information | AccountController.Manage | Shows contact tab to end users. |
| `EditContactInfo` | boolean | Contact Information | AccountController.Manage | Lets users edit their contact details. |
| `MessageBoardCleanup` | number (days) | Message Board | DiscussionsAPIController | Determines retention period (defaults to 30 days when unset/invalid). |

*(Note: The legacy UI also rendered grouped panels labeled “Account Features”, “Player Data”, “Contact Information”, “Team Pages”, and “Message Board” as shown in `SettingsView.cshtml:18-120`.)*

## Functional Requirements for the New Backend

1. **Authoritative Setting Catalog**
   - Define a canonical list of setting keys, value types, labels, default values, and optional feature dependencies inside the backend (likely a `const ACCOUNT_SETTINGS_DEFINITIONS` map).
   - Enforce allowed keys when reading/writing to prevent arbitrary rows.
   - `settingkey` names remain <= 25 chars to satisfy existing schema limits.

2. **Routes & Permissions (Route Layer)**
   - Create an `accountSettingsRouter` under `backend/src/routes` that wires endpoints such as:
     - `GET /api/accounts/:accountId/settings` – returns metadata + current values for every known key.
     - `PUT /api/accounts/:accountId/settings/:settingKey` (or `POST` with body) – updates one setting.
     - Optional: `POST /api/accounts/:accountId/settings/reset` to revert to defaults (by deleting rows).
   - Apply the standard middleware chain per `BACKEND_ARCHITECTURE.md`: `authenticateToken`, `routeProtection.enforceAccountBoundary()`, and a dedicated permission (e.g., `account.settings.manage`).
   - Use shared schemas for params/bodies; no ad-hoc Zod validators.

3. **Service Layer Responsibilities**
   - `AccountSettingsService` handles:
     - Loading existing rows from the repository and overlaying defaults for missing keys.
     - Validating incoming values (boolean vs numeric) according to the catalog definition.
     - Converting to/from storage format (`string`) and to shared schema types.
     - Enforcing any business rules (e.g., `ShowWaiver` cannot be `true` if `TrackWaiver` is `false`).
   - Services must only accept validated/account-scoped data from the route layer as per architecture guide.

4. **Repository Layer**
   - `AccountSettingsRepository` encapsulates Prisma calls against `accountsettings`.
   - Implement methods such as `findByAccountId(accountId: bigint)`, `upsert(accountId, key, value)`, and (optionally) `delete(accountId, key)`.
   - Repositories should return raw Prisma types; formatters convert them to shared schema objects.

5. **Response Formatters**
   - Provide a formatter that maps DB rows (`accountsettings`) into typed DTOs defined in `@draco/shared-schemas`.
   - Ensure IDs remain strings for the frontend (per shared schema guidance).

6. **Shared Schemas & OpenAPI**
   - Introduce (with the necessary approval) schemas such as:
     - `AccountSettingKey` (string enum).
     - `AccountSettingValueSchema` (discriminated union: boolean or integer depending on `type`).
     - `AccountSettingDefinition` (key, label, description, group, type, defaultValue, dependencies?).
     - `AccountSettingUpdateRequest`.
   - Register the new endpoints inside `backend/src/openapi/zod-to-openapi.ts` so the shared API client stays in sync.
   - After schema updates, run `npm run sync:api` to regenerate shared bundles & SDKs.
   - Expose the full definitions object via `@draco/shared-schemas` so frontend helpers can import metadata directly (labels, descriptions, applicable pages/components).

7. **Value Handling Rules**
   - Missing settings should fall back to the catalog default (defaults to `false` except `MessageBoardCleanup` which defaults to 30 days).
   - Persisted strings must be normalized (`"true"`/`"false"` lower-case) to keep legacy compatibility.
   - Numeric values must be validated within an acceptable range (e.g., cleanup days 1–365).
   - Use the catalog metadata to enforce dependencies (e.g., disallow `ShowWaiver=true` when `TrackWaiver=false`). These rules should live in the service layer so all clients observe the same constraints.

8. **Integration with React App**
   - The React page at `frontend-next/app/account/[accountId]/settings/AccountSettings.tsx` currently renders placeholder tabs; once the backend is ready it can fetch the catalog to render toggles instead of the hard-coded Knockout view.
   - Follow the “no optimistic updates” rule: backend should return the updated value, and the frontend should refetch or rely on response data before updating state.
   - Implement shared wrappers (e.g., `<AccountOptional component="playerSurvey">`) that look up their required key/value from the shared definitions catalog. Pages wrapped by the helper should return 404s when the setting disables them; widgets should simply render nothing and avoid triggering effects/API calls.
   - Do **not** support ad-hoc `setting="..."` overrides until there is a concrete need; all usage should route through the centralized component configuration.

9. **Security & Auditing**
   - Ensure all endpoints are multi-tenant safe (`routeProtection.enforceAccountBoundary()`).
   - Consider logging/auditing changes for future troubleshooting (service layer hook).

10. **Testing Expectations**
    - Unit tests for service logic (value validation, dependency rules).
    - Integration tests covering route authorization + Prisma repository (using the existing backend testing patterns).
    - Tests should live under `backend/src/__tests__` following Vitest conventions described in `BACKEND_ARCHITECTURE.md`.

## Notes
- Message Board cleanup controls will be revisited alongside the future discussions-management experience.
- Data migration tasks will validate existing keys against the new enum when that work begins.

Documenting these findings preserves how the ASP.NET application behaved and provides a concrete checklist for the new backend implementation while adhering to the layered architecture requirements.
