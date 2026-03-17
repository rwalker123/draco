import { test, expect } from '../../fixtures/golf-substitute-fixtures';
import { GolfScoreEntryPage } from '../../pages/golf-score-entry.page';

test.describe('Golf Score Entry - Substitute Players', () => {
  let scoreEntryPage: GolfScoreEntryPage;

  test.beforeEach(async ({ page }) => {
    scoreEntryPage = new GolfScoreEntryPage(page);
  });

  test('shows substitute select when player is marked absent', async ({ substituteData }) => {
    await scoreEntryPage.goto(substituteData.accountId);
    await scoreEntryPage.openScoreDialog(substituteData.team1Name);

    expect(await scoreEntryPage.isSubstituteSelectVisible(substituteData.team1Name)).toBe(false);

    await scoreEntryPage.markPlayerAbsent(substituteData.team1Name);

    expect(await scoreEntryPage.isSubstituteSelectVisible(substituteData.team1Name)).toBe(true);

    await scoreEntryPage.closeDialog();
  });

  test('enables score input after selecting a substitute', async ({ page, substituteData }) => {
    await scoreEntryPage.goto(substituteData.accountId);
    await scoreEntryPage.openScoreDialog(substituteData.team1Name);
    await scoreEntryPage.setHoles('9 Holes');

    await scoreEntryPage.markPlayerAbsent(substituteData.team1Name);

    const accordion = page
      .getByTestId('score-entry-dialog')
      .locator('.MuiAccordion-root')
      .filter({ hasText: substituteData.team1Name });
    const totalScoreInput = accordion.getByLabel('Total Score');
    await expect(totalScoreInput).toBeDisabled();

    await scoreEntryPage.selectSubstitute(substituteData.team1Name, substituteData.substituteName);

    await expect(totalScoreInput).toBeEnabled();

    await scoreEntryPage.closeDialog();
  });

  test('saves and restores scores with a substitute player', async ({ substituteData }) => {
    test.setTimeout(45000);

    await scoreEntryPage.goto(substituteData.accountId);
    await scoreEntryPage.openScoreDialog(substituteData.team1Name);
    await scoreEntryPage.setHoles('9 Holes');

    await scoreEntryPage.markPlayerAbsent(substituteData.team1Name);
    await scoreEntryPage.selectSubstitute(substituteData.team1Name, substituteData.substituteName);
    await scoreEntryPage.fillTotalScore(substituteData.team1Name, '42');

    await scoreEntryPage.fillTotalScore(substituteData.team2Name, '45');

    await scoreEntryPage.saveScores();

    await scoreEntryPage.openScoreDialog(substituteData.team1Name);

    expect(await scoreEntryPage.isPlayerAbsent(substituteData.team1Name)).toBe(true);

    expect(await scoreEntryPage.isSubstituteSelectVisible(substituteData.team1Name)).toBe(true);

    const selectedText = await scoreEntryPage.getSelectedSubstituteText(substituteData.team1Name);
    expect(selectedText).toContain(substituteData.substituteName);

    expect(await scoreEntryPage.getTotalScoreValue(substituteData.team1Name)).toBe('42');

    expect(await scoreEntryPage.isPlayerAbsent(substituteData.team2Name)).toBe(false);
    expect(await scoreEntryPage.getTotalScoreValue(substituteData.team2Name)).toBe('45');

    await scoreEntryPage.closeDialog();
  });

  test('clears substitute when unchecking absent', async ({ page, substituteData }) => {
    await scoreEntryPage.goto(substituteData.accountId);
    await scoreEntryPage.openScoreDialog(substituteData.team1Name);

    await scoreEntryPage.markPlayerAbsent(substituteData.team1Name);
    await scoreEntryPage.selectSubstitute(substituteData.team1Name, substituteData.substituteName);

    expect(await scoreEntryPage.isSubstituteSelectVisible(substituteData.team1Name)).toBe(true);

    const accordion = page
      .getByTestId('score-entry-dialog')
      .locator('.MuiAccordion-root')
      .filter({ hasText: substituteData.team1Name });
    const absentCheckbox = accordion.getByLabel('Absent');
    await absentCheckbox.uncheck();

    expect(await scoreEntryPage.isPlayerAbsent(substituteData.team1Name)).toBe(false);
    expect(await scoreEntryPage.isSubstituteSelectVisible(substituteData.team1Name)).toBe(false);

    await scoreEntryPage.closeDialog();
  });
});
