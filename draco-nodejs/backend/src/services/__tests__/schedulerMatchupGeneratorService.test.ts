import { describe, expect, it } from 'vitest';
import {
  SchedulerMatchupGeneratorService,
  type GeneratorLeagueInput,
} from '../schedulerMatchupGeneratorService.js';

const makeLeague = (overrides: Partial<GeneratorLeagueInput> = {}): GeneratorLeagueInput => ({
  leagueSeasonId: 'ls-1',
  teams: [],
  inDivisionGameCount: 1,
  crossDivisionGameCount: 1,
  ...overrides,
});

describe('SchedulerMatchupGeneratorService', () => {
  const service = new SchedulerMatchupGeneratorService();

  describe('single division (all divisionSeasonId: null)', () => {
    it('4 teams, inDivisionGameCount=2, cross=0 → 12 games with perfect home/away balance', () => {
      const league = makeLeague({
        leagueSeasonId: 'ls-1',
        teams: [
          { teamSeasonId: 'T1', divisionSeasonId: null },
          { teamSeasonId: 'T2', divisionSeasonId: null },
          { teamSeasonId: 'T3', divisionSeasonId: null },
          { teamSeasonId: 'T4', divisionSeasonId: null },
        ],
        inDivisionGameCount: 2,
        crossDivisionGameCount: 0,
      });

      const result = service.generate([league]);

      expect(result.matchups).toHaveLength(12);
      expect(result.summary).toHaveLength(1);
      expect(result.summary[0].inDivisionGames).toBe(12);
      expect(result.summary[0].crossDivisionGames).toBe(0);
      expect(result.summary[0].totalGames).toBe(12);
      expect(result.summary[0].teamCount).toBe(4);

      const pairCounts = new Map<string, number>();
      for (const m of result.matchups) {
        const key = [m.homeTeamSeasonId, m.visitorTeamSeasonId].sort().join('|');
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }

      const expectedPairs = ['T1|T2', 'T1|T3', 'T1|T4', 'T2|T3', 'T2|T4', 'T3|T4'];
      expect(pairCounts.size).toBe(6);
      for (const pair of expectedPairs) {
        expect(pairCounts.get(pair)).toBe(2);
      }

      const homeCount = new Map<string, number>();
      const awayCount = new Map<string, number>();
      for (const m of result.matchups) {
        homeCount.set(m.homeTeamSeasonId, (homeCount.get(m.homeTeamSeasonId) ?? 0) + 1);
        awayCount.set(m.visitorTeamSeasonId, (awayCount.get(m.visitorTeamSeasonId) ?? 0) + 1);
      }

      for (const teamId of ['T1', 'T2', 'T3', 'T4']) {
        expect(homeCount.get(teamId)).toBe(awayCount.get(teamId));
      }
    });

    it('C(n,2) games produced, crossDivisionGames === 0', () => {
      const league = makeLeague({
        leagueSeasonId: 'ls-nodiv',
        teams: [
          { teamSeasonId: 'A', divisionSeasonId: null },
          { teamSeasonId: 'B', divisionSeasonId: null },
          { teamSeasonId: 'C', divisionSeasonId: null },
          { teamSeasonId: 'D', divisionSeasonId: null },
          { teamSeasonId: 'E', divisionSeasonId: null },
        ],
        inDivisionGameCount: 1,
        crossDivisionGameCount: 0,
      });

      const result = service.generate([league]);

      expect(result.matchups).toHaveLength(10);
      expect(result.summary[0].crossDivisionGames).toBe(0);
      expect(result.summary[0].inDivisionGames).toBe(10);
    });
  });

  describe('two divisions', () => {
    it('2 divisions × 2 teams, inDivision=2, cross=1 → inDivision=4, cross=4, total=8', () => {
      const league = makeLeague({
        leagueSeasonId: 'ls-2div',
        teams: [
          { teamSeasonId: 'D1T1', divisionSeasonId: 'div-1' },
          { teamSeasonId: 'D1T2', divisionSeasonId: 'div-1' },
          { teamSeasonId: 'D2T1', divisionSeasonId: 'div-2' },
          { teamSeasonId: 'D2T2', divisionSeasonId: 'div-2' },
        ],
        inDivisionGameCount: 2,
        crossDivisionGameCount: 1,
      });

      const result = service.generate([league]);

      expect(result.summary).toHaveLength(1);
      const summary = result.summary[0];
      expect(summary.inDivisionGames).toBe(4);
      expect(summary.crossDivisionGames).toBe(4);
      expect(summary.totalGames).toBe(8);
      expect(summary.teamCount).toBe(4);
      expect(result.matchups).toHaveLength(8);
    });

    it('inDivisionGameCount=0, cross=2 → only cross-division games produced', () => {
      const league = makeLeague({
        leagueSeasonId: 'ls-crossonly',
        teams: [
          { teamSeasonId: 'X1', divisionSeasonId: 'div-A' },
          { teamSeasonId: 'X2', divisionSeasonId: 'div-A' },
          { teamSeasonId: 'Y1', divisionSeasonId: 'div-B' },
          { teamSeasonId: 'Y2', divisionSeasonId: 'div-B' },
        ],
        inDivisionGameCount: 0,
        crossDivisionGameCount: 2,
      });

      const result = service.generate([league]);

      expect(result.summary[0].inDivisionGames).toBe(0);
      expect(result.summary[0].crossDivisionGames).toBe(8);
      expect(result.summary[0].totalGames).toBe(8);

      for (const m of result.matchups) {
        const homeDivision = league.teams.find(
          (t) => t.teamSeasonId === m.homeTeamSeasonId,
        )!.divisionSeasonId;
        const visitorDivision = league.teams.find(
          (t) => t.teamSeasonId === m.visitorTeamSeasonId,
        )!.divisionSeasonId;
        expect(homeDivision).not.toBe(visitorDivision);
      }
    });
  });

  describe('edge cases', () => {
    it('league with 1 team → 0 games, totalGames === 0', () => {
      const league = makeLeague({
        leagueSeasonId: 'ls-one',
        teams: [{ teamSeasonId: 'Solo', divisionSeasonId: null }],
        inDivisionGameCount: 3,
        crossDivisionGameCount: 2,
      });

      const result = service.generate([league]);

      expect(result.matchups).toHaveLength(0);
      expect(result.summary[0].totalGames).toBe(0);
    });

    it('league with 0 teams → 0 games, totalGames === 0', () => {
      const league = makeLeague({
        leagueSeasonId: 'ls-empty',
        teams: [],
        inDivisionGameCount: 2,
        crossDivisionGameCount: 1,
      });

      const result = service.generate([league]);

      expect(result.matchups).toHaveLength(0);
      expect(result.summary[0].totalGames).toBe(0);
      expect(result.summary[0].teamCount).toBe(0);
    });

    it('every matchup has homeTeamSeasonId !== visitorTeamSeasonId', () => {
      const league = makeLeague({
        leagueSeasonId: 'ls-noself',
        teams: [
          { teamSeasonId: 'P', divisionSeasonId: 'div-1' },
          { teamSeasonId: 'Q', divisionSeasonId: 'div-1' },
          { teamSeasonId: 'R', divisionSeasonId: 'div-2' },
          { teamSeasonId: 'S', divisionSeasonId: 'div-2' },
        ],
        inDivisionGameCount: 3,
        crossDivisionGameCount: 2,
      });

      const result = service.generate([league]);

      for (const m of result.matchups) {
        expect(m.homeTeamSeasonId).not.toBe(m.visitorTeamSeasonId);
      }
    });
  });

  describe('determinism', () => {
    it('calling generate twice with identical input produces deep-equal results', () => {
      const leagues: GeneratorLeagueInput[] = [
        makeLeague({
          leagueSeasonId: 'ls-det',
          teams: [
            { teamSeasonId: 'Z1', divisionSeasonId: 'div-1' },
            { teamSeasonId: 'Z2', divisionSeasonId: 'div-1' },
            { teamSeasonId: 'Z3', divisionSeasonId: 'div-2' },
            { teamSeasonId: 'Z4', divisionSeasonId: 'div-2' },
          ],
          inDivisionGameCount: 2,
          crossDivisionGameCount: 1,
        }),
      ];

      const result1 = service.generate(leagues);
      const result2 = service.generate(leagues);

      expect(result1).toEqual(result2);

      for (let i = 0; i < result1.matchups.length; i++) {
        expect(result1.matchups[i].id).toBe(result2.matchups[i].id);
        expect(result1.matchups[i].homeTeamSeasonId).toBe(result2.matchups[i].homeTeamSeasonId);
        expect(result1.matchups[i].visitorTeamSeasonId).toBe(
          result2.matchups[i].visitorTeamSeasonId,
        );
      }
    });
  });

  describe('multiple leagues', () => {
    it('matchups partitioned correctly by leagueSeasonId; summary has one entry per league', () => {
      const leagueA = makeLeague({
        leagueSeasonId: 'ls-A',
        teams: [
          { teamSeasonId: 'A1', divisionSeasonId: null },
          { teamSeasonId: 'A2', divisionSeasonId: null },
          { teamSeasonId: 'A3', divisionSeasonId: null },
        ],
        inDivisionGameCount: 1,
        crossDivisionGameCount: 0,
      });

      const leagueB = makeLeague({
        leagueSeasonId: 'ls-B',
        teams: [
          { teamSeasonId: 'B1', divisionSeasonId: null },
          { teamSeasonId: 'B2', divisionSeasonId: null },
        ],
        inDivisionGameCount: 2,
        crossDivisionGameCount: 0,
      });

      const result = service.generate([leagueA, leagueB]);

      expect(result.summary).toHaveLength(2);
      expect(result.summary[0].leagueSeasonId).toBe('ls-A');
      expect(result.summary[1].leagueSeasonId).toBe('ls-B');

      const leagueAMatchups = result.matchups.filter((m) => m.leagueSeasonId === 'ls-A');
      const leagueBMatchups = result.matchups.filter((m) => m.leagueSeasonId === 'ls-B');

      expect(leagueAMatchups).toHaveLength(3);
      expect(leagueBMatchups).toHaveLength(2);

      expect(result.summary[0].totalGames).toBe(3);
      expect(result.summary[1].totalGames).toBe(2);

      for (const m of leagueAMatchups) {
        expect(['A1', 'A2', 'A3']).toContain(m.homeTeamSeasonId);
        expect(['A1', 'A2', 'A3']).toContain(m.visitorTeamSeasonId);
      }

      for (const m of leagueBMatchups) {
        expect(['B1', 'B2']).toContain(m.homeTeamSeasonId);
        expect(['B1', 'B2']).toContain(m.visitorTeamSeasonId);
      }
    });
  });
});
