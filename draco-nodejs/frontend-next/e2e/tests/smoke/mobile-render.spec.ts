import { test, expect } from '../../fixtures/base-fixtures';

test.use({ viewport: { width: 412, height: 915 } });

test.describe('Mobile rendering', () => {
  test('should not trigger infinite re-render loop on small screens', async ({
    page,
    accountId,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Maximum update depth exceeded')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`/account/${accountId}`);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(
      consoleErrors,
      'Expected no "Maximum update depth exceeded" console errors',
    ).toHaveLength(0);
  });
});
