import { test, expect } from '../../fixtures/base-fixtures';

test.describe('Communications Compose - Page Stability', () => {
  test('compose page loads without Maximum update depth exceeded', async ({ page, accountId }) => {
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

    await page.goto(`/account/${accountId}/communications/compose`);

    const subjectInput = page.getByRole('textbox', { name: /subject/i });
    await subjectInput.waitFor({ timeout: 15_000 });

    await page.waitForTimeout(3000);

    expect(loopErrorCount, 'Compose page load should not trigger infinite re-renders').toBe(0);
  });

  test('subject editing does not trigger infinite re-renders', async ({ page, accountId }) => {
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

    await page.goto(`/account/${accountId}/communications/compose`);

    const subjectInput = page.getByRole('textbox', { name: /subject/i });
    await subjectInput.waitFor({ timeout: 15_000 });

    await subjectInput.fill('E2E Test Subject');

    await page.waitForTimeout(3000);

    expect(loopErrorCount, 'Subject editing should not trigger infinite re-renders').toBe(0);
    await expect(subjectInput).toHaveValue('E2E Test Subject');
  });

  test('recipient dialog interaction does not trigger infinite re-renders', async ({
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

    await page.goto(`/account/${accountId}/communications/compose`);

    const recipientButton = page.getByRole('button', { name: 'Select Recipients' });
    await recipientButton.waitFor({ timeout: 15_000 });
    await recipientButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(3000);

    expect(loopErrorCount, 'Recipient dialog should not trigger infinite re-renders').toBe(0);

    const closeButton = dialog.getByRole('button', { name: /close|cancel/i }).first();
    const hasCloseButton = await closeButton.isVisible().catch(() => false);
    if (hasCloseButton) {
      await closeButton.click();
    } else {
      await page.keyboard.press('Escape');
    }

    await page.waitForTimeout(2000);

    expect(loopErrorCount, 'Closing recipient dialog should not trigger infinite re-renders').toBe(
      0,
    );
  });

  test('rich text editor interaction does not trigger infinite re-renders', async ({
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

    await page.goto(`/account/${accountId}/communications/compose`);

    const subjectInput = page.getByRole('textbox', { name: /subject/i });
    await subjectInput.waitFor({ timeout: 15_000 });

    const editorArea = page.locator('[contenteditable="true"]').first();
    await editorArea.waitFor({ timeout: 10_000 });
    await editorArea.click();
    await editorArea.pressSequentially('Test email content for stability check');

    await page.waitForTimeout(3000);

    expect(
      loopErrorCount,
      'Rich text editor interaction should not trigger infinite re-renders',
    ).toBe(0);
  });
});
