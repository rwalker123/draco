import type { Locator, Page } from '@playwright/test';

export class TeamSchedulePage {
  readonly page: Page;
  readonly mainContent: Locator;
  readonly scheduleBreadcrumb: Locator;
  readonly monthButton: Locator;
  readonly weekButton: Locator;
  readonly prevButton: Locator;
  readonly nextButton: Locator;
  readonly gameCards: Locator;
  readonly gameDialog: Locator;
  readonly gameDialogTitle: Locator;
  readonly unassignedTeamsWarning: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainContent = page.getByRole('main');
    this.scheduleBreadcrumb = page.getByRole('navigation', { name: /breadcrumb/i });
    this.monthButton = page.getByRole('button', { name: /^month$/i });
    this.weekButton = page.getByRole('button', { name: /^week$/i });
    this.prevButton = page.getByRole('button', { name: /previous period/i });
    this.nextButton = page.getByRole('button', { name: /next period/i });
    this.gameCards = page.getByTestId('game-card');
    this.gameDialog = page.getByRole('dialog');
    this.gameDialogTitle = this.gameDialog.getByRole('heading', { name: /game details/i });
    this.unassignedTeamsWarning = this.gameDialog.getByText(
      /teams that are no longer assigned to a division/i,
    );
  }

  async goto(accountId: string, seasonId: string, teamSeasonId: string) {
    await this.page.goto(
      `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/schedule`,
    );
    await this.mainContent.waitFor({ timeout: 15_000 });
    await this.scheduleBreadcrumb.waitFor({ timeout: 15_000 });
  }

  homeTeamField(): Locator {
    return this.gameDialog.getByLabel(/home team/i);
  }

  visitorTeamField(): Locator {
    return this.gameDialog.getByLabel(/visitor team/i);
  }
}
