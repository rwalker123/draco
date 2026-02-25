import type { Locator, Page } from '@playwright/test';

export class LeagueSeasonsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createLeagueButton: Locator;
  readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.createLeagueButton = page.getByRole('button', {
      name: /add.*league|create.*league|new.*league/i,
    });
    this.dialog = page.getByRole('dialog');
  }

  async goto(accountId: string, seasonId: string) {
    await this.page.goto(`/account/${accountId}/seasons/${seasonId}/league-seasons`);
    await this.heading.waitFor({ timeout: 15_000 });
  }

  async openCreateLeagueDialog() {
    await this.createLeagueButton.click();
    await this.dialog.waitFor();
  }
}
