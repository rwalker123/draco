import type { Locator, Page } from '@playwright/test';

export class FieldsManagePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addFieldButton: Locator;
  readonly fieldFormDialog: Locator;
  readonly fieldList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.addFieldButton = page.getByRole('button', { name: /add/i });
    this.fieldFormDialog = page.getByRole('dialog');
    this.fieldList = page.getByRole('main');
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/fields/manage`);
    await this.heading.waitFor({ timeout: 15_000 });
  }

  async openCreateFieldDialog() {
    await this.addFieldButton.click();
    await this.fieldFormDialog.waitFor();
  }
}
