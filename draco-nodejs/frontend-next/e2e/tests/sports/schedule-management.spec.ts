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
});
