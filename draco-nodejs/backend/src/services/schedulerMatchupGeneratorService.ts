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
    const summaries: SchedulerMatchupGenerationSummary[] = [];
    const leagueMatchups: SchedulerGameRequest[][] = [];

    for (const league of leagues) {
      const { matchups, summary } = this.generateLeagueMatchups(league);
      leagueMatchups.push(this.packIntoRounds(matchups));
      summaries.push(summary);
    }

    return { matchups: this.interleaveByIndex(leagueMatchups), summary: summaries };
  }

  /**
   * Greedily orders a league's matchups into round-robin rounds where each team appears at
   * most once per round. A team's second game cannot land in the same round as its first, so
   * every team gets a game before any team gets a second one — to the extent the matchup set
   * allows. Relative order is otherwise preserved for determinism.
   */
  private packIntoRounds(matchups: SchedulerGameRequest[]): SchedulerGameRequest[] {
    const ordered: SchedulerGameRequest[] = [];
    let remaining = matchups;
    while (remaining.length > 0) {
      const usedTeams = new Set<string>();
      const leftover: SchedulerGameRequest[] = [];
      for (const matchup of remaining) {
        if (usedTeams.has(matchup.homeTeamSeasonId) || usedTeams.has(matchup.visitorTeamSeasonId)) {
          leftover.push(matchup);
        } else {
          ordered.push(matchup);
          usedTeams.add(matchup.homeTeamSeasonId);
          usedTeams.add(matchup.visitorTeamSeasonId);
        }
      }
      remaining = leftover;
    }
    return ordered;
  }

  /**
   * Round-robin merge the per-league lists by position. Each league list is already
   * round-major, so taking index 0 from every league, then index 1, and so on keeps each
   * league's repeats spread out while preventing any single league from claiming the
   * earliest slots ahead of the others.
   */
  private interleaveByIndex(lists: SchedulerGameRequest[][]): SchedulerGameRequest[] {
    const merged: SchedulerGameRequest[] = [];
    const maxLength = lists.reduce((max, list) => Math.max(max, list.length), 0);
    for (let index = 0; index < maxLength; index += 1) {
      for (const list of lists) {
        if (index < list.length) {
          merged.push(list[index]);
        }
      }
    }
    return merged;
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
    const homeAwayDiff = new Map<string, number>();
    const baseHomeByPair = new Map<string, string>();

    for (const team of sortedTeams) {
      homeAwayDiff.set(team.teamSeasonId, 0);
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
          const pairKey = `${minId}|${maxId}`;

          let homeTeamSeasonId: string;
          let visitorTeamSeasonId: string;

          if (k === 0) {
            const diffA = homeAwayDiff.get(teamA.teamSeasonId) ?? 0;
            const diffB = homeAwayDiff.get(teamB.teamSeasonId) ?? 0;

            if (diffA < diffB) {
              homeTeamSeasonId = teamA.teamSeasonId;
              visitorTeamSeasonId = teamB.teamSeasonId;
            } else if (diffB < diffA) {
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

            baseHomeByPair.set(pairKey, homeTeamSeasonId);
          } else {
            const baseHome = baseHomeByPair.get(pairKey)!;
            const baseVisitor =
              baseHome === teamA.teamSeasonId ? teamB.teamSeasonId : teamA.teamSeasonId;

            if (k % 2 === 0) {
              homeTeamSeasonId = baseHome;
              visitorTeamSeasonId = baseVisitor;
            } else {
              homeTeamSeasonId = baseVisitor;
              visitorTeamSeasonId = baseHome;
            }
          }

          homeAwayDiff.set(homeTeamSeasonId, (homeAwayDiff.get(homeTeamSeasonId) ?? 0) + 1);
          homeAwayDiff.set(visitorTeamSeasonId, (homeAwayDiff.get(visitorTeamSeasonId) ?? 0) - 1);

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
