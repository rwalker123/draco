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

  test('displays standings table', async () => {
    await expect(standingsPage.standingsTable).toBeVisible();
  });

  test('standings table contains expected columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Team' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'W' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'L' })).toBeVisible();
  });

  test('team names are links', async () => {
    const teamLinks = standingsPage.standingsTable.getByRole('link');
    await expect(teamLinks.first()).toBeVisible();
  });
});
