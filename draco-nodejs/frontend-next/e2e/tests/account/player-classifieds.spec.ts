import { test, expect } from '../../fixtures/base-fixtures';
import { PlayerClassifiedsPage } from '../../pages/player-classifieds.page';

test.describe('Player Classifieds', () => {
  let classifiedsPage: PlayerClassifiedsPage;

  test.beforeEach(async ({ page, accountId }) => {
    classifiedsPage = new PlayerClassifiedsPage(page);
    await classifiedsPage.goto(accountId);
  });

  test('page loads with heading', async () => {
    await expect(classifiedsPage.heading).toBeVisible();
  });

  test('players wanted tab is visible', async () => {
    await expect(classifiedsPage.playersWantedTab).toBeVisible();
  });

  test('teams wanted tab is visible', async () => {
    await expect(classifiedsPage.teamsWantedTab).toBeVisible();
  });

  test('can switch between players wanted and teams wanted tabs', async () => {
    await classifiedsPage.switchToTeamsWanted();
    await expect(classifiedsPage.teamsWantedTab).toHaveAttribute('aria-selected', 'true');

    await classifiedsPage.switchToPlayersWanted();
    await expect(classifiedsPage.playersWantedTab).toHaveAttribute('aria-selected', 'true');
  });

  test('does not infinite-loop teams-wanted API calls', async ({ page, accountId }) => {
    let teamsWantedCallCount = 0;

    await page.route('**/api/accounts/*/player-classifieds/teams-wanted*', (route) => {
      teamsWantedCallCount++;
      return route.continue();
    });

    await page.goto(`/account/${accountId}/player-classifieds`);

    const teamsWantedTab = page.getByRole('tab', { name: 'Teams Wanted' });
    await teamsWantedTab.click();

    await page.waitForTimeout(3000);

    expect(teamsWantedCallCount).toBeLessThanOrEqual(10);
  });
});
