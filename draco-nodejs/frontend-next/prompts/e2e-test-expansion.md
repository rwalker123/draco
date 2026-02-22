# E2E Test Expansion Guide

## Overview

This document is a prompt for expanding the Playwright E2E test suite. The foundation is already in place with authentication, fixtures, Page Object Models, and smoke tests. The goal is to add comprehensive coverage across the application's key user flows.

## Prerequisites

1. Dev server running: `npm run dev` from the repo root
2. `.env.e2e` configured with valid test credentials (in `draco-nodejs/frontend-next/`)
3. Playwright installed: `@playwright/test` is already a devDependency

## How to Run Tests

All commands run from the repo root:

```bash
# Run all E2E tests (Chromium only, fastest)
npm run e2e:chromium -w @draco/frontend-next

# Run with visible browser window
npm run e2e:headed -w @draco/frontend-next

# Run with Playwright UI debugger (time-travel, step-through)
npm run e2e:ui -w @draco/frontend-next

# Run a single test file
npm run e2e:chromium -w @draco/frontend-next -- e2e/tests/account/social-media.spec.ts

# Run tests matching a name pattern
npm run e2e:chromium -w @draco/frontend-next -- --grep "Social Media"

# Debug a specific test (opens browser with step-through)
npm run e2e:debug -w @draco/frontend-next -- --grep "displays the page heading"

# Record new tests by clicking in the browser
npm run e2e:codegen -w @draco/frontend-next

# View the HTML report after a test run
npm run e2e:report -w @draco/frontend-next
```

## How to Write Tests

### File Organization

```
e2e/
├── fixtures/
│   └── base-fixtures.ts        # Shared fixtures (accountId, etc.)
├── pages/                      # Page Object Models (one per page/feature)
│   ├── login.page.ts
│   └── social-media.page.ts
├── tests/
│   ├── smoke/                  # Core navigation & auth tests
│   ├── account/                # Account-scoped feature tests
│   ├── admin/                  # Admin panel tests
│   ├── community/              # Social hub, classifieds, etc.
│   └── sports/                 # Seasons, teams, schedule, stats
├── global-setup.ts             # Auth setup (runs first)
└── global-teardown.ts          # Cleanup (placeholder)
```

### Test File Template

```typescript
import { test, expect } from '../../fixtures/base-fixtures';
import { SomePage } from '../../pages/some.page';

test.describe('Feature Name', () => {
  let somePage: SomePage;

  test.beforeEach(async ({ page, accountId }) => {
    somePage = new SomePage(page);
    await somePage.goto(accountId);
  });

  test('displays the main content', async () => {
    await expect(somePage.heading).toBeVisible();
  });

  test('can interact with elements', async () => {
    await somePage.someAction();
    await expect(somePage.resultElement).toBeVisible();
  });
});
```

### Page Object Model Template

```typescript
import type { Locator, Page } from '@playwright/test';

export class SomePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly someButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Page Title' });
    this.someButton = page.getByRole('button', { name: 'Action' });
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/some-route`);
    await this.heading.waitFor();
  }

  async someAction() {
    await this.someButton.click();
  }
}
```

### Locator Best Practices

Use accessible locators (resist the urge to use CSS selectors):

```typescript
// Preferred — accessible, resilient to DOM changes
page.getByRole('heading', { name: 'Social Media Management' })
page.getByRole('button', { name: 'Save' })
page.getByRole('tab', { name: 'Discord' })
page.getByLabel('Email')
page.getByText('No data available')
page.getByRole('link', { name: 'Settings' })

// Scope to a landmark when there are duplicates
page.getByRole('main').getByRole('button', { name: 'Sign In' })

// For MUI DataGrid rows/cells
page.getByRole('row', { name: /John Smith/ })
page.getByRole('cell', { name: 'Active' })

// For dialogs
page.getByRole('dialog').getByRole('button', { name: 'Confirm' })

// Last resort — test IDs (only if no accessible selector works)
page.getByTestId('some-element')
```

### Testing Unauthenticated Flows

```typescript
test('redirects to login', async ({ browser, accountId }) => {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  await page.goto(`/account/${accountId}/settings`);
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  await context.close();
});
```

### Environment Variables Available

- `E2E_ADMIN_EMAIL` — test user email
- `E2E_ADMIN_PASSWORD` — test user password
- `E2E_ACCOUNT_ID` — known test account ID

These are loaded from `.env.e2e` via dotenv. The `accountId` is also available as a Playwright fixture (see `base-fixtures.ts`).

---

## Test Priority List

Tests are ordered by importance. Higher priority = more value, more user impact.

### Priority 1: Account Admin Core (High Impact, High Traffic)

These pages are used daily by league administrators.

#### 1.1 User/Contact Management (`/account/[accountId]/users`)
- **File:** `e2e/tests/account/user-management.spec.ts`
- **POM:** `e2e/pages/user-management.page.ts`
- **Tests:**
  - Page loads with contact list (DataGrid)
  - Search/filter contacts by name
  - Open add contact dialog
  - Open edit contact dialog
  - Verify role badges display correctly
  - Pagination works on large contact lists

#### 1.2 Account Settings (`/account/[accountId]/settings`)
- **File:** `e2e/tests/account/settings.spec.ts`
- **POM:** `e2e/pages/settings.page.ts`
- **Tests:**
  - Page loads with account settings form
  - Can update account name/description
  - Can upload/change account logo
  - Settings save successfully (wait for confirmation alert)
  - Unauthorized users cannot access (redirect to login)

#### 1.3 Admin Hub (`/account/[accountId]/admin`)
- **File:** `e2e/tests/admin/admin-hub.spec.ts`
- **POM:** `e2e/pages/admin-hub.page.ts`
- **Tests:**
  - Admin hub renders with navigation cards/links
  - Search functionality filters admin options
  - Each admin link navigates to the correct page
  - Non-admin users see appropriate restriction message

#### 1.4 Season Administration (`/account/[accountId]/admin/season`)
- **File:** `e2e/tests/admin/season-admin.spec.ts`
- **POM:** `e2e/pages/season-admin.page.ts`
- **Tests:**
  - Season list loads
  - Can view season details
  - Season settings are editable
  - Season status (active/inactive) displays correctly

### Priority 2: Content Management (Frequent Admin Actions)

#### 2.1 Announcements (`/account/[accountId]/announcements`)
- **File:** `e2e/tests/account/announcements.spec.ts`
- **POM:** `e2e/pages/announcements.page.ts`
- **Tests:**
  - Announcement list loads
  - Can navigate to manage announcements (`/announcements/manage`)
  - Create announcement dialog opens
  - Announcement displays with correct content
  - Can edit an existing announcement
  - FAB button visible for authorized users

#### 2.2 Handouts (`/account/[accountId]/handouts`)
- **File:** `e2e/tests/account/handouts.spec.ts`
- **POM:** `e2e/pages/handouts.page.ts`
- **Tests:**
  - Handout list loads
  - Can navigate to manage view
  - Handout cards display correctly
  - Can open create/edit dialog

#### 2.3 Communications (`/account/[accountId]/communications`)
- **File:** `e2e/tests/account/communications.spec.ts`
- **POM:** `e2e/pages/communications.page.ts`
- **Tests:**
  - Communications hub loads (Baseball accounts only)
  - Can navigate to compose page
  - Can navigate to history page
  - Can navigate to templates page
  - Template list loads
  - Can create a new template

#### 2.4 Sponsors (`/account/[accountId]/sponsors/manage`)
- **File:** `e2e/tests/account/sponsors.spec.ts`
- **POM:** `e2e/pages/sponsors.page.ts`
- **Tests:**
  - Sponsor list loads
  - Can open add sponsor dialog
  - Sponsor cards display with logo/details
  - Can edit a sponsor

### Priority 3: Sports Management (Core Business Logic)

#### 3.1 Schedule (`/account/[accountId]/schedule`)
- **File:** `e2e/tests/sports/schedule.spec.ts`
- **POM:** `e2e/pages/schedule.page.ts`
- **Tests:**
  - Schedule page loads with games list
  - Can filter by date range
  - Can filter by team
  - Game details display correctly (teams, time, field)
  - Can navigate to schedule management

#### 3.2 Schedule Management (`/account/[accountId]/schedule-management`)
- **File:** `e2e/tests/sports/schedule-management.spec.ts`
- **POM:** `e2e/pages/schedule-management.page.ts`
- **Tests:**
  - Management page loads
  - Can create a new game
  - Can edit game details
  - Can enter/update game scores
  - Score submission shows confirmation

#### 3.3 Teams List (`/account/[accountId]/seasons/[seasonId]/teams`)
- **File:** `e2e/tests/sports/teams.spec.ts`
- **POM:** `e2e/pages/teams.page.ts`
- **Note:** Requires `E2E_SEASON_ID` env var (add to `.env.e2e` and `base-fixtures.ts`)
- **Tests:**
  - Teams list loads
  - Team cards display with name/record
  - Can navigate to individual team page
  - Team detail page loads with roster/stats sections

#### 3.4 Team Detail (`/account/[accountId]/seasons/[seasonId]/teams/[teamSeasonId]`)
- **File:** `e2e/tests/sports/team-detail.spec.ts`
- **POM:** `e2e/pages/team-detail.page.ts`
- **Note:** Requires `E2E_TEAM_SEASON_ID` env var
- **Tests:**
  - Team home page loads
  - Team roster section displays players
  - Team stats section displays data
  - Can navigate to roster management
  - Can navigate to team announcements

#### 3.5 Standings (`/account/[accountId]/seasons/[seasonId]/standings`)
- **File:** `e2e/tests/sports/standings.spec.ts`
- **POM:** `e2e/pages/standings.page.ts`
- **Tests:**
  - Standings page loads
  - Division standings display correctly
  - Win/loss records are shown
  - Playoff bracket displays (if applicable)

#### 3.6 Statistics/Leaders (`/account/[accountId]/statistics`)
- **File:** `e2e/tests/sports/statistics.spec.ts`
- **POM:** `e2e/pages/statistics.page.ts`
- **Tests:**
  - Statistics page loads
  - Leader categories display
  - Can switch between stat categories
  - Player names link to player profiles

#### 3.7 Player Profile (`/account/[accountId]/players/[playerId]/statistics`)
- **File:** `e2e/tests/sports/player-profile.spec.ts`
- **POM:** `e2e/pages/player-profile.page.ts`
- **Note:** Requires `E2E_PLAYER_ID` env var
- **Tests:**
  - Player profile loads
  - Career stats display
  - Season stats display
  - Player info section renders

### Priority 4: Community Features

#### 4.1 Social Hub (`/account/[accountId]/social-hub`)
- **File:** `e2e/tests/community/social-hub.spec.ts`
- **POM:** `e2e/pages/social-hub.page.ts`
- **Tests:**
  - Social hub home loads
  - Community tab loads messages
  - Posts tab loads content
  - Videos tab loads video grid
  - Member businesses tab loads directory

#### 4.2 Photo Gallery (`/account/[accountId]/photo-gallery/admin`)
- **File:** `e2e/tests/community/photo-gallery.spec.ts`
- **POM:** `e2e/pages/photo-gallery.page.ts`
- **Tests:**
  - Gallery admin page loads
  - Photo grid displays images
  - Can open upload dialog
  - Album management works

#### 4.3 Player Classifieds (`/account/[accountId]/player-classifieds`)
- **File:** `e2e/tests/community/player-classifieds.spec.ts`
- **POM:** `e2e/pages/player-classifieds.page.ts`
- **Tests:**
  - Classifieds page loads
  - Listings display with details
  - Filter/search works
  - Can create a new listing

#### 4.4 Hall of Fame (`/account/[accountId]/hall-of-fame`)
- **File:** `e2e/tests/community/hall-of-fame.spec.ts`
- **POM:** `e2e/pages/hall-of-fame.page.ts`
- **Tests:**
  - Hall of Fame page loads
  - Inductee cards display
  - Can navigate to manage view
  - Create inductee dialog opens

#### 4.5 Polls & Surveys
- **File:** `e2e/tests/community/polls-surveys.spec.ts`
- **Tests:**
  - Polls manage page loads (`/account/[accountId]/polls/manage`)
  - Surveys page loads (`/account/[accountId]/surveys`)
  - Survey manage page loads (`/account/[accountId]/surveys/manage`)
  - Can create a new poll/survey

### Priority 5: Workouts & Events

#### 5.1 Workouts (`/account/[accountId]/workouts`)
- **File:** `e2e/tests/account/workouts.spec.ts`
- **POM:** `e2e/pages/workouts.page.ts`
- **Tests:**
  - Workouts list loads
  - Workout detail page loads
  - Can create a new workout
  - Registration flow works

### Priority 6: Infrastructure Management

#### 6.1 Fields (`/account/[accountId]/fields`)
- **File:** `e2e/tests/account/fields.spec.ts`
- **Tests:**
  - Fields page loads
  - Field list displays
  - Can navigate to manage view
  - Can add/edit a field

#### 6.2 Umpires (`/account/[accountId]/umpires/manage`)
- **File:** `e2e/tests/account/umpires.spec.ts`
- **Tests:**
  - Umpire management page loads
  - Umpire list displays
  - Can add/edit an umpire

#### 6.3 Member Businesses (`/account/[accountId]/member-businesses/manage`)
- **File:** `e2e/tests/account/member-businesses.spec.ts`
- **Tests:**
  - Member businesses page loads
  - Business list displays
  - Can add/edit a business

### Priority 7: Golf-Specific Routes

Only applicable for golf-type accounts. Requires a golf account ID.

#### 7.1 Golf Courses (`/account/[accountId]/golf/courses`)
- **File:** `e2e/tests/golf/courses.spec.ts`
- **Tests:**
  - Course list loads
  - Course detail page loads
  - Scorecard displays correctly

#### 7.2 Golf Flights (`/account/[accountId]/seasons/[seasonId]/golf/flights`)
- **File:** `e2e/tests/golf/flights.spec.ts`
- **Tests:**
  - Flight management page loads
  - Flights list displays
  - Player assignments display

### Priority 8: Public Pages

#### 8.1 Account Discovery (`/accounts`)
- **File:** `e2e/tests/smoke/public-pages.spec.ts`
- **Tests:**
  - Landing page loads with featured organizations
  - Search functionality works
  - Organization cards display correctly
  - "View League" button navigates to account page

#### 8.2 Static Pages
- **File:** `e2e/tests/smoke/static-pages.spec.ts`
- **Tests:**
  - Contact page loads (`/contact`)
  - Privacy policy loads (`/privacy-policy`)
  - Terms of service loads (`/terms-of-service`)
  - Sign up page loads (`/signup`)
  - Reset password page loads (`/reset-password`)

### Priority 9: Global Admin

Requires Administrator role.

#### 9.1 Global Admin Dashboard (`/admin`)
- **File:** `e2e/tests/admin/global-admin.spec.ts`
- **Tests:**
  - Admin dashboard loads
  - Alerts management page loads (`/admin/alerts`)
  - Golf courses admin loads (`/admin/golf/courses`)

### Priority 10: User Profile

#### 10.1 Profile (`/profile`)
- **File:** `e2e/tests/account/profile.spec.ts`
- **Tests:**
  - Profile page loads
  - User info displays correctly
  - Can edit profile fields
  - Can update avatar

---

## Adding New Fixtures

When tests need additional dynamic IDs (seasonId, teamId, etc.), extend the fixtures:

**Update `e2e/fixtures/base-fixtures.ts`:**
```typescript
import { test as base } from '@playwright/test';

type DracoFixtures = {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
  playerId: string;
};

export const test = base.extend<DracoFixtures>({
  accountId: [process.env.E2E_ACCOUNT_ID || '', { option: true }],
  seasonId: [process.env.E2E_SEASON_ID || '', { option: true }],
  teamSeasonId: [process.env.E2E_TEAM_SEASON_ID || '', { option: true }],
  playerId: [process.env.E2E_PLAYER_ID || '', { option: true }],
});

export { expect } from '@playwright/test';
```

**Update `.env.e2e`:**
```
E2E_ADMIN_EMAIL=your-test-email@example.com
E2E_ADMIN_PASSWORD="your-password" <!-- pragma: allowlist secret -->
E2E_ACCOUNT_ID=1
E2E_SEASON_ID=
E2E_TEAM_SEASON_ID=
E2E_PLAYER_ID=
```

## Testing Dialogs

Many pages use MUI Dialog components. Pattern for testing them:

```typescript
test('can open and submit create dialog', async ({ page }) => {
  // Click the FAB or trigger button
  await page.getByRole('button', { name: 'add' }).click();

  // Wait for dialog to appear
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Fill form fields inside the dialog
  await dialog.getByLabel('Name').fill('Test Entry');
  await dialog.getByLabel('Description').fill('Test description');

  // Submit
  await dialog.getByRole('button', { name: 'Save' }).click();

  // Verify dialog closed and success feedback shown
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('alert')).toContainText('successfully');
});
```

## Testing DataGrids (MUI)

Many pages use MUI DataGrid. Pattern:

```typescript
test('displays data in the grid', async ({ page }) => {
  // Wait for grid to load (no loading spinner)
  await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 15_000 });

  // Check rows exist
  const rows = page.getByRole('row');
  await expect(rows).not.toHaveCount(0);

  // Check specific cell content
  await expect(page.getByRole('cell', { name: 'John Smith' })).toBeVisible();

  // Test sorting by clicking column header
  await page.getByRole('columnheader', { name: 'Name' }).click();
});
```

## Testing Permission Guards

Verify that permission-restricted pages show correct behavior:

```typescript
test.describe('Permission Guards', () => {
  test('admin can access settings', async ({ page, accountId }) => {
    await page.goto(`/account/${accountId}/settings`);
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('non-admin sees restriction message', async ({ browser, accountId }) => {
    // Create context with a non-admin user's stored auth
    // (requires a second auth setup for a limited user)
    const context = await browser.newContext({
      storageState: './e2e/.auth/member.json',
    });
    const page = await context.newPage();
    await page.goto(`/account/${accountId}/admin`);
    await expect(page.getByText(/permission|unauthorized/i)).toBeVisible();
    await context.close();
  });
});
```

## Testing Account Type Guards

Some pages are restricted to baseball or golf accounts:

```typescript
test('social media is baseball-only', async ({ page, accountId }) => {
  // If testing with a baseball account, this should load
  await page.goto(`/account/${accountId}/social-media`);
  await expect(
    page.getByRole('heading', { name: 'Social Media Management' })
  ).toBeVisible({ timeout: 15_000 });
});
```

## Common Pitfalls

1. **Duplicate buttons/links**: Scope with landmarks (`page.getByRole('main').getByRole(...)`)
2. **Loading states**: Always wait for content, never use hard `page.waitForTimeout()`
3. **Special characters in `.env.e2e`**: Quote values containing `#` or spaces
4. **Stale auth**: Delete `e2e/.auth/admin.json` and re-run if auth expires
5. **Port mismatch**: The frontend runs on the port defined in `.env.local` (currently 4001)
6. **Parallel test interference**: Tests that modify shared data should use `test.describe.serial()`
