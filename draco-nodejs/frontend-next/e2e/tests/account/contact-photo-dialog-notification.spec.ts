import { test, expect } from '../../fixtures/base-fixtures';

test.describe('ContactPhotoUploadDialog - Notification State', () => {
  test.beforeEach(async ({ seasonId, teamSeasonId }) => {
    if (!seasonId || !teamSeasonId) {
      test.skip(true, 'E2E_SEASON_ID or E2E_TEAM_SEASON_ID not set');
    }
  });

  async function navigateToRoster(
    page: import('@playwright/test').Page,
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
  ) {
    await page.goto(`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: /roster/i })).toBeVisible({ timeout: 15_000 });
  }

  async function tryOpenPhotoDialog(page: import('@playwright/test').Page): Promise<boolean> {
    const avatars = page.locator('.MuiAvatar-root');
    const count = await avatars.count();
    for (let i = 0; i < count; i++) {
      const avatar = avatars.nth(i);
      const cursor = await avatar.evaluate((el) => window.getComputedStyle(el).cursor);
      if (cursor === 'pointer') {
        await avatar.click();
        const dialogTitle = page.getByRole('heading', { name: /update player photo/i });
        const visible = await dialogTitle
          .waitFor({ state: 'visible', timeout: 5000 })
          .then(() => true)
          .catch(() => false);
        if (visible) return true;
      }
    }
    return false;
  }

  test('opening photo upload dialog does not trigger Maximum update depth exceeded', async ({
    page,
    accountId,
    seasonId,
    teamSeasonId,
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

    await navigateToRoster(page, accountId, seasonId!, teamSeasonId!);

    const opened = await tryOpenPhotoDialog(page);
    if (!opened) {
      test.skip(true, 'No clickable avatar found on roster page (photo edit may not be allowed)');
      return;
    }

    await page.waitForTimeout(3000);

    expect(loopErrorCount, 'ContactPhotoUploadDialog should not cause infinite re-renders').toBe(0);

    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('opening and closing photo upload dialog multiple times works cleanly', async ({
    page,
    accountId,
    seasonId,
    teamSeasonId,
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

    await navigateToRoster(page, accountId, seasonId!, teamSeasonId!);

    const opened = await tryOpenPhotoDialog(page);
    if (!opened) {
      test.skip(true, 'No clickable avatar found on roster page (photo edit may not be allowed)');
      return;
    }

    const dialogTitle = page.getByRole('heading', { name: /update player photo/i });
    await page.getByRole('button', { name: 'Cancel' }).click();
    await dialogTitle.waitFor({ state: 'hidden', timeout: 10000 });

    for (let i = 0; i < 2; i++) {
      await tryOpenPhotoDialog(page);
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'Cancel' }).click();
      await dialogTitle.waitFor({ state: 'hidden', timeout: 10000 });
      await page.waitForTimeout(500);
    }

    expect(loopErrorCount, 'Repeated open/close should not cause infinite re-renders').toBe(0);
  });
});
