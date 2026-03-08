import { test, expect } from '../../fixtures/base-fixtures';

test.describe('UmpireDeleteDialog - Notification State', () => {
  test('opening and closing umpire delete dialog multiple times works cleanly', async ({
    page,
    accountId,
  }) => {
    test.setTimeout(30000);

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

    await page.goto(`/account/${accountId}/umpires/manage`);
    await page.getByRole('heading', { name: 'Umpires', level: 1 }).waitFor({ timeout: 15000 });

    const deleteButton = page.getByRole('button', { name: /delete/i }).first();
    const hasUmpires = await deleteButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (!hasUmpires) {
      test.skip(true, 'No umpires available for delete dialog test');
      return;
    }

    for (let i = 0; i < 3; i++) {
      await deleteButton.click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor({ timeout: 5000 });
      await page.waitForTimeout(500);

      const cancelButton = dialog.getByRole('button', { name: /cancel/i });
      await cancelButton.click();
      await expect(dialog).not.toBeVisible();
      await page.waitForTimeout(300);
    }

    expect(loopErrorCount, 'Repeated open/close should not cause re-render loops').toBe(0);
  });

  test('stale error snackbar does not persist after closing and reopening delete dialog', async ({
    page,
    accountId,
  }) => {
    test.setTimeout(45000);

    await page.goto(`/account/${accountId}/umpires/manage`);
    await page.getByRole('heading', { name: 'Umpires', level: 1 }).waitFor({ timeout: 15000 });

    const deleteButton = page.getByRole('button', { name: /delete/i }).first();
    const hasUmpires = await deleteButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (!hasUmpires) {
      test.skip(true, 'No umpires available for delete dialog test');
      return;
    }

    await page.route('**/api/accounts/*/umpires/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 500,
          json: { error: 'Simulated server error' },
        });
      }
      return route.continue();
    });

    await deleteButton.click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ timeout: 5000 });

    const confirmButton = dialog.getByRole('button', { name: /delete umpire/i });
    await confirmButton.click();
    await page.waitForTimeout(2000);

    const errorAlert = page.locator('.MuiAlert-filledError');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });

    const cancelButton = dialog.getByRole('button', { name: /cancel/i });
    await cancelButton.click();
    await page.waitForTimeout(500);

    const snackbarStillVisible = await errorAlert.isVisible().catch(() => false);

    expect(snackbarStillVisible, 'Error snackbar should be dismissed when dialog closes').toBe(
      false,
    );
  });
});
