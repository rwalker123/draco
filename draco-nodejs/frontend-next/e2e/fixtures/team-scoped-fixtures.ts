import { test as base } from './base-fixtures';
import { ApiHelper, tryCleanup } from '../helpers/api';
import { getJwtToken, BASE_URL } from '../helpers/auth';
import { appendCleanupLog } from '../helpers/cleanupLog';
import type { AccountScopedData } from './account-scoped-fixtures';

export type TeamScopedData = AccountScopedData & {
  teamId: string;
  teamName: string;
  teamSeasonId: string;
  rosterContactIds: string[];
  rosterMemberIds: string[];
};

async function createTeamScopedData(baseURL: string, workerIndex: number): Promise<TeamScopedData> {
  const api = new ApiHelper(baseURL, getJwtToken());
  const accountId = process.env.E2E_TEST_ACCOUNT_ID!;
  const suffix = `${Date.now() % 10_000_000}w${workerIndex}`;

  const league = await api.createLeague(accountId, { name: `E2E Lg ${suffix}` });
  const currentSeason = await api.fetchCurrentSeason(accountId);
  const leagueSeason = await api.addLeagueToSeason(accountId, currentSeason.id, league.id);

  const teamName = `E2E Tm ${suffix}`;
  const teamSeason = await api.createBaseballTeam(accountId, currentSeason.id, leagueSeason.id, {
    name: teamName,
  });

  const contactA = await api.createAccountContact(accountId, {
    firstName: 'E2E',
    lastName: `PlayerA${suffix}`,
  });
  const contactB = await api.createAccountContact(accountId, {
    firstName: 'E2E',
    lastName: `PlayerB${suffix}`,
  });
  const contactC = await api.createAccountContact(accountId, {
    firstName: 'E2E',
    lastName: `PlayerC${suffix}`,
  });

  const memberA = await api.signContactToRoster(
    accountId,
    currentSeason.id,
    teamSeason.id,
    contactA.id,
  );
  const memberB = await api.signContactToRoster(
    accountId,
    currentSeason.id,
    teamSeason.id,
    contactB.id,
  );
  const memberC = await api.signContactToRoster(
    accountId,
    currentSeason.id,
    teamSeason.id,
    contactC.id,
  );

  return {
    accountId,
    seasonId: currentSeason.id,
    leagueSeasonId: leagueSeason.id,
    leagueId: league.id,
    suffix,
    teamId: teamSeason.team.id,
    teamName,
    teamSeasonId: teamSeason.id,
    rosterContactIds: [contactA.id, contactB.id, contactC.id],
    rosterMemberIds: [memberA.id, memberB.id, memberC.id],
  };
}

async function cleanupTeamScopedData(baseURL: string, data: TeamScopedData): Promise<void> {
  const api = new ApiHelper(baseURL, getJwtToken());
  const errors: string[] = [];

  for (const rosterMemberId of [...data.rosterMemberIds].reverse()) {
    await tryCleanup(errors, () =>
      api.deleteRosterMember(data.accountId, data.seasonId, data.teamSeasonId, rosterMemberId),
    );
  }

  for (const contactId of [...data.rosterContactIds].reverse()) {
    await tryCleanup(errors, () => api.deleteContact(data.accountId, contactId));
  }

  await tryCleanup(errors, () =>
    api.deleteSeasonTeam(data.accountId, data.seasonId, data.teamSeasonId),
  );

  await tryCleanup(errors, () => api.deleteTeamDefinition(data.accountId, data.teamId));

  await tryCleanup(errors, () =>
    api.removeLeagueFromSeason(data.accountId, data.seasonId, data.leagueSeasonId),
  );

  await tryCleanup(errors, () => api.deleteLeague(data.accountId, data.leagueId));

  appendCleanupLog(`team-scoped ${data.suffix}`, errors);
}

type WorkerFixtures = { teamScoped: TeamScopedData };

export const test = base.extend<object, WorkerFixtures>({
  teamScoped: [
    async ({}, use, workerInfo) => {
      const data = await createTeamScopedData(BASE_URL, workerInfo.workerIndex);
      await use(data);
      await cleanupTeamScopedData(BASE_URL, data);
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
