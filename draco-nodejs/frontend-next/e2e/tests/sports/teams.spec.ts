import { test, expect } from '../../fixtures/base-fixtures';
import { TeamsPage } from '../../pages/teams.page';

test.describe('Teams', () => {
  test.beforeEach(({ seasonId }, testInfo) => {
    if (!seasonId) {
      testInfo.skip(true, 'E2E_SEASON_ID not set');
    }
  });

  let teamsPage: TeamsPage;

  test.beforeEach(async ({ page, accountId, seasonId }) => {
    if (!seasonId) return;
    teamsPage = new TeamsPage(page);
    await teamsPage.goto(accountId, seasonId);
  });

  test('teams page loads with heading', async () => {
    await expect(teamsPage.heading).toBeVisible();
  });

  test('main content area is visible', async () => {
    await expect(teamsPage.mainContent).toBeVisible();
  });

  test('team links are displayed', async ({ page }) => {
    const teamLinks = page.getByRole('main').getByRole('link');
    await expect(teamLinks.first()).toBeVisible({ timeout: 15_000 });
  });
});
