import type { Locator, Page } from '@playwright/test';

export class PlayerClassifiedsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly playersWantedTab: Locator;
  readonly teamsWantedTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Player Classifieds' });
    this.playersWantedTab = page.getByRole('tab', { name: 'Players Wanted' });
    this.teamsWantedTab = page.getByRole('tab', { name: 'Teams Wanted' });
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/player-classifieds`);
    await this.heading.waitFor({ timeout: 15_000 });
  }

  async switchToPlayersWanted() {
    await this.playersWantedTab.click();
  }

  async switchToTeamsWanted() {
    await this.teamsWantedTab.click();
  }
}
