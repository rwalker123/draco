import { test, expect } from '../../fixtures/base-fixtures';

test.describe('Player Classifieds', () => {
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
