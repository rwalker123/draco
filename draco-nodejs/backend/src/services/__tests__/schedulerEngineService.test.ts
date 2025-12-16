import { describe, expect, it } from 'vitest';
import { SchedulerEngineService } from '../schedulerEngineService.js';
import type { SchedulerProblemSpec } from '@draco/shared-schemas';

describe('SchedulerEngineService', () => {
  const baseSpec: SchedulerProblemSpec = {
    season: {
      id: 'spring-2026',
      name: 'Spring 2026',
      startDate: '2026-04-01',
      endDate: '2026-08-31',
      gameDurations: {
        weekendMinutes: 90,
        weekdayMinutes: 75,
        defaultMinutes: 75,
      },
    },
    teams: [
      { id: 'team-1', teamSeasonId: 'teamSeason-1', league: { id: 'league-1', name: 'Open' } },
      { id: 'team-2', teamSeasonId: 'teamSeason-2', league: { id: 'league-1', name: 'Open' } },
    ],
    fields: [{ id: 'field-1', name: 'Field 1' }],
    umpires: [
      { id: 'ump-1', name: 'Alice' },
      { id: 'ump-2', name: 'Bob' },
    ],
    games: [
      {
        id: 'game-1',
        leagueSeasonId: 'leagueSeason-1',
        homeTeamSeasonId: 'teamSeason-1',
        visitorTeamSeasonId: 'teamSeason-2',
        earliestStart: '2026-04-05T09:00:00Z',
        latestEnd: '2026-04-05T14:00:00Z',
        requiredUmpires: 1,
      },
      {
        id: 'game-2',
        leagueSeasonId: 'leagueSeason-1',
        homeTeamSeasonId: 'teamSeason-1',
        visitorTeamSeasonId: 'teamSeason-2',
        earliestStart: '2026-04-05T11:00:00Z',
        latestEnd: '2026-04-05T16:00:00Z',
        requiredUmpires: 1,
      },
    ],
    fieldSlots: [
      {
        id: 'slot-1',
        fieldId: 'field-1',
        startTime: '2026-04-05T09:00:00Z',
        endTime: '2026-04-05T10:30:00Z',
      },
      {
        id: 'slot-2',
        fieldId: 'field-1',
        startTime: '2026-04-05T11:30:00Z',
        endTime: '2026-04-05T13:00:00Z',
      },
    ],
    umpireAvailability: [
      { umpireId: 'ump-1', startTime: '2026-04-05T08:00:00Z', endTime: '2026-04-05T18:00:00Z' },
      { umpireId: 'ump-2', startTime: '2026-04-05T08:00:00Z', endTime: '2026-04-05T18:00:00Z' },
    ],
    teamBlackouts: [],
    constraints: {
      hard: {
        respectTeamBlackouts: true,
        respectUmpireAvailability: true,
        respectFieldSlots: true,
        noTeamOverlap: true,
        noFieldOverlap: true,
        noUmpireOverlap: true,
      },
    },
  };

  it('schedules games into available slots deterministically', () => {
    const service = new SchedulerEngineService();
    const result = service.solve({ ...baseSpec });

    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(2);
    expect(result.unscheduled).toHaveLength(0);
  });

  it('reports unscheduled games when hard constraints prevent placement', () => {
    const service = new SchedulerEngineService();
    const constrainedSpec: SchedulerProblemSpec = {
      ...baseSpec,
      constraints: {
        hard: {
          ...baseSpec.constraints?.hard,
          maxGamesPerTeamPerDay: 1,
        },
      },
    };

    const result = service.solve(constrainedSpec);

    expect(result.status).toBe('partial');
    expect(result.assignments).toHaveLength(1);
    expect(result.unscheduled).toHaveLength(1);
    expect(result.unscheduled[0]?.gameId).toBe('game-2');
  });
});
