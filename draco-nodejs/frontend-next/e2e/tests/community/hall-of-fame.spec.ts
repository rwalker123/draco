import { test, expect } from '../../fixtures/base-fixtures';
import { HallOfFameManagePage } from '../../pages/hall-of-fame.page';

test.describe('Hall of Fame Management', () => {
  let hofPage: HallOfFameManagePage;

  test.beforeEach(async ({ page, accountId }) => {
    hofPage = new HallOfFameManagePage(page);
    await hofPage.goto(accountId);
  });

  test('management page loads with heading', async () => {
    await expect(hofPage.heading).toBeVisible();
  });

  test('displays management tabs', async () => {
    await expect(hofPage.membersTab).toBeVisible();
    await expect(hofPage.nominationsTab).toBeVisible();
    await expect(hofPage.settingsTab).toBeVisible();
  });

  test('members tab is selected by default', async () => {
    await expect(hofPage.membersTab).toHaveAttribute('aria-selected', 'true');
  });

  test('can switch to nominations tab', async () => {
    await hofPage.switchToNominations();
    await expect(hofPage.nominationsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('can switch to settings tab', async () => {
    await hofPage.switchToSettings();
    await expect(hofPage.settingsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('displays add member FAB', async () => {
    await expect(hofPage.addMemberFab).toBeVisible();
  });

  test('displays availability toggle', async () => {
    await expect(hofPage.availabilitySwitch).toBeVisible();
  });
});
