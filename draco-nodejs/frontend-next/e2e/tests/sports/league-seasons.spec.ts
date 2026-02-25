import { test, expect } from '../../fixtures/base-fixtures';
import { LeagueSeasonsPage } from '../../pages/league-seasons.page';

const SEASON_ID = process.env.E2E_SEASON_ID || '';

test.describe('League Seasons', () => {
  test.skip(!SEASON_ID, 'E2E_SEASON_ID not configured');

  let leagueSeasonsPage: LeagueSeasonsPage;

  test.beforeEach(async ({ page, accountId }) => {
    leagueSeasonsPage = new LeagueSeasonsPage(page);
    await leagueSeasonsPage.goto(accountId, SEASON_ID);
  });

  test('league seasons page loads', async () => {
    await expect(leagueSeasonsPage.heading).toBeVisible();
  });

  test('displays create league button', async () => {
    await expect(leagueSeasonsPage.createLeagueButton).toBeVisible();
  });

  test('can open create league dialog', async () => {
    await leagueSeasonsPage.openCreateLeagueDialog();
    await expect(leagueSeasonsPage.dialog).toBeVisible();
  });

  test('create league dialog can be closed', async () => {
    await leagueSeasonsPage.openCreateLeagueDialog();
    const cancelButton = leagueSeasonsPage.dialog.getByRole('button', { name: /cancel/i });
    await cancelButton.click();
    await expect(leagueSeasonsPage.dialog).not.toBeVisible();
  });
});
