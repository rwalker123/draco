import { test, expect } from '../../fixtures/base-fixtures';
import { StatisticsPage } from '../../pages/statistics.page';

test.describe('Statistics', () => {
  let statsPage: StatisticsPage;

  test.beforeEach(async ({ page, accountId }) => {
    statsPage = new StatisticsPage(page);
    await statsPage.goto(accountId);
  });

  test('statistics page loads', async () => {
    await expect(statsPage.heading).toBeVisible();
  });

  test('displays filter controls', async () => {
    await expect(statsPage.filtersHeading).toBeVisible();
  });

  test('displays season selector', async () => {
    await expect(statsPage.seasonSelect).toBeVisible();
  });

  test('displays league selector', async () => {
    await expect(statsPage.leagueSelect).toBeVisible();
  });

  test('displays all-time stats toggle', async () => {
    await expect(statsPage.historicalToggle).toBeVisible();
  });
});
