import { test, expect } from '../../fixtures/golf-substitute-fixtures';
import { ApiHelper, tryCleanup } from '../../helpers/api';
import { getJwtToken, BASE_URL } from '../../helpers/auth';

test.describe('Golf Substitute Management', () => {
  test('displays existing substitute in the table', async ({ page, substituteData }) => {
    await page.goto(
      `/account/${substituteData.accountId}/seasons/${substituteData.seasonId}/golf/leagues/${substituteData.leagueSeasonId}/substitutes`,
    );
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    await table.waitFor({ state: 'visible', timeout: 10000 });

    await expect(table.getByText(substituteData.substituteName)).toBeVisible();

    await expect(table.getByText('18.0')).toBeVisible();
  });

  test('adds a new substitute via FAB and dialog', async ({ page, substituteData }) => {
    const uniqueSuffix = Date.now().toString().slice(-6);
    const firstName = `E2ENew${uniqueSuffix}`;
    const lastName = 'SubTest';

    await page.goto(
      `/account/${substituteData.accountId}/seasons/${substituteData.seasonId}/golf/leagues/${substituteData.leagueSeasonId}/substitutes`,
    );
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    await table.waitFor({ state: 'visible', timeout: 10000 });

    const fab = page.getByRole('button', { name: 'add substitute' });
    await fab.click();

    const menu = page.getByRole('menu');
    await menu.waitFor({ state: 'visible', timeout: 5000 });
    await menu.getByText('Create New Contact').click();

    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    await expect(dialog.getByText('Add Substitute')).toBeVisible();

    await dialog.getByLabel('First Name').fill(firstName);
    await dialog.getByLabel('Last Name').fill(lastName);
    await dialog.getByLabel('Initial Handicap Index').fill('20.5');

    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/golf/substitutes') && resp.request().method() === 'POST',
    );

    await dialog.getByRole('button', { name: /create|add|submit/i }).click();

    const response = await responsePromise;
    expect(response.status()).toBe(201);

    await dialog.waitFor({ state: 'hidden', timeout: 10000 });

    await expect(table.getByText(`${firstName} ${lastName}`)).toBeVisible({ timeout: 5000 });
    await expect(table.getByText('20.5')).toBeVisible();

    const responseBody = await response.json();
    const token = getJwtToken();
    const api = new ApiHelper(BASE_URL, token);
    const errors: string[] = [];

    await tryCleanup(errors, () =>
      api.deleteSubstitute(
        substituteData.accountId,
        substituteData.seasonId,
        substituteData.leagueSeasonId,
        responseBody.id,
      ),
    );
    await tryCleanup(errors, () =>
      api.deleteContact(substituteData.accountId, responseBody.player.id),
    );

    if (errors.length > 0) {
      console.warn(`Add-substitute test cleanup warnings:\n  ${errors.join('\n  ')}`);
    }
  });

  test('deletes a substitute via confirmation dialog', async ({ page, substituteData }) => {
    const uniqueSuffix = Date.now().toString().slice(-6);
    const firstName = `E2EDel${uniqueSuffix}`;
    const lastName = 'SubDel';
    const fullName = `${firstName} ${lastName}`;

    const token = getJwtToken();
    const api = new ApiHelper(BASE_URL, token);

    await page.goto(
      `/account/${substituteData.accountId}/seasons/${substituteData.seasonId}/golf/leagues/${substituteData.leagueSeasonId}/substitutes`,
    );
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    await table.waitFor({ state: 'visible', timeout: 10000 });

    const fab = page.getByRole('button', { name: 'add substitute' });
    await fab.click();

    const menu = page.getByRole('menu');
    await menu.waitFor({ state: 'visible', timeout: 5000 });
    await menu.getByText('Create New Contact').click();

    const addDialog = page.getByRole('dialog');
    await addDialog.waitFor({ state: 'visible', timeout: 5000 });

    await addDialog.getByLabel('First Name').fill(firstName);
    await addDialog.getByLabel('Last Name').fill(lastName);
    await addDialog.getByLabel('Initial Handicap Index').fill('10.0');

    const createResponse = page.waitForResponse(
      (resp) => resp.url().includes('/golf/substitutes') && resp.request().method() === 'POST',
    );

    await addDialog.getByRole('button', { name: /create|add|submit/i }).click();
    const createResp = await createResponse;
    const createBody = await createResp.json();

    try {
      await addDialog.waitFor({ state: 'hidden', timeout: 10000 });
      await expect(table.getByText(fullName)).toBeVisible({ timeout: 5000 });

      const row = table.locator('tr').filter({ hasText: fullName });
      await row.getByRole('button', { name: 'delete' }).click();

      const confirmDialog = page.getByRole('dialog');
      await confirmDialog.waitFor({ state: 'visible', timeout: 5000 });

      await expect(confirmDialog.getByText('Remove Substitute')).toBeVisible();
      await expect(confirmDialog.getByText(fullName)).toBeVisible();

      const deleteResponse = page.waitForResponse(
        (resp) => resp.url().includes('/golf/substitutes/') && resp.request().method() === 'DELETE',
      );

      await confirmDialog.getByRole('button', { name: 'Remove' }).click();

      const response = await deleteResponse;
      expect(response.status()).toBe(204);

      await confirmDialog.waitFor({ state: 'hidden', timeout: 10000 });

      await expect(table.getByText(fullName)).not.toBeVisible({ timeout: 5000 });
    } finally {
      const errors: string[] = [];
      await tryCleanup(errors, () =>
        api.deleteSubstitute(
          substituteData.accountId,
          substituteData.seasonId,
          substituteData.leagueSeasonId,
          createBody.id,
        ),
      );
      await tryCleanup(errors, () =>
        api.deleteContact(substituteData.accountId, createBody.player.id),
      );
      if (errors.length > 0) {
        console.warn(`Delete-substitute test cleanup warnings:\n  ${errors.join('\n  ')}`);
      }
    }
  });

  test('rejects signing existing substitute as sub on a team', async ({ substituteData }) => {
    const token = getJwtToken();
    const api = new ApiHelper(BASE_URL, token);
    const { accountId, seasonId, substituteContactId, team1Id } = substituteData;

    const result = await api.signPlayerAsSub(accountId, seasonId, team1Id, substituteContactId);

    expect(result.status).toBe(400);
  });

  test('edits a substitute handicap index', async ({ page, substituteData }) => {
    await page.goto(
      `/account/${substituteData.accountId}/seasons/${substituteData.seasonId}/golf/leagues/${substituteData.leagueSeasonId}/substitutes`,
    );
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    await table.waitFor({ state: 'visible', timeout: 10000 });

    const row = table.locator('tr').filter({ hasText: substituteData.substituteName });
    await row.getByRole('button', { name: 'edit' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    const handicapInput = dialog.getByLabel('Handicap Index');
    await handicapInput.clear();
    await handicapInput.fill('22.3');

    await dialog.getByRole('button', { name: 'Save' }).click();

    await dialog.waitFor({ state: 'hidden', timeout: 10000 });

    await expect(table.getByText('22.3')).toBeVisible({ timeout: 5000 });
  });
});
