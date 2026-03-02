import type { Locator, Page } from '@playwright/test';

export class SocialHubPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly subtitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Social Hub', level: 1 });
    this.subtitle = page.getByText(
      'Follow community chats, media highlights, and live updates curated for your account.',
    );
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/social-hub`);
    await this.heading.waitFor({ timeout: 15_000 });
  }
}
