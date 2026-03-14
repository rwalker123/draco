import type { Locator, Page } from '@playwright/test';

export class InformationMessagesManagePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addFab: Locator;
  readonly dialog: Locator;
  readonly loadingAlert: Locator;
  readonly emptyAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Information Messages', level: 1 });
    this.addFab = page.getByRole('button', { name: 'Add information message' });
    this.dialog = page.getByRole('dialog');
    this.loadingAlert = page.getByRole('alert').filter({ hasText: 'Loading information messages' });
    this.emptyAlert = page.getByRole('alert').filter({ hasText: 'No information messages' });
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/information-messages/manage`);
    await this.heading.waitFor({ timeout: 15_000 });
  }

  async openCreateDialog() {
    await this.addFab.click();
    await this.dialog.waitFor();
  }

  messageCards() {
    return this.page.locator('[class*="MuiCard-root"]');
  }
}
