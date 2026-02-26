import { test, expect } from '../../fixtures/base-fixtures';
import { GolfTeamsPage, GolfTeamDetailPage } from '../../pages/golf-teams.page';

const GOLF_ACCOUNT_ID = process.env.E2E_GOLF_ACCOUNT_ID || '';
const GOLF_SEASON_ID = process.env.E2E_GOLF_SEASON_ID || '';
const GOLF_TEAM_SEASON_ID = process.env.E2E_GOLF_TEAM_SEASON_ID || '';

test.describe('Golf Teams', () => {
  test.skip(
    !GOLF_ACCOUNT_ID || !GOLF_SEASON_ID,
    'E2E_GOLF_ACCOUNT_ID and E2E_GOLF_SEASON_ID not configured',
  );

  let golfTeamsPage: GolfTeamsPage;

  test.beforeEach(async ({ page }) => {
    golfTeamsPage = new GolfTeamsPage(page);
    await golfTeamsPage.goto(GOLF_ACCOUNT_ID, GOLF_SEASON_ID);
  });

  test('golf teams page loads with heading visible', async () => {
    await expect(golfTeamsPage.heading).toBeVisible();
  });

  test('flight selector is visible', async () => {
    await expect(golfTeamsPage.flightSelector).toBeVisible();
  });

  test('back to flights button is visible', async () => {
    await expect(golfTeamsPage.backButton).toBeVisible();
  });

  test('can navigate to team detail page', async ({ page }) => {
    const viewButtons = page.getByRole('button', { name: /view team/i });
    const count = await viewButtons.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await viewButtons.first().click();
    await expect(page).not.toHaveURL(
      `/account/${GOLF_ACCOUNT_ID}/seasons/${GOLF_SEASON_ID}/golf/teams`,
      { timeout: 15_000 },
    );
  });
});

test.describe('Golf Teams - Create Team Dialog', () => {
  test.skip(
    !GOLF_ACCOUNT_ID || !GOLF_SEASON_ID,
    'E2E_GOLF_ACCOUNT_ID and E2E_GOLF_SEASON_ID not configured',
  );

  let golfTeamsPage: GolfTeamsPage;

  test.beforeEach(async ({ page }) => {
    golfTeamsPage = new GolfTeamsPage(page);
    await golfTeamsPage.goto(GOLF_ACCOUNT_ID, GOLF_SEASON_ID);
  });

  test('can open create team dialog when flight is selected', async ({ page }) => {
    await golfTeamsPage.flightSelector.click();
    const options = page.getByRole('option');
    const optionCount = await options.count();
    if (optionCount <= 1) {
      await page.keyboard.press('Escape');
      test.skip();
      return;
    }
    await options.nth(1).click();
    await expect(golfTeamsPage.addTeamFab).toBeVisible({ timeout: 5_000 });
    await golfTeamsPage.openCreateTeamDialog();
    await expect(golfTeamsPage.dialog).toBeVisible();
  });
});

test.describe('Golf Team Detail', () => {
  test.skip(
    !GOLF_ACCOUNT_ID || !GOLF_SEASON_ID || !GOLF_TEAM_SEASON_ID,
    'E2E_GOLF_ACCOUNT_ID, E2E_GOLF_SEASON_ID, and E2E_GOLF_TEAM_SEASON_ID not configured',
  );

  let teamDetailPage: GolfTeamDetailPage;

  test.beforeEach(async ({ page }) => {
    teamDetailPage = new GolfTeamDetailPage(page);
    await teamDetailPage.goto(GOLF_ACCOUNT_ID, GOLF_SEASON_ID, GOLF_TEAM_SEASON_ID);
  });

  test('team detail page loads with heading visible', async () => {
    await expect(teamDetailPage.heading).toBeVisible();
  });

  test('back to flights button is visible on detail page', async () => {
    await expect(teamDetailPage.backButton).toBeVisible();
  });

  test('can open add player menu', async () => {
    await expect(teamDetailPage.addPlayerFab).toBeVisible();
    await teamDetailPage.openAddPlayerMenu();
    const signMenuItem = teamDetailPage.page.getByRole('menuitem', {
      name: /sign existing player/i,
    });
    const createMenuItem = teamDetailPage.page.getByRole('menuitem', {
      name: /create new player/i,
    });
    await expect(signMenuItem).toBeVisible();
    await expect(createMenuItem).toBeVisible();
  });

  test('can open create player dialog', async () => {
    await teamDetailPage.openAddPlayerMenu();
    await teamDetailPage.clickCreateNewPlayer();
    await expect(teamDetailPage.dialog).toBeVisible();
  });

  test('can open sign player dialog', async () => {
    await teamDetailPage.openAddPlayerMenu();
    await teamDetailPage.clickSignExistingPlayer();
    await expect(teamDetailPage.dialog).toBeVisible();
  });
});
