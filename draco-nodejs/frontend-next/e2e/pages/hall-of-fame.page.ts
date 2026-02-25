import type { Locator, Page } from '@playwright/test';

export class HallOfFameManagePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly membersTab: Locator;
  readonly nominationsTab: Locator;
  readonly settingsTab: Locator;
  readonly addMemberFab: Locator;
  readonly availabilitySwitch: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Hall of Fame Management', level: 1 });
    this.membersTab = page.getByRole('tab', { name: 'Members' });
    this.nominationsTab = page.getByRole('tab', { name: 'Nominations' });
    this.settingsTab = page.getByRole('tab', { name: 'Settings' });
    this.addMemberFab = page.getByRole('button', { name: /add hall of fame member/i });
    this.availabilitySwitch = page.getByRole('switch');
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/hall-of-fame/manage`);
    await this.heading.waitFor({ timeout: 15_000 });
  }

  async switchToNominations() {
    await this.nominationsTab.click();
  }

  async switchToSettings() {
    await this.settingsTab.click();
  }

  async switchToMembers() {
    await this.membersTab.click();
  }
}
