import { test, expect } from '../../fixtures/golf-score-entry-fixtures';
import { GolfScoreEntryPage } from '../../pages/golf-score-entry.page';

test.describe('GolfScoreEntryDialog - Infinite Loop Check', () => {
  let scoreEntryPage: GolfScoreEntryPage;

  test.beforeEach(async ({ page }) => {
    scoreEntryPage = new GolfScoreEntryPage(page);
  });

  test('opening score entry dialog does not trigger Maximum update depth exceeded', async ({
    page,
    scoreEntryData,
  }) => {
    test.setTimeout(45000);

    let loopErrorCount = 0;

    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Maximum update depth exceeded')) {
        loopErrorCount++;
      }
    });
    page.on('pageerror', (error) => {
      if (error.message.includes('Maximum update depth exceeded')) {
        loopErrorCount++;
      }
    });

    await scoreEntryPage.goto(scoreEntryData.accountId);
    await scoreEntryPage.openScoreDialog(scoreEntryData.team1Name);

    await page.waitForTimeout(3000);

    expect(loopErrorCount, 'GolfScoreEntryDialog should not cause infinite re-renders').toBe(0);

    await scoreEntryPage.closeDialog();
  });

  test('opening and closing score entry dialog multiple times does not trigger infinite loop', async ({
    page,
    scoreEntryData,
  }) => {
    test.setTimeout(60000);

    let loopErrorCount = 0;

    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Maximum update depth exceeded')) {
        loopErrorCount++;
      }
    });
    page.on('pageerror', (error) => {
      if (error.message.includes('Maximum update depth exceeded')) {
        loopErrorCount++;
      }
    });

    await scoreEntryPage.goto(scoreEntryData.accountId);

    for (let i = 0; i < 3; i++) {
      await scoreEntryPage.openScoreDialog(scoreEntryData.team1Name);
      await page.waitForTimeout(1000);
      await scoreEntryPage.closeDialog();
      await page.waitForTimeout(500);
    }

    expect(loopErrorCount, 'Repeated open/close should not cause infinite re-renders').toBe(0);
  });

  test('score entry dialog does not repeatedly refetch data while open', async ({
    page,
    scoreEntryData,
  }) => {
    test.setTimeout(45000);

    let rosterFetchCount = 0;

    await page.route('**/api/accounts/*/seasons/*/teams/*/roster*', (route) => {
      rosterFetchCount++;
      return route.continue();
    });

    await scoreEntryPage.goto(scoreEntryData.accountId);
    await scoreEntryPage.openScoreDialog(scoreEntryData.team1Name);

    const initialFetchCount = rosterFetchCount;

    await page.waitForTimeout(3000);

    expect(
      rosterFetchCount - initialFetchCount,
      'Roster data should not be repeatedly refetched while dialog is open',
    ).toBeLessThanOrEqual(2);

    await scoreEntryPage.closeDialog();
  });
});
