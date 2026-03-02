import type { Locator, Page } from '@playwright/test';

export class CommunityMessagesPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly messageList: Locator;
  readonly channelSelect: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Community Messages' });
    this.messageList = page.getByRole('main');
    this.channelSelect = page.getByRole('combobox');
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/social-hub/community`);
    await this.heading.waitFor({ timeout: 15_000 });
  }
}
