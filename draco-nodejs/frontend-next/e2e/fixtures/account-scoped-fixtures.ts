import { test as base, getRequiredE2eTestAccountId } from './base-fixtures';
import { ApiHelper, tryCleanup } from '../helpers/api';
import { getJwtToken, BASE_URL } from '../helpers/auth';
import { appendCleanupLog } from '../helpers/cleanupLog';

export type AccountScopedData = {
  accountId: string;
  seasonId: string;
  leagueSeasonId: string;
  leagueId: string;
  suffix: string;
};

async function createAccountScopedData(
  baseURL: string,
  workerIndex: number,
): Promise<AccountScopedData> {
  const api = new ApiHelper(baseURL, getJwtToken());
  const accountId = getRequiredE2eTestAccountId();
  const suffix = `${Date.now() % 10_000_000}w${workerIndex}`;

  const league = await api.createLeague(accountId, { name: `E2E Lg ${suffix}` });
  const currentSeason = await api.fetchCurrentSeason(accountId);
  const leagueSeason = await api.addLeagueToSeason(accountId, currentSeason.id, league.id);

  return {
    accountId,
    seasonId: currentSeason.id,
    leagueSeasonId: leagueSeason.id,
    leagueId: league.id,
    suffix,
  };
}

async function cleanupAccountScopedData(baseURL: string, data: AccountScopedData): Promise<void> {
  const api = new ApiHelper(baseURL, getJwtToken());
  const errors: string[] = [];

  await tryCleanup(errors, () =>
    api.removeLeagueFromSeason(data.accountId, data.seasonId, data.leagueSeasonId),
  );
  await tryCleanup(errors, () => api.deleteLeague(data.accountId, data.leagueId));

  appendCleanupLog(`account-scoped ${data.suffix}`, errors);
}

type WorkerFixtures = { accountScoped: AccountScopedData };

export const test = base.extend<object, WorkerFixtures>({
  accountScoped: [
    async ({}, use, workerInfo) => {
      const data = await createAccountScopedData(BASE_URL, workerInfo.workerIndex);
      await use(data);
      await cleanupAccountScopedData(BASE_URL, data);
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
