import type { Locator, Page } from '@playwright/test';

export class StandingsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly standingsTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h4', { hasText: 'Standings' });
    this.standingsTable = page.getByRole('table');
  }

  async goto(accountId: string, seasonId: string) {
    await this.page.goto(`/account/${accountId}/seasons/${seasonId}/standings`);
    await this.heading.waitFor({ timeout: 15_000 });
  }
}
