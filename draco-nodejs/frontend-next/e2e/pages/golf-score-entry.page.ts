import type { Page, Locator } from '@playwright/test';

export class GolfScoreEntryPage {
  constructor(private page: Page) {}

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/schedule-management`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  private gameCard(team1Name: string): Locator {
    return this.page.locator('.MuiCard-root, [class*="GameCard"]').filter({ hasText: team1Name });
  }

  async openScoreDialog(team1Name: string): Promise<void> {
    const card = this.gameCard(team1Name);
    await card.waitFor({ state: 'visible', timeout: 15000 });
    const btn = card.getByTestId('enter-game-results-btn');
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ force: true });
    await this.page.getByTestId('score-entry-dialog').waitFor({ state: 'visible' });
    await this.dialog()
      .locator('.MuiAccordion-root')
      .first()
      .waitFor({ state: 'visible', timeout: 10000 });
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
    const holesSelect = this.dialog()
      .locator('.MuiFormControl-root', { hasText: 'Holes' })
      .locator('[role="combobox"]');
    await holesSelect.click();
    await this.page.getByRole('option', { name: holes }).click();
    await this.page
      .locator('[role="listbox"]')
      .waitFor({ state: 'hidden', timeout: 5000 })
      .catch(() => {});
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
    try {
      await accordion.getByLabel('Front 9').waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async saveScores(): Promise<void> {
    const btn = this.dialog().getByRole('button', { name: 'Save Scores' });
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ force: true });
    await this.page.getByTestId('score-entry-dialog').waitFor({ state: 'hidden', timeout: 15000 });
  }

  async closeDialog(): Promise<void> {
    const dialog = this.page.getByTestId('score-entry-dialog');
    await dialog.press('Escape');
    await dialog.waitFor({ state: 'hidden', timeout: 10000 });
  }

  async isSubstituteSelectVisible(teamName: string): Promise<boolean> {
    const accordion = this.teamAccordion(teamName);
    const select = accordion.locator('.MuiSelect-select');
    try {
      await select.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async selectSubstitute(teamName: string, substituteName: string): Promise<void> {
    const accordion = this.teamAccordion(teamName);
    const select = accordion.locator('.MuiSelect-select');
    await select.waitFor({ state: 'visible', timeout: 5000 });
    await select.click();
    await this.page.getByRole('option', { name: substituteName }).click();
    await this.page
      .locator('[role="listbox"]')
      .waitFor({ state: 'hidden', timeout: 3000 })
      .catch(() => {});
  }

  async getSelectedSubstituteText(teamName: string): Promise<string> {
    const accordion = this.teamAccordion(teamName);
    const select = accordion.locator('.MuiSelect-select');
    return (await select.textContent()) ?? '';
  }

  async fillTotalScore(teamName: string, score: string): Promise<void> {
    const accordion = this.teamAccordion(teamName);
    await accordion.getByLabel('Total Score').fill(score);
  }

  async getTotalScoreValue(teamName: string): Promise<string> {
    const accordion = this.teamAccordion(teamName);
    return accordion.getByLabel('Total Score').inputValue();
  }
}
