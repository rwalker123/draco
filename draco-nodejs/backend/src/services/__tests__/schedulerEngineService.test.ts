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

  it('rejects games with earliestStart equal to latestEnd', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      ...baseSpec,
      games: [
        {
          ...baseSpec.games[0],
          earliestStart: '2026-04-05T09:00:00Z',
          latestEnd: '2026-04-05T09:00:00Z',
        },
      ],
    };

    expect(() => service.solve(spec)).toThrowError(/earliestStart must be before latestEnd/);
  });

  it('rejects games that reference unknown teams', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      ...baseSpec,
      games: [
        {
          ...baseSpec.games[0],
          id: 'game-invalid',
          homeTeamSeasonId: 'missing-team',
        },
      ],
    };

    expect(() => service.solve(spec)).toThrowError(/Unknown homeTeamSeasonId/);
  });

  it('rejects field slots that reference unknown fields', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      ...baseSpec,
      fieldSlots: [
        {
          ...baseSpec.fieldSlots[0],
          id: 'slot-invalid',
          fieldId: 'missing-field',
        },
      ],
      games: [baseSpec.games[0]],
    };

    expect(() => service.solve(spec)).toThrowError(/Unknown fieldId/);
  });

  it('allows slots that extend past latestEnd when duration fits', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      season: {
        id: 'spring-2026',
        name: 'Spring 2026',
        startDate: '2026-04-01',
        endDate: '2026-08-31',
        gameDurations: { defaultMinutes: 60 },
      },
      teams: [
        { id: 'team-1', teamSeasonId: 'teamSeason-1', league: { id: 'league-1', name: 'Open' } },
        { id: 'team-2', teamSeasonId: 'teamSeason-2', league: { id: 'league-1', name: 'Open' } },
      ],
      fields: [{ id: 'field-1', name: 'Field 1' }],
      umpires: [],
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'leagueSeason-1',
          homeTeamSeasonId: 'teamSeason-1',
          visitorTeamSeasonId: 'teamSeason-2',
          earliestStart: '2026-04-05T09:00:00Z',
          latestEnd: '2026-04-05T10:00:00Z',
          requiredUmpires: 0,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-1',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T11:00:00Z',
        },
      ],
      constraints: {
        hard: {
          respectFieldSlots: true,
        },
      },
    };

    const result = service.solve(spec);

    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(1);
    expect(result.unscheduled).toHaveLength(0);
  });

  it('falls back to non-preferred fields when preferredFieldIds have no viable slots', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      season: {
        id: 'spring-2026',
        name: 'Spring 2026',
        startDate: '2026-04-01',
        endDate: '2026-08-31',
        gameDurations: { defaultMinutes: 60 },
      },
      teams: [
        { id: 'team-1', teamSeasonId: 'teamSeason-1', league: { id: 'league-1', name: 'Open' } },
        { id: 'team-2', teamSeasonId: 'teamSeason-2', league: { id: 'league-1', name: 'Open' } },
      ],
      fields: [
        { id: 'field-1', name: 'Field 1' },
        { id: 'field-2', name: 'Field 2' },
      ],
      umpires: [],
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'leagueSeason-1',
          homeTeamSeasonId: 'teamSeason-1',
          visitorTeamSeasonId: 'teamSeason-2',
          earliestStart: '2026-04-05T09:00:00Z',
          latestEnd: '2026-04-05T14:00:00Z',
          preferredFieldIds: ['field-1'],
          requiredUmpires: 0,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-2',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:00:00Z',
        },
      ],
      constraints: {
        hard: {
          respectFieldSlots: true,
        },
      },
    };

    const result = service.solve(spec);

    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0]?.fieldId).toBe('field-2');
  });

  it('tries preferredFieldIds before other fields when multiple fields are viable', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      season: {
        id: 'spring-2026',
        name: 'Spring 2026',
        startDate: '2026-04-01',
        endDate: '2026-08-31',
        gameDurations: { defaultMinutes: 60 },
      },
      teams: [
        { id: 'team-1', teamSeasonId: 'teamSeason-1', league: { id: 'league-1', name: 'Open' } },
        { id: 'team-2', teamSeasonId: 'teamSeason-2', league: { id: 'league-1', name: 'Open' } },
      ],
      fields: [
        { id: 'field-1', name: 'Field 1' },
        { id: 'field-2', name: 'Field 2' },
      ],
      umpires: [],
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'leagueSeason-1',
          homeTeamSeasonId: 'teamSeason-1',
          visitorTeamSeasonId: 'teamSeason-2',
          earliestStart: '2026-04-05T09:00:00Z',
          latestEnd: '2026-04-05T14:00:00Z',
          preferredFieldIds: ['field-1'],
          requiredUmpires: 0,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-non-preferred-earlier',
          fieldId: 'field-2',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:00:00Z',
        },
        {
          id: 'slot-preferred-later',
          fieldId: 'field-1',
          startTime: '2026-04-05T10:00:00Z',
          endTime: '2026-04-05T11:00:00Z',
        },
      ],
      constraints: {
        hard: {
          respectFieldSlots: true,
        },
      },
    };

    const result = service.solve(spec);

    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0]?.fieldId).toBe('field-1');
  });

  it('treats season endDate as inclusive for default umpire availability', () => {
    const service = new SchedulerEngineService();
    const lastDaySpec: SchedulerProblemSpec = {
      season: {
        id: 'spring-2026',
        name: 'Spring 2026',
        startDate: '2026-04-01',
        endDate: '2026-08-31',
        gameDurations: {
          defaultMinutes: 75,
        },
      },
      teams: [
        { id: 'team-1', teamSeasonId: 'teamSeason-1', league: { id: 'league-1', name: 'Open' } },
        { id: 'team-2', teamSeasonId: 'teamSeason-2', league: { id: 'league-1', name: 'Open' } },
        { id: 'team-3', teamSeasonId: 'teamSeason-3', league: { id: 'league-1', name: 'Open' } },
        { id: 'team-4', teamSeasonId: 'teamSeason-4', league: { id: 'league-1', name: 'Open' } },
      ],
      fields: [{ id: 'field-1', name: 'Field 1' }],
      umpires: [{ id: 'ump-1', name: 'Alice' }],
      games: [
        {
          id: 'game-last',
          leagueSeasonId: 'leagueSeason-1',
          homeTeamSeasonId: 'teamSeason-1',
          visitorTeamSeasonId: 'teamSeason-2',
          earliestStart: '2026-08-31T19:30:00Z',
          latestEnd: '2026-08-31T23:59:59Z',
          requiredUmpires: 1,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-last',
          fieldId: 'field-1',
          startTime: '2026-08-31T20:00:00Z',
          endTime: '2026-08-31T21:15:00Z',
        },
      ],
      constraints: {
        hard: {
          respectUmpireAvailability: true,
        },
      },
    };

    const result = service.solve(lastDaySpec);

    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(1);
    expect(result.unscheduled).toHaveLength(0);
  });

  it('respects per-umpire maxGamesPerDay limits', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      season: {
        id: 'spring-2026',
        name: 'Spring 2026',
        startDate: '2026-04-01',
        endDate: '2026-08-31',
        gameDurations: { defaultMinutes: 75 },
      },
      teams: [
        { id: 'team-1', teamSeasonId: 'teamSeason-1', league: { id: 'league-1', name: 'Open' } },
        { id: 'team-2', teamSeasonId: 'teamSeason-2', league: { id: 'league-1', name: 'Open' } },
      ],
      fields: [{ id: 'field-1', name: 'Field 1' }],
      umpires: [
        { id: 'ump-1', name: 'Alice', maxGamesPerDay: 1 },
        { id: 'ump-2', name: 'Bob', maxGamesPerDay: 2 },
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
      constraints: {
        hard: {
          respectUmpireAvailability: true,
        },
      },
    };

    const result = service.solve(spec);

    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(2);
    expect(result.assignments[0]?.umpireIds).toEqual(['ump-1']);
    expect(result.assignments[1]?.umpireIds).toEqual(['ump-2']);
  });

  it('respects field maxParallelGames capacity', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      season: {
        id: 'spring-2026',
        name: 'Spring 2026',
        startDate: '2026-04-01',
        endDate: '2026-08-31',
        gameDurations: { defaultMinutes: 75 },
      },
      teams: [
        { id: 'team-1', teamSeasonId: 'teamSeason-1', league: { id: 'league-1', name: 'Open' } },
        { id: 'team-2', teamSeasonId: 'teamSeason-2', league: { id: 'league-1', name: 'Open' } },
        { id: 'team-3', teamSeasonId: 'teamSeason-3', league: { id: 'league-1', name: 'Open' } },
        { id: 'team-4', teamSeasonId: 'teamSeason-4', league: { id: 'league-1', name: 'Open' } },
      ],
      fields: [{ id: 'field-1', name: 'Field 1', properties: { maxParallelGames: 2 } }],
      umpires: [{ id: 'ump-1', name: 'Alice' }],
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'leagueSeason-1',
          homeTeamSeasonId: 'teamSeason-1',
          visitorTeamSeasonId: 'teamSeason-2',
          earliestStart: '2026-04-05T09:00:00Z',
          latestEnd: '2026-04-05T14:00:00Z',
          requiredUmpires: 0,
        },
        {
          id: 'game-2',
          leagueSeasonId: 'leagueSeason-1',
          homeTeamSeasonId: 'teamSeason-3',
          visitorTeamSeasonId: 'teamSeason-4',
          earliestStart: '2026-04-05T09:00:00Z',
          latestEnd: '2026-04-05T14:00:00Z',
          requiredUmpires: 0,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-1',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:30:00Z',
        },
      ],
      constraints: {
        hard: {
          respectFieldSlots: true,
        },
      },
    };

    const result = service.solve(spec);

    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(2);
    expect(result.unscheduled).toHaveLength(0);
  });

  it('requires field lights for configured night slots', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      season: {
        id: 'spring-2026',
        name: 'Spring 2026',
        startDate: '2026-04-01',
        endDate: '2026-08-31',
        gameDurations: { defaultMinutes: 75 },
      },
      teams: [
        { id: 'team-1', teamSeasonId: 'teamSeason-1', league: { id: 'league-1', name: 'Open' } },
        { id: 'team-2', teamSeasonId: 'teamSeason-2', league: { id: 'league-1', name: 'Open' } },
      ],
      fields: [
        { id: 'field-no-lights', name: 'Field A', properties: { hasLights: false } },
        { id: 'field-lights', name: 'Field B', properties: { hasLights: true } },
      ],
      umpires: [{ id: 'ump-1', name: 'Alice' }],
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'leagueSeason-1',
          homeTeamSeasonId: 'teamSeason-1',
          visitorTeamSeasonId: 'teamSeason-2',
          earliestStart: '2026-04-05T19:00:00Z',
          latestEnd: '2026-04-05T23:59:59Z',
          requiredUmpires: 0,
          preferredFieldIds: ['field-no-lights', 'field-lights'],
        },
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-no-lights',
          startTime: '2026-04-05T19:00:00Z',
          endTime: '2026-04-05T20:30:00Z',
        },
        {
          id: 'slot-2',
          fieldId: 'field-lights',
          startTime: '2026-04-05T19:00:00Z',
          endTime: '2026-04-05T20:30:00Z',
        },
      ],
      constraints: {
        hard: {
          requireLightsAfter: {
            enabled: true,
            startHourLocal: 18,
            timeZone: 'UTC',
          },
        },
      },
    };

    const result = service.solve(spec);

    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0]?.fieldId).toBe('field-lights');
    expect(result.unscheduled).toHaveLength(0);
  });
});
