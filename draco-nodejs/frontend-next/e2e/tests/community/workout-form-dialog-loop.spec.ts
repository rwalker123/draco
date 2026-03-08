import { test, expect } from '../../fixtures/base-fixtures';

const mockFields = {
  fields: [{ id: 'field-1', name: 'Test Field', shortName: 'TF' }],
};

test.describe('WorkoutFormDialog - Infinite Loop Check', () => {
  test('opening create workout dialog does not trigger Maximum update depth exceeded', async ({
    page,
    accountId,
  }) => {
    test.setTimeout(30000);

    let loopErrorCount = 0;
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        if (text.includes('Maximum update depth exceeded')) {
          loopErrorCount++;
        }
      }
    });
    page.on('pageerror', (error) => {
      if (error.message.includes('Maximum update depth exceeded')) {
        loopErrorCount++;
      }
    });

    await page.route('**/api/accounts/*/fields*', (route) => {
      return route.fulfill({ json: mockFields });
    });

    await page.goto(`/account/${accountId}/workouts`);
    await page
      .getByRole('heading', { name: 'Workouts Management', level: 1 })
      .waitFor({ timeout: 15000 });

    await page.getByRole('button', { name: /create workout/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ timeout: 5000 });

    await page.waitForTimeout(3000);

    expect(loopErrorCount, 'WorkoutFormDialog should not cause infinite re-renders').toBe(0);

    await expect(dialog).toBeVisible();
  });

  test('opening and closing workout dialog multiple times does not trigger infinite loop', async ({
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

    await page.route('**/api/accounts/*/fields*', (route) => {
      return route.fulfill({ json: mockFields });
    });

    await page.goto(`/account/${accountId}/workouts`);
    await page
      .getByRole('heading', { name: 'Workouts Management', level: 1 })
      .waitFor({ timeout: 15000 });

    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /create workout/i }).click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor({ timeout: 5000 });
      await page.waitForTimeout(1000);

      const cancelButton = dialog.getByRole('button', { name: /cancel/i });
      await cancelButton.click();
      await expect(dialog).not.toBeVisible();
      await page.waitForTimeout(500);
    }

    expect(loopErrorCount, 'Repeated open/close should not cause infinite re-renders').toBe(0);
  });
});
