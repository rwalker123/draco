import type { Page, Locator } from '@playwright/test';

export class LeaguePlayerProfilePage {
  readonly playerNameHeading: Locator;
  readonly scoresHeading: Locator;
  readonly backButton: Locator;

  constructor(private page: Page) {
    this.playerNameHeading = page.getByRole('heading', { level: 1 });
    this.scoresHeading = page.getByRole('heading', { name: 'League Match Scores' });
    this.backButton = page.getByRole('button', { name: 'Back to Leaderboard' });
  }

  async goto(accountId: string, seasonId: string, contactId: string, playerName: string) {
    const url = `/account/${accountId}/seasons/${seasonId}/golf/players/${contactId}?name=${encodeURIComponent(playerName)}`;
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  getScoreItems() {
    return this.page.locator('[data-testid="score-item"]');
  }
}
