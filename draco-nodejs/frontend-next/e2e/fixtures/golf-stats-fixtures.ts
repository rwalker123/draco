import { test as base } from './base-fixtures';
import { ApiHelper, tryCleanup } from '../helpers/api';
import { getJwtToken, BASE_URL } from '../helpers/auth';

type PlayerData = {
  rosterId: string;
  contactId: string;
  firstName: string;
  lastName: string;
};

type TeamData = {
  id: string;
  name: string;
  players: PlayerData[];
};

type MatchData = {
  id: string;
  weekNumber: number;
  team1Id: string;
  team2Id: string;
};

type LeagueData = {
  leagueId: string;
  leagueSeasonId: string;
  flightId: string;
  teams: TeamData[];
  matches: MatchData[];
};

export type GolfStatsTestData = {
  accountId: string;
  seasonId: string;
  courseId: string;
  teeId: string;
  par3Holes: number[];
  individual: LeagueData;
  team: LeagueData;
};

const INDIVIDUAL_SCORES: number[][] = [
  [4, 3, 5, 4, 4, 3, 5, 4, 4],
  [5, 4, 5, 5, 4, 4, 5, 5, 5],
  [5, 4, 4, 5, 5, 4, 4, 5, 5],
  [4, 5, 5, 4, 5, 5, 4, 4, 5],
  [5, 5, 4, 5, 4, 4, 5, 5, 4],
  [4, 4, 5, 5, 5, 4, 5, 4, 5],
];

const INDIVIDUAL_SCORES_W2: number[][] = [
  [4, 4, 4, 4, 5, 3, 4, 5, 5],
  [4, 5, 5, 4, 5, 4, 5, 4, 5],
  [5, 5, 4, 4, 4, 5, 5, 4, 4],
  [5, 4, 4, 5, 5, 4, 5, 5, 4],
  [4, 5, 5, 5, 4, 4, 4, 5, 5],
  [5, 4, 5, 4, 4, 5, 5, 4, 5],
];

const INDIVIDUAL_SCORES_W3: number[][] = [
  [5, 4, 4, 4, 4, 3, 5, 4, 4],
  [5, 4, 5, 5, 5, 3, 5, 5, 5],
  [4, 5, 5, 4, 5, 4, 4, 5, 5],
  [5, 5, 4, 4, 4, 5, 5, 4, 4],
  [4, 4, 5, 5, 5, 4, 5, 4, 5],
  [5, 4, 4, 5, 4, 5, 4, 5, 5],
];

const INDIVIDUAL_PUTTS_W1: (number | null)[][] = [
  [2, 2, 2, 2, 2, 1, 2, 2, 2],
  [2, 2, 3, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2],
];

const INDIVIDUAL_PUTTS_W2: (number | null)[][] = [
  [2, 2, 2, 2, 3, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2],
];

const INDIVIDUAL_PUTTS_W3: (number | null)[][] = [
  [2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 3],
  [2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2],
];

const INDIVIDUAL_FAIRWAYS_W1: (boolean | null)[][] = [
  [true, false, null, true, true, null, false, true, true],
  [false, true, null, true, false, null, true, false, true],
  [true, true, null, false, true, null, true, true, false],
  [false, true, null, true, true, null, false, true, false],
  [true, false, null, false, true, null, true, true, true],
  [true, true, null, true, false, null, true, false, true],
];

function sumScores(scores: number[]): number {
  return scores.reduce((a, b) => a + b, 0);
}

async function buildIndividualLeague(
  api: ApiHelper,
  accountId: string,
  seasonId: string,
  courseId: string,
  teeId: string,
  suffix: string,
): Promise<LeagueData> {
  const league = await api.createLeague(accountId, { name: `E2E Stat Ind ${suffix}` });
  const leagueSeason = await api.addLeagueToSeason(accountId, seasonId, league.id);

  await api.updateLeagueSetup(accountId, seasonId, leagueSeason.id, {
    holesPerMatch: 9,
    teamSize: 1,
    scoringType: 'individual',
    useHandicapScoring: true,
    enablePuttContest: true,
    perHolePoints: 1,
    perNinePoints: 2,
    perMatchPoints: 3,
  });

  const playerLastNames = ['StAlpha', 'StBravo', 'StCharlie', 'StDelta', 'StEcho', 'StFoxtrot'];
  const teams: TeamData[] = [];

  for (let i = 0; i < 6; i++) {
    const team = await api.createTeam(accountId, seasonId, leagueSeason.id, {
      name: `E2E SI T${i + 1} ${suffix}`,
    });
    const player = await api.createAndSignPlayer(accountId, seasonId, team.id, {
      firstName: 'E2E',
      lastName: `${playerLastNames[i]}${suffix}`,
      initialDifferential: 10.0 + i * 2,
    });
    teams.push({
      id: team.id,
      name: team.name,
      players: [
        {
          rosterId: player.id,
          contactId: player.player.id,
          firstName: player.player.firstName,
          lastName: player.player.lastName,
        },
      ],
    });
  }

  const matchupsByWeek = [
    [
      [0, 1],
      [2, 3],
      [4, 5],
    ],
    [
      [0, 2],
      [1, 4],
      [3, 5],
    ],
    [
      [0, 3],
      [1, 5],
      [2, 4],
    ],
  ];

  const scoresByWeek = [INDIVIDUAL_SCORES, INDIVIDUAL_SCORES_W2, INDIVIDUAL_SCORES_W3];
  const puttsByWeek = [INDIVIDUAL_PUTTS_W1, INDIVIDUAL_PUTTS_W2, INDIVIDUAL_PUTTS_W3];
  const fairwaysByWeek = [INDIVIDUAL_FAIRWAYS_W1, null, null];

  const matches: MatchData[] = [];
  const datePlayed = '2025-06-15';

  for (let weekIdx = 0; weekIdx < 3; weekIdx++) {
    const weekNumber = weekIdx + 1;
    const weekScores = scoresByWeek[weekIdx];
    const weekPutts = puttsByWeek[weekIdx];
    const weekFairways = fairwaysByWeek[weekIdx];

    for (const [t1Idx, t2Idx] of matchupsByWeek[weekIdx]) {
      const match = await api.createMatch(accountId, seasonId, {
        leagueSeasonId: leagueSeason.id,
        team1Id: teams[t1Idx].id,
        team2Id: teams[t2Idx].id,
        matchDateTime: `2025-06-${14 + weekNumber}T14:00:00Z`,
        courseId,
        teeId,
        weekNumber,
      });

      const p1 = teams[t1Idx].players[0];
      const p2 = teams[t2Idx].players[0];
      const p1Scores = weekScores[t1Idx];
      const p2Scores = weekScores[t2Idx];

      await api.submitMatchResults(accountId, match.id, {
        courseId,
        teeId,
        scores: [
          {
            teamSeasonId: teams[t1Idx].id,
            rosterId: p1.rosterId,
            score: {
              courseId,
              teeId,
              datePlayed,
              holesPlayed: 9,
              totalsOnly: false,
              holeScores: p1Scores,
              putts: weekPutts[t1Idx],
              fairwaysHit: weekFairways ? weekFairways[t1Idx] : undefined,
            },
          },
          {
            teamSeasonId: teams[t2Idx].id,
            rosterId: p2.rosterId,
            score: {
              courseId,
              teeId,
              datePlayed,
              holesPlayed: 9,
              totalsOnly: false,
              holeScores: p2Scores,
              putts: weekPutts[t2Idx],
              fairwaysHit: weekFairways ? weekFairways[t2Idx] : undefined,
            },
          },
        ],
      });

      await api.updateMatchStatus(accountId, match.id, 1);

      matches.push({
        id: match.id,
        weekNumber,
        team1Id: teams[t1Idx].id,
        team2Id: teams[t2Idx].id,
      });
    }
  }

  const standings = await api.getSeasonStandings(accountId, seasonId);
  const flightId = standings.flights[0]?.flightId ?? '';

  return {
    leagueId: league.id,
    leagueSeasonId: leagueSeason.id,
    flightId,
    teams,
    matches,
  };
}

async function buildTeamLeague(
  api: ApiHelper,
  accountId: string,
  seasonId: string,
  courseId: string,
  teeId: string,
  suffix: string,
): Promise<LeagueData> {
  const league = await api.createLeague(accountId, { name: `E2E Stat Team ${suffix}` });
  const leagueSeason = await api.addLeagueToSeason(accountId, seasonId, league.id);

  await api.updateLeagueSetup(accountId, seasonId, leagueSeason.id, {
    holesPerMatch: 9,
    teamSize: 2,
    scoringType: 'individual',
    useHandicapScoring: true,
    enablePuttContest: true,
    perHolePoints: 1,
    perNinePoints: 2,
    perMatchPoints: 3,
  });

  const teamPlayerNames = [
    ['StTA1', 'StTA2'],
    ['StTB1', 'StTB2'],
    ['StTC1', 'StTC2'],
    ['StTD1', 'StTD2'],
    ['StTE1', 'StTE2'],
    ['StTF1', 'StTF2'],
  ];

  const teams: TeamData[] = [];

  for (let i = 0; i < 6; i++) {
    const team = await api.createTeam(accountId, seasonId, leagueSeason.id, {
      name: `E2E ST T${i + 1} ${suffix}`,
    });
    const players: PlayerData[] = [];

    for (let j = 0; j < 2; j++) {
      const player = await api.createAndSignPlayer(accountId, seasonId, team.id, {
        firstName: 'E2E',
        lastName: `${teamPlayerNames[i][j]}${suffix}`,
        initialDifferential: 12.0 + i + j,
      });
      players.push({
        rosterId: player.id,
        contactId: player.player.id,
        firstName: player.player.firstName,
        lastName: player.player.lastName,
      });
    }

    teams.push({ id: team.id, name: team.name, players });
  }

  const matchupsByWeek = [
    [
      [0, 1],
      [2, 3],
      [4, 5],
    ],
    [
      [0, 2],
      [1, 4],
      [3, 5],
    ],
    [
      [0, 3],
      [1, 5],
      [2, 4],
    ],
  ];

  const scoresByWeek = [INDIVIDUAL_SCORES, INDIVIDUAL_SCORES_W2, INDIVIDUAL_SCORES_W3];
  const matches: MatchData[] = [];
  const datePlayed = '2025-06-15';

  for (let weekIdx = 0; weekIdx < 3; weekIdx++) {
    const weekNumber = weekIdx + 1;
    const weekScores = scoresByWeek[weekIdx];

    for (const [t1Idx, t2Idx] of matchupsByWeek[weekIdx]) {
      const match = await api.createMatch(accountId, seasonId, {
        leagueSeasonId: leagueSeason.id,
        team1Id: teams[t1Idx].id,
        team2Id: teams[t2Idx].id,
        matchDateTime: `2025-06-${14 + weekNumber}T14:00:00Z`,
        courseId,
        teeId,
        weekNumber,
      });

      const scoreEntries = [];

      for (const playerIdx of [t1Idx, t2Idx]) {
        const teamPlayers = teams[playerIdx].players;
        const baseScores = weekScores[playerIdx];

        for (let pIdx = 0; pIdx < teamPlayers.length; pIdx++) {
          const holeScores =
            pIdx === 0
              ? baseScores
              : baseScores.map((s) => Math.min(s + (pIdx % 2 === 0 ? -1 : 1), 7));
          const totalScore = sumScores(holeScores);
          scoreEntries.push({
            teamSeasonId: teams[playerIdx].id,
            rosterId: teamPlayers[pIdx].rosterId,
            score: {
              courseId,
              teeId,
              datePlayed,
              holesPlayed: 9,
              totalsOnly: true,
              totalScore,
            },
          });
        }
      }

      await api.submitMatchResults(accountId, match.id, {
        courseId,
        teeId,
        scores: scoreEntries,
      });

      await api.updateMatchStatus(accountId, match.id, 1);

      matches.push({
        id: match.id,
        weekNumber,
        team1Id: teams[t1Idx].id,
        team2Id: teams[t2Idx].id,
      });
    }
  }

  const standings = await api.getSeasonStandings(accountId, seasonId);
  const flightId = standings.flights[standings.flights.length - 1]?.flightId ?? '';

  return {
    leagueId: league.id,
    leagueSeasonId: leagueSeason.id,
    flightId,
    teams,
    matches,
  };
}

export async function createGolfStatsTestData(
  baseURL: string,
  workerIndex: number,
): Promise<GolfStatsTestData> {
  const token = getJwtToken();
  const api = new ApiHelper(baseURL, token);
  const accountId = process.env.E2E_GOLF_ACCOUNT_ID || '28';
  const courseId = process.env.E2E_GOLF_COURSE_ID || '16';
  const teeId = process.env.E2E_GOLF_TEE_ID || '62';
  const suffix = `${Date.now() % 10000000}w${workerIndex}`;

  const season = await api.createSeason(accountId, { name: `E2E Stat Sn ${suffix}` });

  const individual = await buildIndividualLeague(
    api,
    accountId,
    season.id,
    courseId,
    teeId,
    suffix,
  );

  const team = await buildTeamLeague(api, accountId, season.id, courseId, teeId, suffix);

  const course = await api.getCourse(accountId, courseId);
  const par3Holes: number[] = [];
  if (course.mensPar) {
    course.mensPar.forEach((par: number, i: number) => {
      if (par === 3) par3Holes.push(i + 1);
    });
  }

  return {
    accountId,
    seasonId: season.id,
    courseId,
    teeId,
    par3Holes,
    individual,
    team,
  };
}

export async function cleanupGolfStatsTestData(
  baseURL: string,
  data: GolfStatsTestData,
): Promise<void> {
  const token = getJwtToken();
  const api = new ApiHelper(baseURL, token);
  const errors: string[] = [];

  for (const league of [data.individual, data.team]) {
    for (const match of league.matches) {
      await tryCleanup(errors, () => api.deleteMatch(data.accountId, match.id, true));
    }

    for (const team of league.teams) {
      for (const player of team.players) {
        await tryCleanup(errors, () =>
          api.deleteRosterEntry(data.accountId, data.seasonId, player.rosterId),
        );
      }
    }

    for (const team of league.teams) {
      for (const player of team.players) {
        await tryCleanup(errors, () => api.deleteContact(data.accountId, player.contactId));
      }
    }

    for (const team of league.teams) {
      await tryCleanup(errors, () => api.deleteTeam(data.accountId, data.seasonId, team.id));
    }

    await tryCleanup(errors, () =>
      api.removeLeagueFromSeason(data.accountId, data.seasonId, league.leagueSeasonId),
    );

    await tryCleanup(errors, () => api.deleteLeague(data.accountId, league.leagueId));
  }

  await tryCleanup(errors, () => api.deleteSeason(data.accountId, data.seasonId));

  if (errors.length > 0) {
    throw new Error(`Golf stats cleanup failed:\n  ${errors.join('\n  ')}`);
  }
}

type WorkerFixtures = {
  statsData: GolfStatsTestData;
};

export const test = base.extend<object, WorkerFixtures>({
  statsData: [
    async ({}, use, workerInfo) => {
      const data = await createGolfStatsTestData(BASE_URL, workerInfo.workerIndex);
      await use(data);
      await cleanupGolfStatsTestData(BASE_URL, data);
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
