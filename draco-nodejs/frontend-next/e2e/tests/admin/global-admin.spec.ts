import { test, expect } from '@playwright/test';

test.describe('Global Admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('heading').first().waitFor({ timeout: 15_000 });
    if (await page.getByRole('heading', { name: 'Access Denied' }).isVisible()) {
      test.skip(true, 'Test user does not have Administrator role');
    }
  });

  test.describe('Admin Dashboard', () => {
    test('admin dashboard loads with heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Administrator Analytics' })).toBeVisible();
    });

    test('displays platform snapshot section', async ({ page }) => {
      await expect(page.getByText('Platform Snapshot')).toBeVisible();
    });

    test('displays metric cards', async ({ page }) => {
      await expect(page.getByText('Total accounts')).toBeVisible();
      await expect(page.getByText('Emails processed')).toBeVisible();
    });
  });

  test.describe('Alert Management', () => {
    test('alerts management page loads with heading', async ({ page }) => {
      await page.goto('/admin/alerts');
      await expect(page.getByRole('heading', { name: 'Alert Management' })).toBeVisible({
        timeout: 15_000,
      });
    });

    test('displays create alert FAB', async ({ page }) => {
      await page.goto('/admin/alerts');
      await expect(page.getByRole('button', { name: 'Create alert' })).toBeVisible({
        timeout: 15_000,
      });
    });
  });

  test.describe('Golf Course Management', () => {
    test('golf course management page loads with heading', async ({ page }) => {
      await page.goto('/admin/golf/courses');
      await expect(page.getByRole('heading', { name: 'Golf Course Management' })).toBeVisible({
        timeout: 15_000,
      });
    });

    test('displays create course FAB', async ({ page }) => {
      await page.goto('/admin/golf/courses');
      await expect(page.getByRole('button', { name: 'Create course' })).toBeVisible({
        timeout: 15_000,
      });
    });

    test('displays search bar', async ({ page }) => {
      await page.goto('/admin/golf/courses');
      await expect(page.getByPlaceholder('Search by name, city, or state...')).toBeVisible({
        timeout: 15_000,
      });
    });
  });
});
