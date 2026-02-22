import { test18 as test, expect } from '../../fixtures/golf-score-entry-fixtures';
import { GolfScoreEntryPage } from '../../pages/golf-score-entry.page';

test.describe('Golf Score Entry - 18-Hole Totals Only (Front 9 / Back 9)', () => {
  let scoreEntryPage: GolfScoreEntryPage;

  test.beforeEach(async ({ page }) => {
    scoreEntryPage = new GolfScoreEntryPage(page);
  });

  test('shows Front 9 and Back 9 inputs for 18-hole totals-only match', async ({
    scoreEntryData18,
  }) => {
    await scoreEntryPage.goto(scoreEntryData18.accountId);
    await scoreEntryPage.openScoreDialog(scoreEntryData18.team1Name);

    expect(await scoreEntryPage.isFrontNineVisible(scoreEntryData18.team1Name)).toBe(true);
    expect(await scoreEntryPage.isFrontNineVisible(scoreEntryData18.team2Name)).toBe(true);

    await scoreEntryPage.closeDialog();
  });

  test('persists Front 9 and Back 9 scores after save and dialog reopen', async ({
    scoreEntryData18,
  }) => {
    await scoreEntryPage.goto(scoreEntryData18.accountId);
    await scoreEntryPage.openScoreDialog(scoreEntryData18.team1Name);

    await scoreEntryPage.fillFrontNine(scoreEntryData18.team1Name, '41');
    await scoreEntryPage.fillBackNine(scoreEntryData18.team1Name, '43');

    await scoreEntryPage.fillFrontNine(scoreEntryData18.team2Name, '44');
    await scoreEntryPage.fillBackNine(scoreEntryData18.team2Name, '40');

    expect(await scoreEntryPage.getTotalText(scoreEntryData18.team1Name)).toContain('84');
    expect(await scoreEntryPage.getTotalText(scoreEntryData18.team2Name)).toContain('84');

    await scoreEntryPage.saveScores();

    await scoreEntryPage.openScoreDialog(scoreEntryData18.team1Name);

    expect(await scoreEntryPage.getFrontNineValue(scoreEntryData18.team1Name)).toBe('41');
    expect(await scoreEntryPage.getBackNineValue(scoreEntryData18.team1Name)).toBe('43');
    expect(await scoreEntryPage.getFrontNineValue(scoreEntryData18.team2Name)).toBe('44');
    expect(await scoreEntryPage.getBackNineValue(scoreEntryData18.team2Name)).toBe('40');

    await scoreEntryPage.closeDialog();
  });

  test('persists absent with Front 9/Back 9 scores for the other player', async ({
    scoreEntryData18,
  }) => {
    await scoreEntryPage.goto(scoreEntryData18.accountId);
    await scoreEntryPage.openScoreDialog(scoreEntryData18.team1Name);

    await scoreEntryPage.markPlayerAbsent(scoreEntryData18.team1Name);

    await scoreEntryPage.fillFrontNine(scoreEntryData18.team2Name, '38');
    await scoreEntryPage.fillBackNine(scoreEntryData18.team2Name, '39');

    await scoreEntryPage.saveScores();

    await scoreEntryPage.openScoreDialog(scoreEntryData18.team1Name);

    expect(await scoreEntryPage.isPlayerAbsent(scoreEntryData18.team1Name)).toBe(true);
    expect(await scoreEntryPage.getFrontNineValue(scoreEntryData18.team2Name)).toBe('38');
    expect(await scoreEntryPage.getBackNineValue(scoreEntryData18.team2Name)).toBe('39');

    await scoreEntryPage.closeDialog();
  });
});
