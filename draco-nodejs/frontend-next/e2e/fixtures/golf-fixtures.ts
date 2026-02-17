import { test as base } from './base-fixtures';
import { ApiHelper } from '../helpers/api';
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

export type GolfTestData = {
  accountId: string;
  seasonId: string;
  leagueId: string;
  leagueSeasonId: string;
  courseId: string;
  teeId: string;
  team1Id: string;
  team2Id: string;
  matchId: string;
  player1RosterId: string;
  player1ContactId: string;
  player1Name: string;
  player2RosterId: string;
};

export async function createGolfTestData(
  baseURL: string,
  workerIndex: number,
): Promise<GolfTestData> {
  const token = getJwtToken();
  const api = new ApiHelper(baseURL, token);
  const accountId = process.env.E2E_GOLF_ACCOUNT_ID || '28';
  const courseId = process.env.E2E_GOLF_COURSE_ID || '16';
  const teeId = process.env.E2E_GOLF_TEE_ID || '62';
  const suffix = `${Date.now() % 10000000}w${workerIndex}`;

  const league = await api.createLeague(accountId, { name: `E2E Lg ${suffix}` });

  const season = await api.createSeason(accountId, { name: `E2E Sn ${suffix}` });

  const leagueSeason = await api.addLeagueToSeason(accountId, season.id, league.id);

  await api.updateLeagueSetup(accountId, season.id, leagueSeason.id, {
    holesPerMatch: 9,
    teamSize: 2,
    scoringType: 'individual',
  });

  const team1 = await api.createTeam(accountId, season.id, leagueSeason.id, {
    name: `E2E Alpha ${suffix}`,
  });

  const team2 = await api.createTeam(accountId, season.id, leagueSeason.id, {
    name: `E2E Bravo ${suffix}`,
  });

  const player1 = await api.createAndSignPlayer(accountId, season.id, team1.id, {
    firstName: 'E2E',
    lastName: `Golfer${suffix}`,
    initialDifferential: 15.0,
  });

  const player2 = await api.createAndSignPlayer(accountId, season.id, team2.id, {
    firstName: 'E2E',
    lastName: `Opp${suffix}`,
  });

  const match = await api.createMatch(accountId, season.id, {
    leagueSeasonId: leagueSeason.id,
    team1Id: team1.id,
    team2Id: team2.id,
    matchDateTime: '2025-06-15T14:00:00Z',
    courseId,
    teeId,
  });

  await api.submitMatchResults(accountId, match.id, {
    courseId,
    scores: [
      {
        teamSeasonId: team1.id,
        rosterId: player1.id,
        score: {
          courseId,
          teeId,
          datePlayed: '2025-06-15',
          holesPlayed: 9,
          totalsOnly: true,
          totalScore: 42,
        },
      },
      {
        teamSeasonId: team2.id,
        rosterId: player2.id,
        score: {
          courseId,
          teeId,
          datePlayed: '2025-06-15',
          holesPlayed: 9,
          totalsOnly: true,
          totalScore: 45,
        },
      },
    ],
  });

  return {
    accountId,
    seasonId: season.id,
    leagueId: league.id,
    leagueSeasonId: leagueSeason.id,
    courseId,
    teeId,
    team1Id: team1.id,
    team2Id: team2.id,
    matchId: match.id,
    player1RosterId: player1.id,
    player1ContactId: player1.player.id,
    player1Name: `${player1.player.firstName} ${player1.player.lastName}`,
    player2RosterId: player2.id,
  };
}

export async function cleanupGolfTestData(baseURL: string, data: GolfTestData): Promise<void> {
  const token = getJwtToken();
  const api = new ApiHelper(baseURL, token);

  try {
    await api.deleteMatch(data.accountId, data.matchId, true);
  } catch {
    /* match may already be deleted */
  }

  for (const rosterId of [data.player1RosterId, data.player2RosterId]) {
    try {
      await api.deleteRosterEntry(data.accountId, data.seasonId, rosterId);
    } catch {
      /* roster entry may already be deleted */
    }
  }

  try {
    await api.removeLeagueFromSeason(data.accountId, data.seasonId, data.leagueSeasonId);
  } catch {
    /* may already be removed */
  }

  try {
    await api.deleteSeason(data.accountId, data.seasonId);
  } catch {
    /* may already be deleted */
  }

  try {
    await api.deleteLeague(data.accountId, data.leagueId);
  } catch {
    /* may already be deleted */
  }
}

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${process.env.PORT || '4001'}`;

type WorkerFixtures = {
  golfData: GolfTestData;
};

export const test = base.extend<object, WorkerFixtures>({
  golfData: [
    async ({}, use, workerInfo) => {
      const data = await createGolfTestData(BASE_URL, workerInfo.workerIndex);
      await use(data);
      await cleanupGolfTestData(BASE_URL, data);
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
