import type { Locator, Page } from '@playwright/test';

export class GolfTeamsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly flightSelector: Locator;
  readonly addTeamFab: Locator;
  readonly dialog: Locator;
  readonly backButton: Locator;
  readonly teamList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Golf Teams', level: 1 });
    this.flightSelector = page.getByLabel('Flight');
    this.addTeamFab = page.getByRole('button', { name: 'Add team' });
    this.dialog = page.getByRole('dialog');
    this.backButton = page.getByRole('button', { name: /back to flights/i });
    this.teamList = page.getByRole('list');
  }

  async goto(accountId: string, seasonId: string) {
    await this.page.goto(`/account/${accountId}/seasons/${seasonId}/golf/teams`);
    await this.heading.waitFor({ timeout: 15_000 });
  }

  async selectFlight(flightName: string) {
    await this.flightSelector.click();
    await this.page.getByRole('option', { name: flightName }).click();
  }

  async clickFirstTeamView() {
    await this.page
      .getByRole('button', { name: /view team/i })
      .first()
      .click();
  }

  async openCreateTeamDialog() {
    await this.addTeamFab.click();
    await this.dialog.waitFor();
  }
}

export class GolfTeamDetailPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addPlayerFab: Locator;
  readonly dialog: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.addPlayerFab = page.getByRole('button', { name: 'Add player' });
    this.dialog = page.getByRole('dialog');
    this.backButton = page.getByRole('button', { name: /back to flights/i });
  }

  async goto(accountId: string, seasonId: string, teamSeasonId: string) {
    await this.page.goto(`/account/${accountId}/seasons/${seasonId}/golf/teams/${teamSeasonId}`);
    await this.heading.waitFor({ timeout: 15_000 });
  }

  async openAddPlayerMenu() {
    await this.addPlayerFab.click();
  }

  async clickSignExistingPlayer() {
    await this.page.getByRole('menuitem', { name: /sign existing player/i }).click();
  }

  async clickCreateNewPlayer() {
    await this.page.getByRole('menuitem', { name: /create new player/i }).click();
  }
}
