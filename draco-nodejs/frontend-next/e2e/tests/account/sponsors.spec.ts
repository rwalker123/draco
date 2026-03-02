import { test, expect } from '../../fixtures/base-fixtures';
import { SponsorsManagePage } from '../../pages/sponsors.page';

test.describe('Sponsor Management', () => {
  let sponsorsPage: SponsorsManagePage;

  test.beforeEach(async ({ page, accountId }) => {
    sponsorsPage = new SponsorsManagePage(page);
    await sponsorsPage.goto(accountId);
  });

  test('sponsor management page loads with heading', async () => {
    await expect(sponsorsPage.heading).toBeVisible();
  });

  test('displays sponsor table', async () => {
    await expect(sponsorsPage.sponsorTable).toBeVisible();
  });

  test('displays add sponsor FAB', async () => {
    await expect(sponsorsPage.addFab).toBeVisible();
  });

  test('can open add sponsor dialog', async () => {
    await sponsorsPage.openCreateDialog();
    await expect(sponsorsPage.dialog).toBeVisible();
    await expect(sponsorsPage.dialog.getByRole('heading', { name: 'Add Sponsor' })).toBeVisible();
  });

  test('add sponsor dialog can be closed', async () => {
    await sponsorsPage.openCreateDialog();
    await expect(sponsorsPage.dialog).toBeVisible();
    await sponsorsPage.dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(sponsorsPage.dialog).not.toBeVisible();
  });

  test('add sponsor dialog contains expected form fields', async () => {
    await sponsorsPage.openCreateDialog();
    const dialog = sponsorsPage.dialog;
    await expect(dialog.getByLabel('Name')).toBeVisible();
    await expect(dialog.getByLabel('Email')).toBeVisible();
    await expect(dialog.getByLabel('Phone')).toBeVisible();
    await expect(dialog.getByLabel('Website')).toBeVisible();
  });
});
