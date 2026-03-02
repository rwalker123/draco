import type { Locator, Page } from '@playwright/test';

export class UmpiresManagePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addFab: Locator;
  readonly dialog: Locator;
  readonly umpireTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Umpires', level: 1 });
    this.addFab = page.getByRole('button', { name: 'Add umpire' });
    this.dialog = page.getByRole('dialog');
    this.umpireTable = page.getByRole('table');
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/umpires/manage`);
    await this.heading.waitFor({ timeout: 15_000 });
  }

  async openCreateDialog() {
    await this.addFab.click();
    await this.dialog.waitFor();
  }
}
