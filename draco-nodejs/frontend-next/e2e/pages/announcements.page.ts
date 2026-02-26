import type { Locator, Page } from '@playwright/test';

export class AnnouncementsPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Account Announcements', level: 1 });
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/announcements`);
    await this.heading.waitFor({ timeout: 15_000 });
  }
}

export class AnnouncementsManagePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addFab: Locator;
  readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Announcement Management', level: 1 });
    this.addFab = page.getByRole('button', { name: 'Add announcement' });
    this.dialog = page.getByRole('dialog');
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/announcements/manage`);
    await this.heading.waitFor({ timeout: 15_000 });
  }

  async openCreateDialog() {
    await this.addFab.click();
    await this.dialog.waitFor();
  }
}
