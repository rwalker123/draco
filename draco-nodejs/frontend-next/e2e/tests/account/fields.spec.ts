import { test, expect } from '../../fixtures/base-fixtures';
import { FieldsManagePage } from '../../pages/fields.page';

test.describe('Fields Management', () => {
  let fieldsPage: FieldsManagePage;

  test.beforeEach(async ({ page, accountId }) => {
    fieldsPage = new FieldsManagePage(page);
    await fieldsPage.goto(accountId);
  });

  test('fields management page loads', async () => {
    await expect(fieldsPage.heading).toBeVisible();
  });

  test('displays add field button', async () => {
    await expect(fieldsPage.addFieldButton).toBeVisible();
  });

  test('can open create field dialog', async () => {
    await fieldsPage.openCreateFieldDialog();
    await expect(fieldsPage.fieldFormDialog).toBeVisible();
  });

  test('field form dialog contains expected fields', async () => {
    await fieldsPage.openCreateFieldDialog();
    const dialog = fieldsPage.fieldFormDialog;
    await expect(dialog.getByLabel('Field Name')).toBeVisible();
    await expect(dialog.getByLabel('Short Name')).toBeVisible();
    await expect(dialog.getByLabel('Address')).toBeVisible();
    await expect(dialog.getByLabel('City')).toBeVisible();
    await expect(dialog.getByLabel('State')).toBeVisible();
    await expect(dialog.getByLabel('Zip Code')).toBeVisible();
  });

  test('field form dialog can be closed', async () => {
    await fieldsPage.openCreateFieldDialog();
    await expect(fieldsPage.fieldFormDialog).toBeVisible();
    const cancelButton = fieldsPage.fieldFormDialog.getByRole('button', { name: /cancel/i });
    await cancelButton.click();
    await expect(fieldsPage.fieldFormDialog).not.toBeVisible();
  });
});
