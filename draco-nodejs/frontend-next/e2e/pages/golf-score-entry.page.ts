import type { Page, Locator } from '@playwright/test';

export class GolfScoreEntryPage {
  constructor(private page: Page) {}

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/schedule-management`);
    await this.page.waitForLoadState('networkidle');
  }

  private gameCard(team1Name: string): Locator {
    return this.page.locator('.MuiCard-root, [class*="GameCard"]').filter({ hasText: team1Name });
  }

  async openScoreDialog(team1Name: string): Promise<void> {
    const card = this.gameCard(team1Name);
    await card.waitFor({ state: 'visible', timeout: 15000 });
    await card.getByTestId('enter-game-results-btn').click();
    await this.page.getByTestId('score-entry-dialog').waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle');
  }

  private dialog(): Locator {
    return this.page.getByTestId('score-entry-dialog');
  }

  private teamAccordion(teamName: string): Locator {
    return this.dialog().locator('.MuiAccordion-root').filter({ hasText: teamName });
  }

  async markPlayerAbsent(teamName: string): Promise<void> {
    const accordion = this.teamAccordion(teamName);
    const checkbox = accordion.getByLabel('Absent');
    await checkbox.check();
  }

  async isPlayerAbsent(teamName: string): Promise<boolean> {
    const accordion = this.teamAccordion(teamName);
    const checkbox = accordion.getByLabel('Absent');
    return checkbox.isChecked();
  }

  async setHoles(holes: '9 Holes' | '18 Holes'): Promise<void> {
    const holesSelect = this.dialog().getByLabel('Holes');
    await holesSelect.click();
    await this.page.getByRole('option', { name: holes }).click();
  }

  async fillFrontNine(teamName: string, score: string): Promise<void> {
    const accordion = this.teamAccordion(teamName);
    await accordion.getByLabel('Front 9').fill(score);
  }

  async fillBackNine(teamName: string, score: string): Promise<void> {
    const accordion = this.teamAccordion(teamName);
    await accordion.getByLabel('Back 9').fill(score);
  }

  async getFrontNineValue(teamName: string): Promise<string> {
    const accordion = this.teamAccordion(teamName);
    return accordion.getByLabel('Front 9').inputValue();
  }

  async getBackNineValue(teamName: string): Promise<string> {
    const accordion = this.teamAccordion(teamName);
    return accordion.getByLabel('Back 9').inputValue();
  }

  async getTotalText(teamName: string): Promise<string | null> {
    const accordion = this.teamAccordion(teamName);
    const total = accordion.getByText(/^Total:/);
    if (!(await total.isVisible())) return null;
    return total.textContent();
  }

  async isFrontNineVisible(teamName: string): Promise<boolean> {
    const accordion = this.teamAccordion(teamName);
    return accordion.getByLabel('Front 9').isVisible();
  }

  async saveScores(): Promise<void> {
    await this.dialog().getByRole('button', { name: 'Save Scores' }).click();
    await this.page.getByTestId('score-entry-dialog').waitFor({ state: 'hidden', timeout: 15000 });
  }

  async closeDialog(): Promise<void> {
    await this.dialog().getByRole('button', { name: 'Cancel' }).click();
    await this.page.getByTestId('score-entry-dialog').waitFor({ state: 'hidden', timeout: 10000 });
  }
}
