import type { Locator, Page } from '@playwright/test';

export class HandoutsPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Handouts', level: 1 });
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/handouts`);
    await this.heading.waitFor({ timeout: 15_000 });
  }
}

export class HandoutsManagePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addFab: Locator;
  readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Handout Management', level: 1 });
    this.addFab = page.getByRole('button', { name: 'Add handout' });
    this.dialog = page.getByRole('dialog');
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/handouts/manage`);
    await this.heading.waitFor({ timeout: 15_000 });
  }

  async openCreateDialog() {
    await this.addFab.click();
    await this.dialog.waitFor();
  }
}
