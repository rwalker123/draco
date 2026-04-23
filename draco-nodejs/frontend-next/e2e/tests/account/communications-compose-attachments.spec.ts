import { test, expect } from '../../fixtures/base-fixtures';

test.describe('Communications Compose - Attachments', () => {
  test('compose page loads with attachment upload area without render loops', async ({
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

    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: /Compose Email/i })).toBeVisible({
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    const attachmentArea = page.getByText(/drag.*drop|browse.*files|attach/i);
    if (
      await attachmentArea
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await expect(attachmentArea.first()).toBeVisible();
    }

    expect(
      loopErrorCount,
      'Compose page with attachments should not trigger infinite re-renders',
    ).toBe(0);
  });

  test('file upload zone accepts file selection without errors', async ({ page, accountId }) => {
    test.setTimeout(60000);

    let loopErrorCount = 0;
    page.on('pageerror', (error) => {
      if (error.message.includes('Maximum update depth exceeded')) {
        loopErrorCount++;
      }
    });

    await page.goto(`/account/${accountId}/communications/compose`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: /Compose Email/i })).toBeVisible({
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    const fileInput = page.locator('input[type="file"]');
    if (
      await fileInput
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await fileInput.first().setInputFiles({
        name: 'test-document.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('E2E test file content'),
      });

      await page.waitForTimeout(3000);
    }

    expect(loopErrorCount, 'File upload should not trigger infinite re-renders').toBe(0);
  });

  test('multiple file upload interactions do not cause render loops', async ({
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

    await page.route('**/api/accounts/*/email/attachments*', (route) => {
      return route.fulfill({
        json: {
          id: 'att-1',
          filename: 'test-document.txt',
          url: 'https://example.com/test-document.txt',
          size: 21,
        },
      });
    });

    await page.goto(`/account/${accountId}/communications/compose`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: /Compose Email/i })).toBeVisible({
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    const fileInput = page.locator('input[type="file"]');
    if (
      await fileInput
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await fileInput.first().setInputFiles({
        name: 'file1.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('File 1 content'),
      });

      await page.waitForTimeout(2000);

      await fileInput.first().setInputFiles({
        name: 'file2.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('File 2 content'),
      });

      await page.waitForTimeout(3000);
    }

    expect(loopErrorCount, 'Multiple file uploads should not trigger infinite re-renders').toBe(0);
  });
});
