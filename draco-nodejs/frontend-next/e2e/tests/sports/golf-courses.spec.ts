import { test, expect } from '../../fixtures/base-fixtures';
import { GolfCoursesPage } from '../../pages/golf-courses.page';

const GOLF_ACCOUNT_ID = process.env.E2E_GOLF_ACCOUNT_ID || '';

test.describe('Golf Courses', () => {
  test.skip(!GOLF_ACCOUNT_ID, 'E2E_GOLF_ACCOUNT_ID not configured');

  let golfCoursesPage: GolfCoursesPage;

  test.beforeEach(async ({ page }) => {
    golfCoursesPage = new GolfCoursesPage(page);
    await golfCoursesPage.goto(GOLF_ACCOUNT_ID);
  });

  test('golf courses page loads with heading visible', async () => {
    await expect(golfCoursesPage.heading).toBeVisible();
  });

  test('FAB search button is visible', async () => {
    await expect(golfCoursesPage.searchFab).toBeVisible();
  });

  test('can open course search dialog', async () => {
    await golfCoursesPage.searchFab.click();
    await expect(golfCoursesPage.dialog).toBeVisible();
  });

  test('course search dialog can be closed', async () => {
    await golfCoursesPage.searchFab.click();
    await expect(golfCoursesPage.dialog).toBeVisible();
    const closeButton = golfCoursesPage.dialog.getByRole('button', { name: 'Cancel' });
    await closeButton.click();
    await expect(golfCoursesPage.dialog).not.toBeVisible();
  });

  test('course list main content area is visible', async () => {
    await expect(golfCoursesPage.mainContent).toBeVisible();
  });
});
