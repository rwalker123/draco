import type { Locator, Page } from '@playwright/test';

export class TeamsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly mainContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Teams' });
    this.mainContent = page.getByRole('main');
  }

  async goto(accountId: string, seasonId: string) {
    await this.page.goto(`/account/${accountId}/seasons/${seasonId}/teams`);
    await this.heading.waitFor({ timeout: 15_000 });
  }
}
