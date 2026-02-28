import type { Locator, Page } from '@playwright/test';

export class ScheduleManagementPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addGameButton: Locator;
  readonly createGameDialog: Locator;
  readonly filterSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Schedule Management', level: 1 });
    this.addGameButton = page.getByRole('button', { name: /add.*game|create.*game|new.*game/i });
    this.createGameDialog = page.getByRole('dialog');
    this.filterSection = page.getByRole('combobox').first();
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/schedule-management`);
    await this.heading.waitFor({ timeout: 15_000 });
  }

  async openCreateGameDialog() {
    await this.addGameButton.click();
    await this.createGameDialog.waitFor();
  }

  umpireSelect(n: 1 | 2 | 3 | 4): Locator {
    return this.createGameDialog.getByRole('combobox', { name: `Umpire ${n}` });
  }

  async waitForUmpireFields() {
    await this.umpireSelect(1).waitFor({ timeout: 10_000 });
  }
}
