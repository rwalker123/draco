import { test, expect } from '../../fixtures/base-fixtures';

test.describe('WorkoutSourcesDialog - Infinite Loop Check', () => {
  test('opening Manage Where Heard dialog does not trigger Maximum update depth exceeded', async ({
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

    await page.goto(`/account/${accountId}/workouts`);
    await page
      .getByRole('heading', { name: 'Workouts Management', level: 1 })
      .waitFor({ timeout: 15000 });

    await page.getByRole('button', { name: /manage where heard/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ timeout: 5000 });

    await expect(dialog.getByText('Manage Where Heard Options')).toBeVisible();

    await page.waitForTimeout(3000);

    expect(loopErrorCount, 'WorkoutSourcesDialog should not cause infinite re-renders').toBe(0);

    await expect(dialog).toBeVisible();
  });

  test('opening and closing sources dialog multiple times does not trigger infinite loop', async ({
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

    await page.goto(`/account/${accountId}/workouts`);
    await page
      .getByRole('heading', { name: 'Workouts Management', level: 1 })
      .waitFor({ timeout: 15000 });

    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /manage where heard/i }).click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor({ timeout: 5000 });
      await page.waitForTimeout(1000);

      const closeButton = dialog.getByRole('button', { name: /close/i });
      await closeButton.click();
      await expect(dialog).not.toBeVisible();
      await page.waitForTimeout(500);
    }

    expect(loopErrorCount, 'Repeated open/close should not cause infinite re-renders').toBe(0);
  });

  test('sources dialog does not repeatedly refetch while open', async ({ page, accountId }) => {
    test.setTimeout(30000);

    let fetchCount = 0;
    const mockSources = { options: ['Website', 'Friend', 'Social Media'] };

    await page.route('**/api/accounts/*/workouts/sources*', (route) => {
      fetchCount++;
      return route.fulfill({ json: mockSources });
    });

    await page.goto(`/account/${accountId}/workouts`);
    await page
      .getByRole('heading', { name: 'Workouts Management', level: 1 })
      .waitFor({ timeout: 15000 });

    await page.getByRole('button', { name: /manage where heard/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ timeout: 5000 });

    const initialFetchCount = fetchCount;

    await page.waitForTimeout(3000);

    expect(
      fetchCount - initialFetchCount,
      'Sources should not be repeatedly refetched while dialog is open',
    ).toBeLessThanOrEqual(1);
  });
});
