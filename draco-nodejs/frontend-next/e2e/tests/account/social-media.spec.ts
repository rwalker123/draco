import { test, expect } from '../../fixtures/base-fixtures';
import { SocialMediaPage } from '../../pages/social-media.page';

test.describe('Social Media Management', () => {
  let socialMediaPage: SocialMediaPage;

  test.beforeEach(async ({ page, accountId }) => {
    socialMediaPage = new SocialMediaPage(page);
    await socialMediaPage.goto(accountId);
  });

  test('displays the page heading and tabs', async () => {
    await expect(socialMediaPage.heading).toBeVisible();
    await expect(socialMediaPage.tabList).toBeVisible();
    await expect(socialMediaPage.youtubeTab).toBeVisible();
    await expect(socialMediaPage.discordTab).toBeVisible();
    await expect(socialMediaPage.blueskyTab).toBeVisible();
    await expect(socialMediaPage.twitterTab).toBeVisible();
    await expect(socialMediaPage.facebookInstagramTab).toBeVisible();
  });

  test('YouTube tab is selected by default', async () => {
    await expect(socialMediaPage.youtubeTab).toHaveAttribute('aria-selected', 'true');
  });

  test('can switch to Discord tab', async () => {
    await socialMediaPage.switchTab(socialMediaPage.discordTab);
    await expect(socialMediaPage.discordTab).toHaveAttribute('aria-selected', 'true');
    await expect(socialMediaPage.youtubeTab).toHaveAttribute('aria-selected', 'false');
  });

  test('can switch to Bluesky tab', async () => {
    await socialMediaPage.switchTab(socialMediaPage.blueskyTab);
    await expect(socialMediaPage.blueskyTab).toHaveAttribute('aria-selected', 'true');
  });

  test('can switch to Twitter tab', async () => {
    await socialMediaPage.switchTab(socialMediaPage.twitterTab);
    await expect(socialMediaPage.twitterTab).toHaveAttribute('aria-selected', 'true');
  });

  test('can switch to Facebook/Instagram tab', async () => {
    await socialMediaPage.switchTab(socialMediaPage.facebookInstagramTab);
    await expect(socialMediaPage.facebookInstagramTab).toHaveAttribute('aria-selected', 'true');
  });
});
