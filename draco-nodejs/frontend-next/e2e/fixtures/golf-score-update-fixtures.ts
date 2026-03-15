import { test as base } from './base-fixtures';
import { ApiHelper, ApiError } from '../helpers/api';
import fs from 'fs';
import path from 'path';

const AUTH_FILE = path.join(import.meta.dirname, '..', '.auth', 'admin.json');

function getJwtToken(): string {
  const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
  const origin = authData.origins?.[0];
  const tokenEntry = origin?.localStorage?.find(
    (entry: { name: string }) => entry.name === 'jwtToken',
  );
  if (!tokenEntry?.value) {
    throw new Error('JWT token not found in auth storage. Run auth-setup first.');
  }
  return tokenEntry.value;
}

export type ScoreUpdateTestData = {
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
  player2RosterId: string;
  player2ContactId: string;
};

export async function createScoreUpdateTestData(
  baseURL: string,
  workerIndex: number,
): Promise<ScoreUpdateTestData> {
  const token = getJwtToken();
  const api = new ApiHelper(baseURL, token);
  const accountId = process.env.E2E_GOLF_ACCOUNT_ID || '28';
  const courseId = process.env.E2E_GOLF_COURSE_ID || '16';
  const teeId = process.env.E2E_GOLF_TEE_ID || '62';
  const suffix = `${Date.now() % 10000000}w${workerIndex}`;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const matchDateTime = `${year}-${month}-${day}T14:00:00Z`;

  const league = await api.createLeague(accountId, { name: `E2E SU Lg ${suffix}` });
  const currentSeason = await api.fetchCurrentSeason(accountId);
  const leagueSeason = await api.addLeagueToSeason(accountId, currentSeason.id, league.id);

  await api.updateLeagueSetup(accountId, currentSeason.id, leagueSeason.id, {
    holesPerMatch: 18,
    teamSize: 1,
    scoringType: 'individual',
    useHandicapScoring: true,
    perHolePoints: 1,
    perNinePoints: 2,
    perMatchPoints: 3,
  });

  const team1Name = `E2E SU Alpha ${suffix}`;
  const team2Name = `E2E SU Bravo ${suffix}`;

  const team1 = await api.createTeam(accountId, currentSeason.id, leagueSeason.id, {
    name: team1Name,
  });
  const team2 = await api.createTeam(accountId, currentSeason.id, leagueSeason.id, {
    name: team2Name,
  });

  const player1 = await api.createAndSignPlayer(accountId, currentSeason.id, team1.id, {
    firstName: 'E2E',
    lastName: `SUAlpha${suffix}`,
    initialDifferential: 12.0,
  });
  const player2 = await api.createAndSignPlayer(accountId, currentSeason.id, team2.id, {
    firstName: 'E2E',
    lastName: `SUBravo${suffix}`,
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
    player2RosterId: player2.id,
    player2ContactId: player2.player.id,
  };
}

export async function cleanupScoreUpdateTestData(
  baseURL: string,
  data: ScoreUpdateTestData,
): Promise<void> {
  const token = getJwtToken();
  const api = new ApiHelper(baseURL, token);
  const errors: string[] = [];

  const tryCleanup = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return;
      errors.push(e instanceof Error ? e.message : String(e));
    }
  };

  await tryCleanup(() => api.deleteMatch(data.accountId, data.matchId, true));

  for (const rosterId of [data.player1RosterId, data.player2RosterId]) {
    await tryCleanup(() => api.deleteRosterEntry(data.accountId, data.seasonId, rosterId));
  }

  for (const contactId of [data.player1ContactId, data.player2ContactId]) {
    await tryCleanup(() => api.deleteContact(data.accountId, contactId));
  }

  for (const teamId of [data.team1Id, data.team2Id]) {
    await tryCleanup(() => api.deleteTeam(data.accountId, data.seasonId, teamId));
  }

  await tryCleanup(() =>
    api.removeLeagueFromSeason(data.accountId, data.seasonId, data.leagueSeasonId),
  );

  await tryCleanup(() => api.deleteLeague(data.accountId, data.leagueId));

  if (errors.length > 0) {
    throw new Error(`Score update test cleanup failed:\n  ${errors.join('\n  ')}`);
  }
}

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${process.env.PORT || '4001'}`;

type WorkerFixtures = {
  scoreUpdateData: ScoreUpdateTestData;
};

export const test = base.extend<object, WorkerFixtures>({
  scoreUpdateData: [
    async ({}, use, workerInfo) => {
      const data = await createScoreUpdateTestData(BASE_URL, workerInfo.workerIndex);
      await use(data);
      await cleanupScoreUpdateTestData(BASE_URL, data);
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
