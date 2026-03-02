import { test, expect } from '../../fixtures/base-fixtures';
import { UrlManagementPage } from '../../pages/url-management.page';

test.describe('URL Management', () => {
  let urlPage: UrlManagementPage;

  test.beforeEach(async ({ page, accountId }) => {
    urlPage = new UrlManagementPage(page);
    await urlPage.goto(accountId);
    await urlPage.navigateToUrlsTab();
  });

  test('URL management section loads', async () => {
    await expect(urlPage.urlManagementHeading).toBeVisible();
  });

  test('URL list or empty message displays', async () => {
    const hasTable = await urlPage.urlTable.isVisible().catch(() => false);
    const hasEmptyMessage = await urlPage.noUrlsMessage.isVisible().catch(() => false);
    expect(hasTable || hasEmptyMessage).toBe(true);
  });

  test('add URL button is visible', async () => {
    const hasFab = await urlPage.addUrlButton.isVisible().catch(() => false);
    const hasInlineButton = await urlPage.addFirstUrlButton.isVisible().catch(() => false);
    expect(hasFab || hasInlineButton).toBe(true);
  });

  test('can open add URL dialog', async () => {
    const hasFab = await urlPage.addUrlButton.isVisible().catch(() => false);
    if (hasFab) {
      await urlPage.addUrlButton.click();
    } else {
      await urlPage.addFirstUrlButton.click();
    }
    await expect(urlPage.addUrlDialogTitle).toBeVisible();
  });
});
