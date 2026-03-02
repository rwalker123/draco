import { test, expect } from '@playwright/test';

test.describe('Account Discovery', () => {
  test('accounts page loads', async ({ page }) => {
    await page.goto('/accounts');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15_000 });
  });

  test('displays What We Offer section', async ({ page }) => {
    await page.goto('/accounts');
    await expect(page.getByRole('heading', { name: 'What We Offer' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('displays organization search section', async ({ page }) => {
    await page.goto('/accounts');
    const searchSection = page.locator('#organization-search');
    await expect(searchSection).toBeVisible({ timeout: 15_000 });
  });

  test('organization search section has heading', async ({ page }) => {
    await page.goto('/accounts');
    await expect(page.getByRole('heading', { name: /Organizations/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
