import type { Locator, Page } from '@playwright/test';

export class SchedulePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly viewToggle: Locator;
  readonly weekButton: Locator;
  readonly monthButton: Locator;
  readonly prevButton: Locator;
  readonly nextButton: Locator;
  readonly filterSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Schedule' });
    this.viewToggle = page.getByRole('tablist');
    this.weekButton = page.getByRole('button', { name: /^week$/i });
    this.monthButton = page.getByRole('button', { name: /^month$/i });
    this.prevButton = page.getByRole('button', { name: /previous period/i });
    this.nextButton = page.getByRole('button', { name: /next period/i });
    this.filterSection = page.getByRole('combobox').first();
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/schedule`);
    await this.heading.waitFor({ timeout: 15_000 });
  }
}
