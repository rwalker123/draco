import { test, expect } from '../../fixtures/golf-substitute-fixtures';

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

    const fab = page.getByRole('button', { name: 'add' });
    await fab.click();

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
