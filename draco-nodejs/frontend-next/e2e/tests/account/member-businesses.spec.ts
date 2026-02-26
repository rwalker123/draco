import { test, expect } from '../../fixtures/base-fixtures';
import { MemberBusinessesManagePage } from '../../pages/member-businesses.page';

test.describe('Member Business Management', () => {
  let memberBusinessesPage: MemberBusinessesManagePage;

  test.beforeEach(async ({ page, accountId }) => {
    memberBusinessesPage = new MemberBusinessesManagePage(page);
    await memberBusinessesPage.goto(accountId);
  });

  test('member business management page loads with heading', async () => {
    await expect(memberBusinessesPage.heading).toBeVisible();
  });

  test('displays directory availability toggle', async () => {
    await expect(memberBusinessesPage.directoryToggle).toBeVisible();
  });

  test('displays registered businesses section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Registered Member Businesses/i }),
    ).toBeVisible();
  });

  test('displays business table', async () => {
    await expect(memberBusinessesPage.businessTable).toBeVisible();
  });
});
