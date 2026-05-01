import { test, expect } from '../../fixtures/base-fixtures';
import { TeamSchedulePage } from '../../pages/team-schedule.page';

test.describe('Team Schedule - Game Details Dialog', () => {
  test.beforeEach(({ seasonId, teamSeasonId }, testInfo) => {
    if (!seasonId || !teamSeasonId) {
      testInfo.skip(true, 'E2E_SEASON_ID or E2E_TEAM_SEASON_ID not set');
    }
  });

  test('schedule page loads', async ({ page, accountId, seasonId, teamSeasonId }) => {
    if (!seasonId || !teamSeasonId) return;
    const teamSchedulePage = new TeamSchedulePage(page);
    await teamSchedulePage.goto(accountId, seasonId, teamSeasonId);
    await expect(teamSchedulePage.mainContent).toBeVisible();
    await expect(teamSchedulePage.scheduleBreadcrumb).toBeVisible();
  });

  test('clicking a game opens the Game Details dialog with real team names', async ({
    page,
    accountId,
    seasonId,
    teamSeasonId,
  }) => {
    if (!seasonId || !teamSeasonId) return;
    test.setTimeout(45_000);

    const teamSchedulePage = new TeamSchedulePage(page);

    const gamesResponsePromise = page.waitForResponse(
      (resp) => {
        const url = resp.url();
        return /\/teams\/[^/]+\/schedule\?/.test(url) && url.includes('startDate=') && resp.ok();
      },
      { timeout: 30_000 },
    );

    await teamSchedulePage.goto(accountId, seasonId, teamSeasonId);
    await gamesResponsePromise;

    const monthButtonCount = await teamSchedulePage.monthButton.count();
    if (monthButtonCount > 0) {
      await expect(teamSchedulePage.monthButton).toBeVisible();
      await expect(teamSchedulePage.monthButton).toBeEnabled();
      await teamSchedulePage.monthButton.click();
    }

    const firstCard = teamSchedulePage.gameCards.first();
    const cardCount = await teamSchedulePage.gameCards.count();
    test.skip(cardCount === 0, 'No games visible for this team/season');

    await firstCard.scrollIntoViewIfNeeded();
    await firstCard.click();

    await expect(teamSchedulePage.gameDialog).toBeVisible({ timeout: 10_000 });
    await expect(teamSchedulePage.gameDialogTitle).toBeVisible();

    const homeTeam = teamSchedulePage.homeTeamField();
    const visitorTeam = teamSchedulePage.visitorTeamField();

    await expect(homeTeam).toBeVisible();
    await expect(visitorTeam).toBeVisible();

    const homeValue = await homeTeam.inputValue();
    const visitorValue = await visitorTeam.inputValue();

    expect(homeValue.trim()).not.toBe('');
    expect(visitorValue.trim()).not.toBe('');
    expect(homeValue).not.toBe('Unknown Team');
    expect(visitorValue).not.toBe('Unknown Team');

    await expect(teamSchedulePage.unassignedTeamsWarning).toHaveCount(0);

    await page.keyboard.press('Escape');
  });
});
