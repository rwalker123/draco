import { test, expect } from '../../fixtures/golf-score-entry-fixtures';
import { GolfScoreEntryPage } from '../../pages/golf-score-entry.page';

test.describe('Golf Score Entry - Absent Checkbox Persistence', () => {
  let scoreEntryPage: GolfScoreEntryPage;

  test.beforeEach(async ({ page }) => {
    scoreEntryPage = new GolfScoreEntryPage(page);
  });

  test('persists absent state for both players after save and dialog reopen', async ({
    scoreEntryData,
  }) => {
    await scoreEntryPage.goto(scoreEntryData.accountId);

    await scoreEntryPage.openScoreDialog(scoreEntryData.team1Name);

    await scoreEntryPage.markPlayerAbsent(scoreEntryData.team1Name);
    await scoreEntryPage.markPlayerAbsent(scoreEntryData.team2Name);

    expect(await scoreEntryPage.isPlayerAbsent(scoreEntryData.team1Name)).toBe(true);
    expect(await scoreEntryPage.isPlayerAbsent(scoreEntryData.team2Name)).toBe(true);

    await scoreEntryPage.saveScores();

    await scoreEntryPage.openScoreDialog(scoreEntryData.team1Name);

    expect(await scoreEntryPage.isPlayerAbsent(scoreEntryData.team1Name)).toBe(true);
    expect(await scoreEntryPage.isPlayerAbsent(scoreEntryData.team2Name)).toBe(true);

    await scoreEntryPage.closeDialog();
  });

  test('persists absent for one player and score for the other after save and reopen', async ({
    page,
    scoreEntryData,
  }) => {
    await scoreEntryPage.goto(scoreEntryData.accountId);

    await scoreEntryPage.openScoreDialog(scoreEntryData.team1Name);

    await scoreEntryPage.markPlayerAbsent(scoreEntryData.team1Name);

    const dialog = page.getByTestId('score-entry-dialog');
    const team2Accordion = dialog
      .locator('.MuiAccordion-root')
      .filter({ hasText: scoreEntryData.team2Name });
    await team2Accordion.getByLabel('Total Score').fill('42');

    await scoreEntryPage.saveScores();

    await scoreEntryPage.openScoreDialog(scoreEntryData.team1Name);

    expect(await scoreEntryPage.isPlayerAbsent(scoreEntryData.team1Name)).toBe(true);
    expect(await scoreEntryPage.isPlayerAbsent(scoreEntryData.team2Name)).toBe(false);

    await scoreEntryPage.closeDialog();
  });
});
