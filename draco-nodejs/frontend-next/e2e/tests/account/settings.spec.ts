import { test, expect } from '../../fixtures/base-fixtures';
import { SettingsPage } from '../../pages/settings.page';

test.describe('Account Settings', () => {
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ page, accountId }) => {
    settingsPage = new SettingsPage(page);
    await settingsPage.goto(accountId);
  });

  test('account settings page loads with heading', async () => {
    await expect(settingsPage.heading).toBeVisible();
    await expect(settingsPage.subtitle).toBeVisible();
  });

  test('displays URLs & Domains and General Settings tabs', async () => {
    await expect(settingsPage.urlsDomainsTab).toBeVisible();
    await expect(settingsPage.generalSettingsTab).toBeVisible();
  });

  test('URLs & Domains tab is selected by default', async () => {
    await expect(settingsPage.urlsDomainsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('can switch to General Settings tab', async () => {
    await settingsPage.switchTab(settingsPage.generalSettingsTab);
    await expect(settingsPage.generalSettingsTab).toHaveAttribute('aria-selected', 'true');
    await expect(settingsPage.urlsDomainsTab).toHaveAttribute('aria-selected', 'false');
  });
});
