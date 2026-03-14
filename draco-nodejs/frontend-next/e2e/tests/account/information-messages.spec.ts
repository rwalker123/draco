import { test, expect } from '../../fixtures/base-fixtures';
import { InformationMessagesManagePage } from '../../pages/information-messages.page';

test.describe('Information Messages Management', () => {
  let managePage: InformationMessagesManagePage;

  test.beforeEach(async ({ page, accountId }) => {
    managePage = new InformationMessagesManagePage(page);
    await managePage.goto(accountId);
  });

  test('management page loads and finishes loading messages', async () => {
    await expect(managePage.heading).toBeVisible();
    await expect(managePage.loadingAlert).not.toBeVisible({ timeout: 15_000 });

    const hasMessages = (await managePage.messageCards().count()) > 0;
    const hasEmptyAlert = await managePage.emptyAlert.isVisible();
    expect(hasMessages || hasEmptyAlert).toBe(true);
  });

  test('displays add information message FAB', async () => {
    await expect(managePage.addFab).toBeVisible();
  });

  test('can open create information message dialog', async () => {
    await expect(managePage.loadingAlert).not.toBeVisible({ timeout: 15_000 });
    await managePage.openCreateDialog();
    await expect(managePage.dialog).toBeVisible();
  });

  test('create dialog can be closed', async () => {
    await expect(managePage.loadingAlert).not.toBeVisible({ timeout: 15_000 });
    await managePage.openCreateDialog();
    await expect(managePage.dialog).toBeVisible();
    await managePage.dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(managePage.dialog).not.toBeVisible();
  });

  test('does not get stuck in infinite loading loop', async ({ page }) => {
    let maxDepthErrors = 0;
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Maximum update depth exceeded')) {
        maxDepthErrors++;
      }
    });

    await expect(managePage.loadingAlert).not.toBeVisible({ timeout: 15_000 });
    expect(maxDepthErrors).toBe(0);
  });
});
