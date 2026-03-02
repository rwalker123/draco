import type { Locator, Page } from '@playwright/test';

export class PollManagementPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly pollTable: Locator;
  readonly addPollFab: Locator;
  readonly editorDialog: Locator;
  readonly noPollsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Poll Management', level: 1 });
    this.pollTable = page.getByRole('table').first();
    this.addPollFab = page.getByRole('button', { name: 'add' });
    this.editorDialog = page.getByRole('dialog');
    this.noPollsMessage = page.getByText('No polls found.');
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/polls/manage`);
    await this.heading.waitFor({ timeout: 15_000 });
  }

  async openCreateDialog() {
    await this.addPollFab.click();
  }
}
