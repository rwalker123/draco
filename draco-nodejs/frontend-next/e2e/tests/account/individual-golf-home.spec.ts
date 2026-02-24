import { test, expect } from '../../fixtures/base-fixtures';

test.describe('Individual Golf Account Home', () => {
  test('does not infinite-loop golfer scores API calls', async ({ page }) => {
    let scoresCallCount = 0;

    await page.route('**/api/accounts/*/golfer/scores*', (route) => {
      scoresCallCount++;
      return route.continue();
    });

    await page.goto('/account/22/home');

    await page.waitForTimeout(3000);

    expect(scoresCallCount).toBeLessThanOrEqual(10);
  });
});
