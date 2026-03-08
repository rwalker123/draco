import { test, expect } from '../../fixtures/base-fixtures';
import { UrlManagementPage } from '../../pages/url-management.page';

test.describe('AddAccountUrlDialog - Notification State', () => {
  let urlPage: UrlManagementPage;

  test.beforeEach(async ({ page, accountId }) => {
    urlPage = new UrlManagementPage(page);
    await urlPage.goto(accountId);
    await urlPage.navigateToUrlsTab();
  });

  async function openAddUrlDialog(urlPage: UrlManagementPage) {
    const hasFab = await urlPage.addUrlButton.isVisible().catch(() => false);
    if (hasFab) {
      await urlPage.addUrlButton.click();
    } else {
      await urlPage.addFirstUrlButton.click();
    }
    await urlPage.addUrlDialogTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  test('opening add URL dialog does not trigger Maximum update depth exceeded', async ({
    page,
  }) => {
    test.setTimeout(45000);

    let loopErrorCount = 0;

    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Maximum update depth exceeded')) {
        loopErrorCount++;
      }
    });
    page.on('pageerror', (error) => {
      if (error.message.includes('Maximum update depth exceeded')) {
        loopErrorCount++;
      }
    });

    await openAddUrlDialog(urlPage);

    await page.waitForTimeout(3000);

    expect(loopErrorCount, 'AddAccountUrlDialog should not cause infinite re-renders').toBe(0);

    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('opening and closing add URL dialog multiple times does not trigger infinite loop', async ({
    page,
  }) => {
    test.setTimeout(60000);

    let loopErrorCount = 0;

    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Maximum update depth exceeded')) {
        loopErrorCount++;
      }
    });
    page.on('pageerror', (error) => {
      if (error.message.includes('Maximum update depth exceeded')) {
        loopErrorCount++;
      }
    });

    for (let i = 0; i < 3; i++) {
      await openAddUrlDialog(urlPage);
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'Cancel' }).click();
      await urlPage.addUrlDialogTitle.waitFor({ state: 'hidden', timeout: 10000 });
      await page.waitForTimeout(500);
    }

    expect(loopErrorCount, 'Repeated open/close should not cause infinite re-renders').toBe(0);
  });

  test('validation error snackbar does not persist after closing and reopening dialog', async ({
    page,
  }) => {
    test.setTimeout(45000);

    await openAddUrlDialog(urlPage);

    await page.getByRole('button', { name: 'Add URL' }).click();

    const snackbar = page.getByRole('alert').filter({ hasText: /domain|url|required/i });
    await snackbar.waitFor({ state: 'visible', timeout: 5000 });

    await page.getByRole('button', { name: 'Cancel' }).click();
    await urlPage.addUrlDialogTitle.waitFor({ state: 'hidden', timeout: 10000 });

    await openAddUrlDialog(urlPage);

    const staleSnackbar = page.getByRole('alert').filter({ hasText: /domain|url|required/i });
    await expect(staleSnackbar).not.toBeVisible({ timeout: 3000 });

    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('stale API error snackbar does not persist after closing and reopening dialog', async ({
    page,
  }) => {
    test.setTimeout(45000);

    await page.route('**/api/accounts/*/urls', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Simulated server error' }),
        });
      } else {
        await route.continue();
      }
    });

    await openAddUrlDialog(urlPage);

    await page.getByRole('textbox', { name: 'Domain' }).fill('test-error.example.com');
    await page.getByRole('button', { name: 'Add URL' }).click();

    const errorSnackbar = page.locator('.MuiAlert-filledError');
    await errorSnackbar.waitFor({ state: 'visible', timeout: 10000 });

    await page.getByRole('button', { name: 'Cancel' }).click();
    await urlPage.addUrlDialogTitle.waitFor({ state: 'hidden', timeout: 10000 });

    await page.unroute('**/api/accounts/*/urls');

    await openAddUrlDialog(urlPage);

    const staleError = page.locator('.MuiAlert-filledError');
    await expect(staleError).not.toBeVisible({ timeout: 3000 });

    await page.getByRole('button', { name: 'Cancel' }).click();
  });
});
