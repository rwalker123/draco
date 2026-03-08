import { test, expect } from '../../fixtures/base-fixtures';
import { StandingsPage } from '../../pages/standings.page';

test.describe('Standings', () => {
  test.beforeEach(({ seasonId }, testInfo) => {
    if (!seasonId) {
      testInfo.skip(true, 'E2E_SEASON_ID not set');
    }
  });

  let standingsPage: StandingsPage;

  test.beforeEach(async ({ page, accountId, seasonId }) => {
    if (!seasonId) return;
    standingsPage = new StandingsPage(page);
    await standingsPage.goto(accountId, seasonId);
  });

  test('standings page loads with heading', async () => {
    await expect(standingsPage.heading).toBeVisible();
  });

  test('displays standings table or empty message', async ({ page }) => {
    const hasTable = await standingsPage.standingsTable.isVisible().catch(() => false);
    const hasEmpty = await page
      .getByText(/no standings available/i)
      .isVisible()
      .catch(() => false);
    expect(hasTable || hasEmpty).toBe(true);
  });

  test('standings table contains expected columns when data exists', async ({ page }) => {
    const hasTable = await standingsPage.standingsTable.isVisible().catch(() => false);
    if (!hasTable) {
      test.skip(true, 'No standings data for this season');
      return;
    }
    await expect(page.getByRole('columnheader', { name: 'Team' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'W' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'L' })).toBeVisible();
  });

  test('team names are links when data exists', async () => {
    const hasTable = await standingsPage.standingsTable.isVisible().catch(() => false);
    if (!hasTable) {
      test.skip(true, 'No standings data for this season');
      return;
    }
    const teamLinks = standingsPage.standingsTable.getByRole('link');
    await expect(teamLinks.first()).toBeVisible();
  });
});
