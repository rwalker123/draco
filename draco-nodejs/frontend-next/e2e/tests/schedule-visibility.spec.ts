import { test, expect } from '../fixtures/base-fixtures';
import { getJwtToken, BASE_URL } from '../helpers/auth';
import { getCurrentSeason, updateSeasonScheduleVisibility } from '@draco/shared-api-client';
import { createClient, createConfig } from '@draco/shared-api-client/generated/client';

function getAdminApiClient() {
  return createClient(
    createConfig({
      baseUrl: BASE_URL,
      auth: () => getJwtToken(),
    }),
  );
}

async function setScheduleVisible(accountId: string, seasonId: string, visible: boolean) {
  const client = getAdminApiClient();
  const { error } = await updateSeasonScheduleVisibility({
    client,
    path: { accountId, seasonId },
    body: { scheduleVisible: visible },
  });
  if (error) {
    throw new Error(`Failed to set schedule visibility: ${JSON.stringify(error)}`);
  }
}

test.describe.configure({ mode: 'serial' });

test.describe('Schedule Visibility Toggle', () => {
  const accountId = process.env.E2E_TEST_ACCOUNT_ID || '29';
  let seasonId: string;
  let originalVisibility: boolean;

  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'mutates a singleton account-level flag; running on multiple projects in parallel races on the same row',
  );

  test.beforeAll(async () => {
    const client = getAdminApiClient();
    const { data, error } = await getCurrentSeason({
      client,
      path: { accountId },
    });
    if (error || !data) {
      throw new Error(
        `Failed to load current season for account ${accountId}: ${JSON.stringify(error)}`,
      );
    }
    seasonId = data.id;
    originalVisibility = data.scheduleVisible ?? false;
  });

  test.afterAll(async () => {
    if (seasonId) {
      await setScheduleVisible(accountId, seasonId, originalVisibility);
    }
  });

  test.beforeEach(async () => {
    await setScheduleVisible(accountId, seasonId, true);
  });

  test('admin sees schedule visibility toggle on management page', async ({ page }) => {
    await page.goto(`${BASE_URL}/account/${accountId}/schedule-management`);
    await page.waitForLoadState('networkidle');

    const toggle = page.getByRole('switch', { name: /schedule visible to public/i });
    await expect(toggle).toBeVisible();
  });

  test('toggle off hides public schedule', async ({ page }) => {
    await setScheduleVisible(accountId, seasonId, false);

    await page.goto(`${BASE_URL}/account/${accountId}/schedule`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText('The schedule has not been published yet. Please check back soon.'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('toggle on shows public schedule', async ({ page }) => {
    await setScheduleVisible(accountId, seasonId, true);

    await page.goto(`${BASE_URL}/account/${accountId}/schedule`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText('The schedule has not been published yet. Please check back soon.'),
    ).not.toBeVisible({ timeout: 10_000 });
  });

  test('admin can flip toggle via UI and state persists', async ({ page }) => {
    await page.goto(`${BASE_URL}/account/${accountId}/schedule-management`);
    await page.waitForLoadState('networkidle');

    const toggle = page.getByRole('switch', { name: /schedule visible to public/i });
    await expect(toggle).toBeChecked();

    await toggle.click();
    await expect(toggle).not.toBeChecked();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(toggle).not.toBeChecked();
  });
});
