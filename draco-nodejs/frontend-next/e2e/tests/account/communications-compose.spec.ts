import { test, expect } from '../../fixtures/base-fixtures';

test.describe('Communications Compose', () => {
  test('does not infinite-loop leagues API calls', async ({ page, accountId }) => {
    let leaguesCallCount = 0;

    await page.route('**/api/accounts/*/seasons/*/leagues*', (route) => {
      leaguesCallCount++;
      return route.continue();
    });

    await page.goto(`/account/${accountId}/communications/compose`);

    await page.waitForTimeout(3000);

    expect(leaguesCallCount).toBeLessThanOrEqual(10);
  });
});
