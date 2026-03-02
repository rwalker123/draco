import { test, expect } from '../../fixtures/base-fixtures';
import { ProfilePage } from '../../pages/profile.page';

test.describe('Profile', () => {
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page);
    await profilePage.goto();
  });

  test('profile page loads with heading', async () => {
    await expect(profilePage.heading).toBeVisible();
    await expect(profilePage.subtitle).toBeVisible();
  });

  test('contact information section displays', async () => {
    await expect(profilePage.contactInfoCard).toBeVisible();
  });

  test('organizations section displays', async () => {
    await expect(profilePage.organizationsHeading).toBeVisible();
  });

  test('teams by organization section displays', async () => {
    await expect(profilePage.teamsHeading).toBeVisible();
  });
});
