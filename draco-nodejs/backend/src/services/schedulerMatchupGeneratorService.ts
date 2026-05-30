import type {
  SchedulerGameRequest,
  SchedulerGenerateMatchupsResult,
  SchedulerMatchupGenerationSummary,
} from '@draco/shared-schemas';

export interface GeneratorTeamInput {
  teamSeasonId: string;
  divisionSeasonId: string | null;
}

export interface GeneratorLeagueInput {
  leagueSeasonId: string;
  teams: GeneratorTeamInput[];
  inDivisionGameCount: number;
  crossDivisionGameCount: number;
}

export class SchedulerMatchupGeneratorService {
  generate(leagues: GeneratorLeagueInput[]): SchedulerGenerateMatchupsResult {
    const allMatchups: SchedulerGameRequest[] = [];
    const summaries: SchedulerMatchupGenerationSummary[] = [];

    for (const league of leagues) {
      const { matchups, summary } = this.generateLeagueMatchups(league);
      allMatchups.push(...matchups);
      summaries.push(summary);
    }

    return { matchups: allMatchups, summary: summaries };
  }

  private generateLeagueMatchups(league: GeneratorLeagueInput): {
    matchups: SchedulerGameRequest[];
    summary: SchedulerMatchupGenerationSummary;
  } {
    const { leagueSeasonId, teams, inDivisionGameCount, crossDivisionGameCount } = league;

    const sortedTeams = [...teams].sort((a, b) => a.teamSeasonId.localeCompare(b.teamSeasonId));

    const divisionGroups = new Map<string, GeneratorTeamInput[]>();
    for (const team of sortedTeams) {
      const key = team.divisionSeasonId ?? '__null__';
      const existing = divisionGroups.get(key);
      if (existing) {
        existing.push(team);
      } else {
        divisionGroups.set(key, [team]);
      }
    }

    const sortedKeys = [...divisionGroups.keys()].sort();

    const matchups: SchedulerGameRequest[] = [];
    const homeGameTally = new Map<string, number>();

    for (const team of sortedTeams) {
      homeGameTally.set(team.teamSeasonId, 0);
    }

    let inDivisionGames = 0;
    let crossDivisionGames = 0;

    const allTeamsSorted = sortedKeys.flatMap((key) => divisionGroups.get(key)!);

    const maxGameCount = Math.max(inDivisionGameCount, crossDivisionGameCount);

    for (let k = 0; k < maxGameCount; k++) {
      for (let i = 0; i < allTeamsSorted.length; i++) {
        for (let j = i + 1; j < allTeamsSorted.length; j++) {
          const teamA = allTeamsSorted[i];
          const teamB = allTeamsSorted[j];

          const sameGroup =
            (teamA.divisionSeasonId ?? '__null__') === (teamB.divisionSeasonId ?? '__null__');
          const gameCount = sameGroup ? inDivisionGameCount : crossDivisionGameCount;

          if (k >= gameCount) {
            continue;
          }

          const minId =
            teamA.teamSeasonId < teamB.teamSeasonId ? teamA.teamSeasonId : teamB.teamSeasonId;
          const maxId =
            teamA.teamSeasonId < teamB.teamSeasonId ? teamB.teamSeasonId : teamA.teamSeasonId;

          const id = `gen-${leagueSeasonId}-${minId}-${maxId}-${k}`;

          const tallyA = homeGameTally.get(teamA.teamSeasonId) ?? 0;
          const tallyB = homeGameTally.get(teamB.teamSeasonId) ?? 0;

          let homeTeamSeasonId: string;
          let visitorTeamSeasonId: string;

          if (tallyA < tallyB) {
            homeTeamSeasonId = teamA.teamSeasonId;
            visitorTeamSeasonId = teamB.teamSeasonId;
          } else if (tallyB < tallyA) {
            homeTeamSeasonId = teamB.teamSeasonId;
            visitorTeamSeasonId = teamA.teamSeasonId;
          } else {
            if (teamA.teamSeasonId < teamB.teamSeasonId) {
              homeTeamSeasonId = teamA.teamSeasonId;
              visitorTeamSeasonId = teamB.teamSeasonId;
            } else {
              homeTeamSeasonId = teamB.teamSeasonId;
              visitorTeamSeasonId = teamA.teamSeasonId;
            }
          }

          homeGameTally.set(homeTeamSeasonId, (homeGameTally.get(homeTeamSeasonId) ?? 0) + 1);

          matchups.push({ id, leagueSeasonId, homeTeamSeasonId, visitorTeamSeasonId });

          if (sameGroup) {
            inDivisionGames++;
          } else {
            crossDivisionGames++;
          }
        }
      }
    }

    return {
      matchups,
      summary: {
        leagueSeasonId,
        teamCount: sortedTeams.length,
        inDivisionGames,
        crossDivisionGames,
        totalGames: inDivisionGames + crossDivisionGames,
      },
    };
  }
}
