import { test, expect } from '../../fixtures/base-fixtures';
import { CommunityMessagesPage } from '../../pages/community-messages.page';

test.describe('Community Messages', () => {
  let messagesPage: CommunityMessagesPage;

  test.beforeEach(async ({ page, accountId }) => {
    messagesPage = new CommunityMessagesPage(page);
    await messagesPage.goto(accountId);
  });

  test('page loads with heading', async () => {
    await expect(messagesPage.heading).toBeVisible();
  });

  test('main content area is visible', async () => {
    await expect(messagesPage.messageList).toBeVisible();
  });

  test('community messages text displays', async ({ page }) => {
    await expect(page.getByText('Community Messages').first()).toBeVisible();
  });
});
