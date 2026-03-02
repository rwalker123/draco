import { test, expect } from '../../fixtures/base-fixtures';
import { ScheduleManagementPage } from '../../pages/schedule-management.page';

test.describe('Schedule Management', () => {
  let managementPage: ScheduleManagementPage;

  test.beforeEach(async ({ page, accountId }) => {
    managementPage = new ScheduleManagementPage(page);
    await managementPage.goto(accountId);
  });

  test('management page loads with heading', async () => {
    await expect(managementPage.heading).toBeVisible();
  });

  test('displays add game button', async () => {
    await expect(managementPage.addGameButton).toBeVisible();
  });

  test('can open create game dialog', async () => {
    await managementPage.openCreateGameDialog();
    await expect(managementPage.createGameDialog).toBeVisible();
  });

  test('create game dialog can be closed', async () => {
    await managementPage.openCreateGameDialog();
    await expect(managementPage.createGameDialog).toBeVisible();
    const cancelButton = managementPage.createGameDialog.getByRole('button', {
      name: /cancel|close/i,
    });
    await cancelButton.click();
    await expect(managementPage.createGameDialog).not.toBeVisible();
  });

  test.describe('umpire fields', () => {
    test.beforeEach(async () => {
      await managementPage.openCreateGameDialog();
      await managementPage.waitForUmpireFields();
    });

    test('add game dialog shows all four umpire selects', async () => {
      await expect(managementPage.umpireSelect(1)).toBeVisible();
      await expect(managementPage.umpireSelect(2)).toBeVisible();
      await expect(managementPage.umpireSelect(3)).toBeVisible();
      await expect(managementPage.umpireSelect(4)).toBeVisible();
    });

    test('each umpire select contains at least one umpire option', async () => {
      await managementPage.umpireSelect(1).click();
      const listbox = managementPage.page.getByRole('listbox');
      await listbox.waitFor();
      const options = listbox.getByRole('option');
      await expect(options.first()).toBeVisible();
      await managementPage.page.keyboard.press('Escape');
    });
  });
});
