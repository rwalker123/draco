import { test, expect } from '../../fixtures/base-fixtures';

test.describe('Golf League Account Home', () => {
  test('does not infinite-loop golf matches API calls', async ({ page }) => {
    let matchesCallCount = 0;

    await page.route('**/api/accounts/*/golf/matches/season/*', (route) => {
      matchesCallCount++;
      return route.continue();
    });

    await page.goto('/account/28/home');

    await page.waitForTimeout(3000);

    expect(matchesCallCount).toBeLessThanOrEqual(10);
  });
});
