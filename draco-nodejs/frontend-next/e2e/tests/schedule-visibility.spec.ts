import { test as base, expect } from '../fixtures/base-fixtures';
import { ApiHelper, tryCleanup } from '../helpers/api';
import { getJwtToken, BASE_URL } from '../helpers/auth';
import { appendCleanupLog } from '../helpers/cleanupLog';
import { updateSeasonScheduleVisibility } from '@draco/shared-api-client';
import { createClient, createConfig } from '@draco/shared-api-client/generated/client';
import type { LeagueSeasonWithDivision, LeagueSeason, TeamSeason } from '@draco/shared-api-client';

type VisibilityFixtureData = {
  accountId: string;
  seasonId: string;
  leagueId: string;
  leagueSeasonId: string;
  teamId: string;
};

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

async function createVisibilityTestData(workerIndex: number): Promise<VisibilityFixtureData> {
  const token = getJwtToken();
  const api = new ApiHelper(BASE_URL, token);
  const accountId = process.env.E2E_TEST_ACCOUNT_ID || '29';
  const suffix = `${Date.now() % 10000000}w${workerIndex}`;

  const season: LeagueSeasonWithDivision = await api.createSeason(accountId, {
    name: `E2E Vis Season ${suffix}`,
  });

  const league = await api.createLeague(accountId, { name: `E2E Vis Lg ${suffix}` });

  const leagueSeason: LeagueSeason = await api.addLeagueToSeason(accountId, season.id, league.id);

  const team: TeamSeason = await api.createTeam(accountId, season.id, leagueSeason.id, {
    name: `E2E Vis Team ${suffix}`,
  });

  await setScheduleVisible(accountId, season.id, true);

  return {
    accountId,
    seasonId: season.id,
    leagueId: league.id,
    leagueSeasonId: leagueSeason.id,
    teamId: team.id,
  };
}

async function cleanupVisibilityTestData(data: VisibilityFixtureData): Promise<void> {
  const token = getJwtToken();
  const api = new ApiHelper(BASE_URL, token);
  const errors: string[] = [];

  await tryCleanup(errors, () =>
    api.removeLeagueFromSeason(data.accountId, data.seasonId, data.leagueSeasonId),
  );

  await tryCleanup(errors, () => api.deleteLeague(data.accountId, data.leagueId));

  await tryCleanup(errors, () => api.deleteSeason(data.accountId, data.seasonId));

  appendCleanupLog('schedule-visibility cleanup', errors);

  if (errors.length > 0) {
    throw new Error(`Schedule visibility test cleanup failed:\n  ${errors.join('\n  ')}`);
  }
}

type WorkerFixtures = {
  visibilityData: VisibilityFixtureData;
};

const test = base.extend<object, WorkerFixtures>({
  visibilityData: [
    async ({}, use, workerInfo) => {
      const data = await createVisibilityTestData(workerInfo.workerIndex);
      await use(data);
      await cleanupVisibilityTestData(data);
    },
    { scope: 'worker' },
  ],
});

test.describe('Schedule Visibility Toggle', () => {
  test.beforeEach(async ({ visibilityData }) => {
    await setScheduleVisible(visibilityData.accountId, visibilityData.seasonId, true);
  });

  test('admin sees schedule visibility toggle on management page', async ({
    page,
    visibilityData,
  }) => {
    await page.goto(`${BASE_URL}/account/${visibilityData.accountId}/schedule-management`);
    await page.waitForLoadState('networkidle');

    const toggle = page.getByRole('switch', { name: /schedule visible to public/i });
    await expect(toggle).toBeVisible();
  });

  test('toggle off hides public schedule', async ({ page, visibilityData }) => {
    await setScheduleVisible(visibilityData.accountId, visibilityData.seasonId, false);

    await page.goto(`${BASE_URL}/account/${visibilityData.accountId}/schedule`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText('The schedule has not been published yet. Please check back soon.'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('toggle on shows public schedule', async ({ page, visibilityData }) => {
    await setScheduleVisible(visibilityData.accountId, visibilityData.seasonId, true);

    await page.goto(`${BASE_URL}/account/${visibilityData.accountId}/schedule`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText('The schedule has not been published yet. Please check back soon.'),
    ).not.toBeVisible({ timeout: 10_000 });
  });

  test('admin can flip toggle via UI and state persists', async ({ page, visibilityData }) => {
    await page.goto(`${BASE_URL}/account/${visibilityData.accountId}/schedule-management`);
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
