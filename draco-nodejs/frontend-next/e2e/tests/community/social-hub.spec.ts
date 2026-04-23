import { test, expect } from '../../fixtures/base-fixtures';
import { SocialHubPage } from '../../pages/social-hub.page';

test.describe('Social Hub', () => {
  let socialHubPage: SocialHubPage;

  test.beforeEach(async ({ page, accountId }) => {
    socialHubPage = new SocialHubPage(page);
    await socialHubPage.goto(accountId);
  });

  test('social hub page loads with heading', async () => {
    await expect(socialHubPage.heading).toBeVisible();
  });

  test('displays subtitle text', async () => {
    await expect(socialHubPage.subtitle).toBeVisible();
  });

  test('main content area is visible', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('social posts sub-page loads', async ({ page, accountId }) => {
    await page.goto(`/account/${accountId}/social-hub/posts`);
    await expect(page.getByRole('heading', { name: 'Social Messages' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('videos sub-page loads', async ({ page, accountId }) => {
    await page.goto(`/account/${accountId}/social-hub/videos`);
    await expect(page.getByRole('heading', { name: 'Account Videos' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('community messages sub-page loads', async ({ page, accountId }) => {
    await page.goto(`/account/${accountId}/social-hub/community`);
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Community Messages' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('member businesses sub-page loads', async ({ page, accountId }) => {
    await page.goto(`/account/${accountId}/social-hub/member-businesses`);
    await expect(page.getByRole('heading', { name: 'Member Businesses' }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
