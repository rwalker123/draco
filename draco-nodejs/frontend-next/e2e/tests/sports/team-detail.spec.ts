import { test, expect } from '../../fixtures/base-fixtures';
import { TeamDetailPage } from '../../pages/team-detail.page';

test.describe('Team Detail', () => {
  test.beforeEach(({ seasonId, teamSeasonId }, testInfo) => {
    if (!seasonId || !teamSeasonId) {
      testInfo.skip(true, 'E2E_SEASON_ID or E2E_TEAM_SEASON_ID not set');
    }
  });

  let teamDetailPage: TeamDetailPage;

  test.beforeEach(async ({ page, accountId, seasonId, teamSeasonId }) => {
    if (!seasonId || !teamSeasonId) return;
    teamDetailPage = new TeamDetailPage(page);
    await teamDetailPage.goto(accountId, seasonId, teamSeasonId);
  });

  test('team detail page loads', async () => {
    await expect(teamDetailPage.mainContent).toBeVisible();
  });

  test('displays team name heading', async ({ page }) => {
    const headings = page.getByRole('heading', { level: 4 });
    await expect(headings.first()).toBeVisible();
  });

  test('displays roster widget', async ({ page }) => {
    await expect(page.getByText(/roster/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
