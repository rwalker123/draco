import type { Locator, Page } from '@playwright/test';

export class SocialMediaPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly tabList: Locator;
  readonly youtubeTab: Locator;
  readonly discordTab: Locator;
  readonly blueskyTab: Locator;
  readonly twitterTab: Locator;
  readonly facebookInstagramTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', {
      name: 'Social Media Management',
    });
    this.tabList = page.getByRole('tablist');
    this.youtubeTab = page.getByRole('tab', { name: 'YouTube' });
    this.discordTab = page.getByRole('tab', { name: 'Discord' });
    this.blueskyTab = page.getByRole('tab', { name: 'Bluesky' });
    this.twitterTab = page.getByRole('tab', { name: 'Twitter' });
    this.facebookInstagramTab = page.getByRole('tab', {
      name: 'Facebook/Instagram',
    });
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/social-media`);
    await this.heading.waitFor();
  }

  async switchTab(tab: Locator) {
    await tab.click();
  }
}
