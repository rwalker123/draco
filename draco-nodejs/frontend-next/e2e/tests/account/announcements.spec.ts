import { test, expect } from '../../fixtures/base-fixtures';
import { AnnouncementsPage, AnnouncementsManagePage } from '../../pages/announcements.page';

test.describe('Announcements', () => {
  test.describe('Public View', () => {
    let announcementsPage: AnnouncementsPage;

    test.beforeEach(async ({ page, accountId }) => {
      announcementsPage = new AnnouncementsPage(page);
      await announcementsPage.goto(accountId);
    });

    test('announcements page loads with heading', async () => {
      await expect(announcementsPage.heading).toBeVisible();
    });

    test('displays announcements widget heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Announcements', exact: true })).toBeVisible();
    });
  });

  test.describe('Management View', () => {
    let managePage: AnnouncementsManagePage;

    test.beforeEach(async ({ page, accountId }) => {
      managePage = new AnnouncementsManagePage(page);
      await managePage.goto(accountId);
    });

    test('management page loads with heading', async () => {
      await expect(managePage.heading).toBeVisible();
    });

    test('displays add announcement FAB', async () => {
      await expect(managePage.addFab).toBeVisible();
    });

    test('can open create announcement dialog', async () => {
      await managePage.openCreateDialog();
      await expect(managePage.dialog).toBeVisible();
      await expect(
        managePage.dialog.getByRole('heading', { name: 'Create Announcement' }),
      ).toBeVisible();
    });

    test('create announcement dialog can be closed', async () => {
      await managePage.openCreateDialog();
      await expect(managePage.dialog).toBeVisible();
      await managePage.dialog.getByRole('button', { name: 'Cancel' }).click();
      await expect(managePage.dialog).not.toBeVisible();
    });

    test('create dialog contains expected form fields', async ({ page }) => {
      await managePage.openCreateDialog();
      await expect(page.getByLabel('Title')).toBeVisible();
      await expect(page.getByRole('group', { name: 'Publish Date & Time' })).toBeVisible();
    });
  });
});
