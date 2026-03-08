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

  test('team entries are displayed', async ({ page }) => {
    const teamButtons = page.getByRole('main').getByRole('button');
    const teamLinks = page.getByRole('main').getByRole('link');
    const hasButtons = await teamButtons
      .first()
      .isVisible({ timeout: 15_000 })
      .catch(() => false);
    const hasLinks = await teamLinks
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    expect(hasButtons || hasLinks).toBe(true);
  });
});
