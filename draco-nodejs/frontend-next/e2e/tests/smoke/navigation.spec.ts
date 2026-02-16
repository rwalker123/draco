import { test, expect } from '../../fixtures/base-fixtures';

test.describe('Authenticated Navigation', () => {
  test('can access account page', async ({ page, accountId }) => {
    await page.goto(`/account/${accountId}`);
    await expect(page).toHaveURL(new RegExp(`/account/${accountId}`));
  });

  test('can navigate to social media page', async ({ page, accountId }) => {
    await page.goto(`/account/${accountId}/social-media`);
    await expect(page.getByRole('heading', { name: 'Social Media Management' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('can navigate to settings page', async ({ page, accountId }) => {
    await page.goto(`/account/${accountId}/settings`);
    await expect(page).toHaveURL(new RegExp(`/account/${accountId}/settings`));
  });

  test('can navigate to users page', async ({ page, accountId }) => {
    await page.goto(`/account/${accountId}/users`);
    await expect(page).toHaveURL(new RegExp(`/account/${accountId}/users`));
  });

  test('redirects unauthenticated users to login', async ({ browser, accountId }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto(`/account/${accountId}/settings`);
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await context.close();
  });
});
