import type { Locator, Page } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly urlsDomainsTab: Locator;
  readonly generalSettingsTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Account Settings' });
    this.subtitle = page.getByText('Manage your organization');
    this.urlsDomainsTab = page.getByRole('tab', { name: 'URLs & Domains' });
    this.generalSettingsTab = page.getByRole('tab', { name: 'General Settings' });
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/settings`);
    await this.heading.waitFor();
  }

  async switchTab(tab: Locator) {
    await tab.click();
  }
}
