import type { Locator, Page } from '@playwright/test';

export class UrlManagementPage {
  readonly page: Page;
  readonly settingsHeading: Locator;
  readonly urlsDomainsTab: Locator;
  readonly urlManagementHeading: Locator;
  readonly addUrlButton: Locator;
  readonly addFirstUrlButton: Locator;
  readonly noUrlsMessage: Locator;
  readonly urlTable: Locator;
  readonly addUrlDialogTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.settingsHeading = page.getByRole('heading', { name: 'Account Settings' });
    this.urlsDomainsTab = page.getByRole('tab', { name: 'URLs & Domains' });
    this.urlManagementHeading = page.getByRole('heading', { name: 'URL Management' });
    this.addUrlButton = page.getByRole('button', { name: 'add URL' });
    this.addFirstUrlButton = page.getByRole('button', { name: 'Add First URL' });
    this.noUrlsMessage = page.getByText('No URLs configured');
    this.urlTable = page.getByRole('table');
    this.addUrlDialogTitle = page.getByRole('heading', { name: /Add URL for/ });
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/settings`);
    await this.settingsHeading.waitFor();
  }

  async navigateToUrlsTab() {
    await this.urlsDomainsTab.click();
    await this.urlManagementHeading.waitFor();
  }
}
