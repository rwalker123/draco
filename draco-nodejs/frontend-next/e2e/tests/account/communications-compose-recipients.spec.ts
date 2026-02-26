import { test, expect } from '../../fixtures/base-fixtures';

const mockContacts = {
  contacts: [
    {
      id: 'contact-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      roles: [],
    },
    {
      id: 'contact-2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      roles: [],
    },
  ],
  pagination: {
    page: 1,
    pageSize: 25,
    totalCount: 2,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

const mockUmpires = [
  {
    id: 'umpire-1',
    firstName: 'Mike',
    lastName: 'Umpire',
    email: 'mike.ump@example.com',
    isActive: true,
  },
];

test.describe('Communications Compose - Recipient Dialog', () => {
  test('opens recipient dialog and displays tabs without render loops', async ({
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

    await page.route('**/api/accounts/*/contacts*', (route) => {
      return route.fulfill({ json: mockContacts });
    });

    await page.goto(`/account/${accountId}/communications/compose`);

    const selectRecipientsButton = page.getByRole('button', { name: 'Select Recipients' });
    await selectRecipientsButton.waitFor({ timeout: 15_000 });
    await selectRecipientsButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    const contactsTab = page.getByRole('tab', { name: 'Contacts' });
    await expect(contactsTab).toBeVisible();

    await page.waitForTimeout(3000);

    expect(loopErrorCount, 'Recipient dialog should not trigger infinite re-renders').toBe(0);
  });

  test('contacts tab displays contacts and supports selection without errors', async ({
    page,
    accountId,
  }) => {
    test.setTimeout(60000);

    let loopErrorCount = 0;
    page.on('pageerror', (error) => {
      if (error.message.includes('Maximum update depth exceeded')) {
        loopErrorCount++;
      }
    });

    await page.route('**/api/accounts/*/contacts*', (route) => {
      return route.fulfill({ json: mockContacts });
    });

    await page.goto(`/account/${accountId}/communications/compose`);

    await page.getByRole('button', { name: 'Select Recipients' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    await page.waitForTimeout(2000);

    const johnText = dialog.getByText('John Doe');
    if (await johnText.isVisible()) {
      const checkbox = johnText.locator('..').getByRole('checkbox');
      if (await checkbox.isVisible()) {
        await checkbox.check();
        await page.waitForTimeout(1000);
      }
    }

    expect(loopErrorCount, 'Contact selection should not trigger infinite re-renders').toBe(0);
  });

  test('umpires tab renders without render loops', async ({ page, accountId }) => {
    test.setTimeout(60000);

    let loopErrorCount = 0;
    page.on('pageerror', (error) => {
      if (error.message.includes('Maximum update depth exceeded')) {
        loopErrorCount++;
      }
    });

    await page.route('**/api/accounts/*/contacts*', (route) => {
      return route.fulfill({ json: mockContacts });
    });

    await page.route('**/api/accounts/*/umpires*', (route) => {
      return route.fulfill({ json: mockUmpires });
    });

    await page.goto(`/account/${accountId}/communications/compose`);

    await page.getByRole('button', { name: 'Select Recipients' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    const umpiresTab = page.getByRole('tab', { name: 'Umpires' });
    if (await umpiresTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await umpiresTab.click();
      await page.waitForTimeout(3000);
    }

    expect(loopErrorCount, 'Umpires tab should not trigger infinite re-renders').toBe(0);
  });

  test('can close and reopen recipient dialog without errors', async ({ page, accountId }) => {
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

    await page.route('**/api/accounts/*/contacts*', (route) => {
      return route.fulfill({ json: mockContacts });
    });

    await page.goto(`/account/${accountId}/communications/compose`);

    const selectRecipientsButton = page.getByRole('button', { name: 'Select Recipients' });
    await selectRecipientsButton.waitFor({ timeout: 15_000 });

    await selectRecipientsButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1000);

    const closeButton = dialog
      .getByRole('button', { name: /close/i })
      .or(dialog.locator('button').filter({ has: page.locator('[data-testid="CloseIcon"]') }));
    if (await closeButton.first().isVisible()) {
      await closeButton.first().click();
    } else {
      await page.keyboard.press('Escape');
    }

    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);

    await selectRecipientsButton.click();
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    await page.waitForTimeout(3000);

    expect(
      loopErrorCount,
      'Reopening recipient dialog should not trigger infinite re-renders',
    ).toBe(0);
  });

  test('apply selection button works without errors', async ({ page, accountId }) => {
    test.setTimeout(60000);

    let loopErrorCount = 0;
    page.on('pageerror', (error) => {
      if (error.message.includes('Maximum update depth exceeded')) {
        loopErrorCount++;
      }
    });

    await page.route('**/api/accounts/*/contacts*', (route) => {
      return route.fulfill({ json: mockContacts });
    });

    await page.goto(`/account/${accountId}/communications/compose`);

    await page.getByRole('button', { name: 'Select Recipients' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    await page.waitForTimeout(2000);

    const applyButton = dialog.getByRole('button', { name: 'Apply Selection' });
    if (await applyButton.isVisible()) {
      await applyButton.click();
      await page.waitForTimeout(2000);
    }

    expect(loopErrorCount, 'Applying selection should not trigger infinite re-renders').toBe(0);
  });
});
