import { test as base } from './base-fixtures';
import { ApiHelper, tryCleanup } from '../helpers/api';
import { getJwtToken, BASE_URL } from '../helpers/auth';
import { todayDateString } from '../helpers/date';

export type SubstituteTestData = {
  accountId: string;
  seasonId: string;
  leagueId: string;
  leagueSeasonId: string;
  courseId: string;
  teeId: string;
  team1Id: string;
  team2Id: string;
  team1Name: string;
  team2Name: string;
  matchId: string;
  player1RosterId: string;
  player1ContactId: string;
  player1Name: string;
  player2RosterId: string;
  player2ContactId: string;
  player2Name: string;
  substituteId: string;
  substituteGolferId: string;
  substituteContactId: string;
  substituteName: string;
  matchDate: string;
};

export async function createSubstituteTestData(
  baseURL: string,
  workerIndex: number,
): Promise<SubstituteTestData> {
  const token = getJwtToken();
  const api = new ApiHelper(baseURL, token);
  const accountId = process.env.E2E_GOLF_ACCOUNT_ID || '28';
  const courseId = process.env.E2E_GOLF_COURSE_ID || '16';
  const teeId = process.env.E2E_GOLF_TEE_ID || '62';
  const suffix = `${Date.now() % 10000000}w${workerIndex}`;

  const matchDate = todayDateString();
  const matchDateTime = `${matchDate}T14:00:00Z`;

  const league = await api.createLeague(accountId, { name: `E2E Sub Lg ${suffix}` });

  const currentSeason = await api.fetchCurrentSeason(accountId);

  const leagueSeason = await api.addLeagueToSeason(accountId, currentSeason.id, league.id);

  await api.updateLeagueSetup(accountId, currentSeason.id, leagueSeason.id, {
    holesPerMatch: 9,
    teamSize: 1,
    scoringType: 'individual',
  });

  const team1Name = `E2E SubA ${suffix}`;
  const team2Name = `E2E SubB ${suffix}`;

  const team1 = await api.createTeam(accountId, currentSeason.id, leagueSeason.id, {
    name: team1Name,
  });

  const team2 = await api.createTeam(accountId, currentSeason.id, leagueSeason.id, {
    name: team2Name,
  });

  const player1 = await api.createAndSignPlayer(accountId, currentSeason.id, team1.id, {
    firstName: 'E2E',
    lastName: `SubAlpha${suffix}`,
    initialDifferential: 12.0,
  });

  const player2 = await api.createAndSignPlayer(accountId, currentSeason.id, team2.id, {
    firstName: 'E2E',
    lastName: `SubBravo${suffix}`,
    initialDifferential: 15.0,
  });

  const match = await api.createMatch(accountId, currentSeason.id, {
    leagueSeasonId: leagueSeason.id,
    team1Id: team1.id,
    team2Id: team2.id,
    matchDateTime,
    courseId,
    teeId,
  });

  const substitute = await api.createSubstitute(accountId, currentSeason.id, leagueSeason.id, {
    firstName: 'E2E',
    lastName: `SubPlayer${suffix}`,
    initialDifferential: 18.0,
  });

  return {
    accountId,
    seasonId: currentSeason.id,
    leagueId: league.id,
    leagueSeasonId: leagueSeason.id,
    courseId,
    teeId,
    team1Id: team1.id,
    team2Id: team2.id,
    team1Name,
    team2Name,
    matchId: match.id,
    player1RosterId: player1.id,
    player1ContactId: player1.player.id,
    player1Name: `${player1.player.firstName} ${player1.player.lastName}`,
    player2RosterId: player2.id,
    player2ContactId: player2.player.id,
    player2Name: `${player2.player.firstName} ${player2.player.lastName}`,
    substituteId: substitute.id,
    substituteGolferId: substitute.golferId,
    substituteContactId: substitute.player.id,
    substituteName: `${substitute.player.firstName} ${substitute.player.lastName}`,
    matchDate,
  };
}

export async function cleanupSubstituteTestData(
  baseURL: string,
  data: SubstituteTestData,
): Promise<void> {
  const token = getJwtToken();
  const api = new ApiHelper(baseURL, token);
  const errors: string[] = [];

  await tryCleanup(errors, () => api.deleteMatch(data.accountId, data.matchId, true));

  await tryCleanup(errors, () =>
    api.deleteSubstitute(data.accountId, data.seasonId, data.leagueSeasonId, data.substituteId),
  );

  for (const rosterId of [data.player1RosterId, data.player2RosterId]) {
    await tryCleanup(errors, () => api.deleteRosterEntry(data.accountId, data.seasonId, rosterId));
  }

  for (const contactId of [
    data.player1ContactId,
    data.player2ContactId,
    data.substituteContactId,
  ]) {
    await tryCleanup(errors, () => api.deleteContact(data.accountId, contactId));
  }

  for (const teamId of [data.team1Id, data.team2Id]) {
    await tryCleanup(errors, () => api.deleteTeam(data.accountId, data.seasonId, teamId));
  }

  await tryCleanup(errors, () =>
    api.removeLeagueFromSeason(data.accountId, data.seasonId, data.leagueSeasonId),
  );

  await tryCleanup(errors, () => api.deleteLeague(data.accountId, data.leagueId));

  if (errors.length > 0) {
    throw new Error(`Substitute test cleanup failed:\n  ${errors.join('\n  ')}`);
  }
}

type WorkerFixtures = {
  substituteData: SubstituteTestData;
};

export const test = base.extend<object, WorkerFixtures>({
  substituteData: [
    async ({}, use, workerInfo) => {
      const data = await createSubstituteTestData(BASE_URL, workerInfo.workerIndex);
      await use(data);
      await cleanupSubstituteTestData(BASE_URL, data);
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
