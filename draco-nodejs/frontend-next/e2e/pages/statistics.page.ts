import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export class StatisticsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly seasonSelect: Locator;
  readonly leagueSelect: Locator;
  readonly divisionSelect: Locator;
  readonly historicalToggle: Locator;
  readonly filtersHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /statistics/i });
    this.seasonSelect = page.getByLabel('Season');
    this.leagueSelect = page.getByLabel('League');
    this.divisionSelect = page.getByLabel('Division');
    this.historicalToggle = page.getByLabel('All-Time Stats');
    this.filtersHeading = page.getByRole('heading', { name: 'Filters' });
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/statistics`);
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }
}
