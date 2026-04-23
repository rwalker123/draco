import { test, expect } from '../../fixtures/golf-fixtures';
import { LeaguePlayerProfilePage } from '../../pages/league-player-profile.page';

test.describe('Golf League Player Profile', () => {
  let profilePage: LeaguePlayerProfilePage;

  test.beforeEach(async ({ page, golfData }) => {
    profilePage = new LeaguePlayerProfilePage(page);
    await profilePage.goto(
      golfData.accountId,
      golfData.seasonId,
      golfData.player1ContactId,
      golfData.player1Name,
    );
  });

  test('displays player name and league match scores heading', async ({ golfData }) => {
    await expect(profilePage.playerNameHeading).toContainText(golfData.player1Name);
    await expect(profilePage.scoresHeading).toBeVisible();
  });

  test('displays league match scores with course name and score', async ({ page }) => {
    await expect(page.getByText("Sheperd's Hollow Golf Club")).toBeVisible();
    await expect(page.getByRole('heading', { name: '42', level: 5 })).toBeVisible();
  });

  test('displays stats cards', async ({ page }) => {
    await expect(page.getByText('League rounds')).toBeVisible();
    await expect(page.getByText('Handicap Index')).toBeVisible();
  });

  test('navigates back when clicking back button', async ({ page, golfData }) => {
    const leaderboardUrl = `/account/${golfData.accountId}/seasons/${golfData.seasonId}/golf`;
    await page.goto(leaderboardUrl);
    const profileUrl = `/account/${golfData.accountId}/seasons/${golfData.seasonId}/golf/players/${golfData.player1ContactId}?name=${encodeURIComponent(golfData.player1Name)}`;
    await page.goto(profileUrl);
    await expect(profilePage.scoresHeading).toBeVisible({ timeout: 15_000 });
    await profilePage.backButton.click();
    await expect(page).not.toHaveURL(profileUrl, { timeout: 10_000 });
  });

  test('maintains auth state after page refresh', async ({ page, golfData }) => {
    const url = `/account/${golfData.accountId}/seasons/${golfData.seasonId}/golf/players/${golfData.player1ContactId}?name=${encodeURIComponent(golfData.player1Name)}`;
    await page.goto(url);
    await expect(page.getByRole('heading', { name: 'League Match Scores' })).toBeVisible({
      timeout: 15_000,
    });
    await page.reload();
    await expect(page.getByRole('button', { name: 'Sign In' })).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'League Match Scores' })).toBeVisible({
      timeout: 15_000,
    });
  });
});
