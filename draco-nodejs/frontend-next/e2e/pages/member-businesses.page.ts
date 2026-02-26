import type { Locator, Page } from '@playwright/test';

export class MemberBusinessesManagePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly businessTable: Locator;
  readonly directoryToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Member Business Management', level: 1 });
    this.businessTable = page.getByRole('table');
    this.directoryToggle = page.getByRole('switch', { name: /Member Business Directory is/i });
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/member-businesses/manage`);
    await this.heading.waitFor({ timeout: 15_000 });
  }
}
