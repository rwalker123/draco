import { test, expect } from '../../fixtures/base-fixtures';
import { UserManagementPage } from '../../pages/user-management.page';

test.describe('User Management', () => {
  let userPage: UserManagementPage;

  test.beforeEach(async ({ page, accountId }) => {
    userPage = new UserManagementPage(page);
    await userPage.goto(accountId);
  });

  test('loads the user management page without render loops', async ({ page }) => {
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

    await expect(userPage.searchInput).toBeVisible({ timeout: 15_000 });

    await page.waitForTimeout(3000);

    expect(
      loopErrorCount,
      'User management page should not trigger infinite re-renders after memo removal',
    ).toBe(0);
  });

  test('displays search input and toolbar controls', async () => {
    await expect(userPage.searchInput).toBeVisible({ timeout: 15_000 });
    await expect(userPage.withRolesToggle).toBeVisible();
  });

  test('search input accepts text and can be cleared', async ({ page }) => {
    await expect(userPage.searchInput).toBeVisible({ timeout: 15_000 });

    await userPage.searchInput.fill('test');
    await expect(userPage.searchInput).toHaveValue('test');

    await userPage.searchInput.press('Enter');

    await page.waitForTimeout(1000);

    await expect(userPage.clearSearchButton).toBeVisible();
    await userPage.clearSearch();
    await expect(userPage.searchInput).toHaveValue('');
  });

  test('view switcher toggles between table and card views without errors', async ({ page }) => {
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

    await expect(userPage.searchInput).toBeVisible({ timeout: 15_000 });

    if (await userPage.cardViewButton.isVisible()) {
      await userPage.switchToCardView();
      await page.waitForTimeout(2000);

      await userPage.switchToTableView();
      await page.waitForTimeout(2000);
    }

    expect(loopErrorCount, 'View switching should not trigger infinite re-renders').toBe(0);
  });

  test('with roles only toggle works without errors', async ({ page }) => {
    let loopErrorCount = 0;

    page.on('pageerror', (error) => {
      if (error.message.includes('Maximum update depth exceeded')) {
        loopErrorCount++;
      }
    });

    await expect(userPage.withRolesToggle).toBeVisible({ timeout: 15_000 });

    await userPage.toggleWithRolesOnly();
    await page.waitForTimeout(2000);

    await userPage.toggleWithRolesOnly();
    await page.waitForTimeout(2000);

    expect(loopErrorCount, 'Toggling with-roles-only should not trigger infinite re-renders').toBe(
      0,
    );
  });
});
