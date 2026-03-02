import { test, expect } from '../../fixtures/base-fixtures';
import { UmpiresManagePage } from '../../pages/umpires.page';

test.describe('Umpire Management', () => {
  let umpiresPage: UmpiresManagePage;

  test.beforeEach(async ({ page, accountId }) => {
    umpiresPage = new UmpiresManagePage(page);
    await umpiresPage.goto(accountId);
  });

  test('umpire management page loads with heading', async () => {
    await expect(umpiresPage.heading).toBeVisible();
  });

  test('displays umpire table', async () => {
    await expect(umpiresPage.umpireTable).toBeVisible();
  });

  test('displays add umpire FAB', async () => {
    await expect(umpiresPage.addFab).toBeVisible();
  });

  test('can open add umpire dialog', async () => {
    await umpiresPage.openCreateDialog();
    await expect(umpiresPage.dialog).toBeVisible();
    await expect(umpiresPage.dialog.getByRole('heading', { name: 'Add Umpire' })).toBeVisible();
  });

  test('add umpire dialog can be closed', async () => {
    await umpiresPage.openCreateDialog();
    await expect(umpiresPage.dialog).toBeVisible();
    await umpiresPage.dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(umpiresPage.dialog).not.toBeVisible();
  });
});
