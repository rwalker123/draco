import { test, expect } from '../../fixtures/base-fixtures';

test.describe('AssignTeamManagerDialog', () => {
  test.beforeEach(({ seasonId, teamSeasonId }, testInfo) => {
    if (!seasonId || !teamSeasonId) {
      testInfo.skip(true, 'E2E_SEASON_ID or E2E_TEAM_SEASON_ID not set');
    }
  });

  test('assign manager dialog opens and displays player list', async ({
    page,
    accountId,
    seasonId,
    teamSeasonId,
  }) => {
    test.setTimeout(30000);

    await page.goto(`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster`);
    await page
      .getByText(/Roster/i)
      .first()
      .waitFor({ timeout: 15000 });

    await page.getByRole('button', { name: /assign manager/i }).waitFor({ timeout: 10000 });
    await page.getByRole('button', { name: /assign manager/i }).click();

    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ timeout: 5000 });
    await expect(dialog.getByText('Assign Team Manager')).toBeVisible();

    const autocomplete = dialog.getByRole('combobox');
    await expect(autocomplete).toBeVisible();
  });

  test('opening and closing assign manager dialog multiple times works cleanly', async ({
    page,
    accountId,
    seasonId,
    teamSeasonId,
  }) => {
    test.setTimeout(30000);

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

    await page.goto(`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster`);
    await page
      .getByText(/Roster/i)
      .first()
      .waitFor({ timeout: 15000 });

    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /assign manager/i }).click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor({ timeout: 5000 });
      await page.waitForTimeout(500);

      await dialog.getByRole('button', { name: /cancel/i }).click();
      await expect(dialog).not.toBeVisible();
      await page.waitForTimeout(300);
    }

    expect(loopErrorCount, 'Repeated open/close should not cause re-render loops').toBe(0);
  });
});
