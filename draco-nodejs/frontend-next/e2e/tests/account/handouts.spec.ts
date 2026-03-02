import { test, expect } from '../../fixtures/base-fixtures';
import { HandoutsPage, HandoutsManagePage } from '../../pages/handouts.page';

test.describe('Handouts', () => {
  test.describe('Public View', () => {
    let handoutsPage: HandoutsPage;

    test.beforeEach(async ({ page, accountId }) => {
      handoutsPage = new HandoutsPage(page);
      await handoutsPage.goto(accountId);
    });

    test('handouts page loads with heading', async () => {
      await expect(handoutsPage.heading).toBeVisible();
    });
  });

  test.describe('Management View', () => {
    let managePage: HandoutsManagePage;

    test.beforeEach(async ({ page, accountId }) => {
      managePage = new HandoutsManagePage(page);
      await managePage.goto(accountId);
    });

    test('management page loads with heading', async () => {
      await expect(managePage.heading).toBeVisible();
    });

    test('displays add handout FAB', async () => {
      await expect(managePage.addFab).toBeVisible();
    });

    test('can open add handout dialog', async () => {
      await managePage.openCreateDialog();
      await expect(managePage.dialog).toBeVisible();
      await expect(managePage.dialog.getByRole('heading', { name: 'Add Handout' })).toBeVisible();
    });

    test('add handout dialog can be closed', async () => {
      await managePage.openCreateDialog();
      await expect(managePage.dialog).toBeVisible();
      await managePage.dialog.getByRole('button', { name: 'Cancel' }).click();
      await expect(managePage.dialog).not.toBeVisible();
    });
  });
});
