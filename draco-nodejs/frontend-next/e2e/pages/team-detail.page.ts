import type { Locator, Page } from '@playwright/test';

export class TeamDetailPage {
  readonly page: Page;
  readonly mainContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainContent = page.getByRole('main');
  }

  async goto(accountId: string, seasonId: string, teamSeasonId: string) {
    await this.page.goto(`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}`);
    await this.mainContent.waitFor({ timeout: 15_000 });
  }
}
