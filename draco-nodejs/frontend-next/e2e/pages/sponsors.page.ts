import type { Locator, Page } from '@playwright/test';

export class SponsorsManagePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addFab: Locator;
  readonly dialog: Locator;
  readonly sponsorTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Sponsor Management', level: 1 });
    this.addFab = page.getByRole('button', { name: 'add sponsor' });
    this.dialog = page.getByRole('dialog');
    this.sponsorTable = page.getByRole('table');
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/sponsors/manage`);
    await this.heading.waitFor({ timeout: 15_000 });
  }

  async openCreateDialog() {
    await this.addFab.click();
    await this.dialog.waitFor();
  }
}
