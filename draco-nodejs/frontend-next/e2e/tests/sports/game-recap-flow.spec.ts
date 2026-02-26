import { test, expect } from '../../fixtures/base-fixtures';

test.describe('Game Recap Flow - Page Stability', () => {
  test('schedule page loads without Maximum update depth exceeded', async ({ page, accountId }) => {
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

    await page.goto(`/account/${accountId}/schedule`);

    const heading = page.getByRole('heading', { name: /schedule/i });
    await heading.waitFor({ timeout: 15_000 });

    await page.waitForTimeout(3000);

    expect(loopErrorCount, 'Schedule page load should not trigger infinite re-renders').toBe(0);
  });

  test('schedule management page loads without Maximum update depth exceeded', async ({
    page,
    accountId,
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

    await page.goto(`/account/${accountId}/schedule-management`);

    const heading = page.getByRole('heading', { name: 'Schedule Management', exact: true });
    await heading.waitFor({ timeout: 15_000 });

    await page.waitForTimeout(3000);

    expect(
      loopErrorCount,
      'Schedule management page load should not trigger infinite re-renders',
    ).toBe(0);
  });

  test('opening game recap dialog does not trigger infinite re-renders', async ({
    page,
    accountId,
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

    await page.goto(`/account/${accountId}/schedule`);

    const heading = page.getByRole('heading', { name: /schedule/i });
    await heading.waitFor({ timeout: 15_000 });

    const recapButton = page.getByRole('button', { name: /view game summary/i }).first();
    const hasRecapButton = await recapButton.isVisible().catch(() => false);

    if (!hasRecapButton) {
      test.skip(true, 'No completed games with recaps found — skipping recap dialog test');
      return;
    }

    await recapButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    await page.waitForTimeout(3000);

    expect(loopErrorCount, 'Opening game recap dialog should not trigger infinite re-renders').toBe(
      0,
    );

    const closeButton = dialog.getByRole('button', { name: /close/i });
    await closeButton.click();
    await expect(dialog).not.toBeVisible();

    await page.waitForTimeout(2000);

    expect(loopErrorCount, 'Closing game recap dialog should not trigger infinite re-renders').toBe(
      0,
    );
  });

  test('navigating schedule periods does not trigger infinite re-renders', async ({
    page,
    accountId,
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

    await page.goto(`/account/${accountId}/schedule`);

    const heading = page.getByRole('heading', { name: /schedule/i });
    await heading.waitFor({ timeout: 15_000 });

    const nextButton = page.getByRole('button', { name: /next/i });
    const hasNextButton = await nextButton.isVisible().catch(() => false);

    if (hasNextButton) {
      await nextButton.click();
      await page.waitForTimeout(2000);

      expect(
        loopErrorCount,
        'Navigating to next period should not trigger infinite re-renders',
      ).toBe(0);

      const prevButton = page.getByRole('button', { name: /prev/i });
      const hasPrevButton = await prevButton.isVisible().catch(() => false);
      if (hasPrevButton) {
        await prevButton.click();
        await page.waitForTimeout(2000);
      }
    }

    expect(loopErrorCount, 'Schedule navigation should not trigger infinite re-renders').toBe(0);
  });
});
