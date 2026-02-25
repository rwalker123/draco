import { test, expect } from '../../fixtures/base-fixtures';
import { SchedulePage } from '../../pages/schedule.page';

test.describe('Schedule', () => {
  let schedulePage: SchedulePage;

  test.beforeEach(async ({ page, accountId }) => {
    schedulePage = new SchedulePage(page);
    await schedulePage.goto(accountId);
  });

  test('schedule page loads with heading', async () => {
    await expect(schedulePage.heading).toBeVisible();
  });

  test('displays view toggle controls', async () => {
    await expect(schedulePage.weekButton).toBeVisible();
    await expect(schedulePage.monthButton).toBeVisible();
  });

  test('displays date navigation buttons', async () => {
    await expect(schedulePage.prevButton).toBeVisible();
    await expect(schedulePage.nextButton).toBeVisible();
  });

  test('can navigate to next period', async () => {
    await schedulePage.nextButton.click();
    await expect(schedulePage.heading).toBeVisible();
  });

  test('can navigate to previous period', async () => {
    await schedulePage.prevButton.click();
    await expect(schedulePage.heading).toBeVisible();
  });
});
