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

  it('treats season exclusions as hard constraints', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      ...baseSpec,
      seasonExclusions: [
        {
          id: 'ex-1',
          seasonId: baseSpec.season.id,
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:00:00Z',
          enabled: true,
        },
      ],
    };

    const result = service.solve(spec);
    expect(result.assignments[0]?.startTime).toBe('2026-04-05T11:30:00.000Z');
    expect(result.status).toBe('partial');
  });

  it('treats team exclusions as hard constraints', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      ...baseSpec,
      teamExclusions: [
        {
          id: 'team-ex-1',
          seasonId: baseSpec.season.id,
          teamSeasonId: 'teamSeason-1',
          startTime: '2026-04-05T11:00:00Z',
          endTime: '2026-04-05T14:00:00Z',
          enabled: true,
        },
      ],
    };

    const result = service.solve(spec);
    expect(result.status).toBe('partial');
    expect(result.assignments[0]?.startTime).toBe('2026-04-05T09:00:00.000Z');
    expect(result.unscheduled.some((item) => item.gameId === 'game-2')).toBe(true);
  });

  it('avoids assigning an umpire during an umpire exclusion window', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      ...baseSpec,
      umpireExclusions: [
        {
          id: 'ump-ex-1',
          seasonId: baseSpec.season.id,
          umpireId: 'ump-1',
          startTime: '2026-04-05T08:30:00Z',
          endTime: '2026-04-05T11:00:00Z',
          enabled: true,
        },
      ],
      games: [
        {
          ...baseSpec.games[0],
          id: 'game-only',
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
    };

    const result = service.solve(spec);
    expect(result.status).toBe('completed');
    expect(result.assignments[0]?.umpireIds).toEqual(['ump-2']);
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

  it('enforces maxGamesPerUmpirePerDay in the account timezone', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      ...baseSpec,
      umpires: [{ id: 'ump-1', name: 'Alice' }],
      umpireAvailability: [
        {
          umpireId: 'ump-1',
          startTime: '2026-03-31T12:00:00Z',
          endTime: '2026-04-01T03:00:00Z',
        },
      ],
      games: [
        {
          ...baseSpec.games[0],
          id: 'game-1',
          earliestStart: '2026-03-31T13:00:00Z',
          latestEnd: '2026-03-31T14:30:00Z',
          requiredUmpires: 1,
        },
        {
          ...baseSpec.games[0],
          id: 'game-2',
          earliestStart: '2026-03-31T15:45:00Z',
          latestEnd: '2026-03-31T17:15:00Z',
          requiredUmpires: 1,
        },
        {
          ...baseSpec.games[0],
          id: 'game-3',
          earliestStart: '2026-04-01T00:00:00Z',
          latestEnd: '2026-04-01T01:30:00Z',
          requiredUmpires: 1,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-1',
          startTime: '2026-03-31T13:00:00Z',
          endTime: '2026-03-31T14:30:00Z',
        },
        {
          id: 'slot-2',
          fieldId: 'field-1',
          startTime: '2026-03-31T15:45:00Z',
          endTime: '2026-03-31T17:15:00Z',
        },
        {
          id: 'slot-3',
          fieldId: 'field-1',
          startTime: '2026-04-01T00:00:00Z',
          endTime: '2026-04-01T01:30:00Z',
        },
      ],
      constraints: {
        hard: {
          ...baseSpec.constraints?.hard,
          maxGamesPerUmpirePerDay: 2,
        },
      },
    };

    // 2026-04-01T00:00:00Z is still 2026-03-31 in America/New_York (EDT).
    const result = service.solve(spec, { timeZoneId: 'America/New_York' });
    expect(result.status).toBe('partial');
    expect(result.assignments).toHaveLength(2);
    expect(result.unscheduled).toHaveLength(1);
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

  it('field slot availability: game scheduled when a matching-day slot is present, unscheduled when only wrong-day slots are present (proxy for an expanded exclusion-date)', () => {
    const service = new SchedulerEngineService();

    const slottedSpec: SchedulerProblemSpec = {
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
      umpires: [],
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
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-1',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:30:00Z',
        },
      ],
      constraints: { hard: { respectFieldSlots: true } },
    };

    const withSlot = service.solve(slottedSpec);
    expect(withSlot.status).toBe('completed');
    expect(withSlot.assignments).toHaveLength(1);

    const withWrongDaySlot = service.solve({
      ...slottedSpec,
      fieldSlots: [
        {
          id: 'slot-wrong-day',
          fieldId: 'field-1',
          startTime: '2026-04-07T09:00:00Z',
          endTime: '2026-04-07T10:30:00Z',
        },
      ],
    });
    expect(withWrongDaySlot.status).toBe('infeasible');
    expect(withWrongDaySlot.unscheduled).toHaveLength(1);
    expect(withWrongDaySlot.unscheduled[0]?.gameId).toBe('game-1');
    expect(withWrongDaySlot.unscheduled[0]?.reason).toBeTruthy();
  });

  it('field slot day mismatch: game scheduled when a slot exists on the game date, unscheduled when only off-day slots exist (proxy for an availability rule that expanded to no viable slot)', () => {
    const service = new SchedulerEngineService();

    const saturdaySlotSpec: SchedulerProblemSpec = {
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
      umpires: [],
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
      ],
      fieldSlots: [
        {
          id: 'slot-sat',
          fieldId: 'field-1',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:30:00Z',
        },
      ],
      constraints: { hard: { respectFieldSlots: true } },
    };

    const withSaturdaySlot = service.solve(saturdaySlotSpec);
    expect(withSaturdaySlot.status).toBe('completed');
    expect(withSaturdaySlot.assignments).toHaveLength(1);

    const weekdayOnlySpec: SchedulerProblemSpec = {
      ...saturdaySlotSpec,
      fieldSlots: [
        {
          id: 'slot-weekday',
          fieldId: 'field-1',
          startTime: '2026-04-07T09:00:00Z',
          endTime: '2026-04-07T10:30:00Z',
        },
      ],
    };

    const withWeekdaySlot = service.solve(weekdayOnlySpec);
    expect(['partial', 'infeasible']).toContain(withWeekdaySlot.status);
    expect(withWeekdaySlot.unscheduled).toHaveLength(1);
    expect(withWeekdaySlot.unscheduled[0]?.gameId).toBe('game-1');
  });

  it('over-constrained: multiple games are reported unscheduled with reasons when both season exclusion and umpire limit apply', () => {
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
      umpires: [{ id: 'ump-1', name: 'Alice' }],
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'leagueSeason-1',
          homeTeamSeasonId: 'teamSeason-1',
          visitorTeamSeasonId: 'teamSeason-2',
          earliestStart: '2026-04-05T09:00:00Z',
          latestEnd: '2026-04-05T11:00:00Z',
          requiredUmpires: 1,
        },
        {
          id: 'game-2',
          leagueSeasonId: 'leagueSeason-1',
          homeTeamSeasonId: 'teamSeason-1',
          visitorTeamSeasonId: 'teamSeason-2',
          earliestStart: '2026-04-05T11:00:00Z',
          latestEnd: '2026-04-05T14:00:00Z',
          requiredUmpires: 1,
        },
        {
          id: 'game-3',
          leagueSeasonId: 'leagueSeason-1',
          homeTeamSeasonId: 'teamSeason-1',
          visitorTeamSeasonId: 'teamSeason-2',
          earliestStart: '2026-04-05T13:00:00Z',
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
        {
          id: 'slot-3',
          fieldId: 'field-1',
          startTime: '2026-04-05T13:30:00Z',
          endTime: '2026-04-05T15:00:00Z',
        },
      ],
      umpireAvailability: [
        { umpireId: 'ump-1', startTime: '2026-04-05T08:00:00Z', endTime: '2026-04-05T18:00:00Z' },
      ],
      seasonExclusions: [
        {
          id: 'ex-1',
          seasonId: 'spring-2026',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T11:00:00Z',
          enabled: true,
        },
      ],
      constraints: {
        hard: {
          respectUmpireAvailability: true,
          maxGamesPerUmpirePerDay: 1,
        },
      },
    };

    const result = service.solve(spec);

    expect(result.status).toBe('partial');
    expect(result.unscheduled.length).toBeGreaterThanOrEqual(2);

    for (const unscheduled of result.unscheduled) {
      expect(unscheduled.gameId).toBeTruthy();
      expect(unscheduled.reason).toBeTruthy();
    }
  });

  it('treats team blackouts as a hard constraint and schedules once the blackout is lifted', () => {
    const service = new SchedulerEngineService();

    const blackedOutSpec: SchedulerProblemSpec = {
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
      teamBlackouts: [
        {
          teamSeasonId: 'teamSeason-1',
          startTime: '2026-04-05T08:00:00Z',
          endTime: '2026-04-05T12:00:00Z',
        },
      ],
      constraints: { hard: { respectFieldSlots: true, respectTeamBlackouts: true } },
    };

    const blocked = service.solve(blackedOutSpec);
    expect(blocked.status).toBe('infeasible');
    expect(blocked.unscheduled).toHaveLength(1);
    expect(blocked.unscheduled[0]?.gameId).toBe('game-1');

    const cleared = service.solve({ ...blackedOutSpec, teamBlackouts: [] });
    expect(cleared.status).toBe('completed');
    expect(cleared.assignments).toHaveLength(1);
    expect(cleared.assignments[0]?.fieldId).toBe('field-1');
  });

  it('ignores team blackouts when respectTeamBlackouts is disabled', () => {
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
      teamBlackouts: [
        {
          teamSeasonId: 'teamSeason-1',
          startTime: '2026-04-05T08:00:00Z',
          endTime: '2026-04-05T12:00:00Z',
        },
      ],
      constraints: { hard: { respectFieldSlots: true, respectTeamBlackouts: false } },
    };

    const result = service.solve(spec);
    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(1);
  });

  it('leaves a game unscheduled when no umpire is available during its window and schedules it once availability covers the slot', () => {
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
      umpires: [{ id: 'ump-1', name: 'Alice' }],
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
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-1',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:30:00Z',
        },
      ],
      umpireAvailability: [
        { umpireId: 'ump-1', startTime: '2026-04-05T12:00:00Z', endTime: '2026-04-05T18:00:00Z' },
      ],
      constraints: { hard: { respectFieldSlots: true, respectUmpireAvailability: true } },
    };

    const unavailable = service.solve(spec);
    expect(unavailable.status).toBe('infeasible');
    expect(unavailable.unscheduled).toHaveLength(1);
    expect(unavailable.unscheduled[0]?.gameId).toBe('game-1');

    const covering = service.solve({
      ...spec,
      umpireAvailability: [
        { umpireId: 'ump-1', startTime: '2026-04-05T08:00:00Z', endTime: '2026-04-05T18:00:00Z' },
      ],
    });
    expect(covering.status).toBe('completed');
    expect(covering.assignments).toHaveLength(1);
    expect(covering.assignments[0]?.umpireIds).toEqual(['ump-1']);
  });

  it('assigns an umpire outside their availability window when respectUmpireAvailability is disabled', () => {
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
      umpires: [{ id: 'ump-1', name: 'Alice' }],
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
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-1',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:30:00Z',
        },
      ],
      umpireAvailability: [
        { umpireId: 'ump-1', startTime: '2026-04-05T12:00:00Z', endTime: '2026-04-05T18:00:00Z' },
      ],
      constraints: { hard: { respectFieldSlots: true, respectUmpireAvailability: false } },
    };

    const result = service.solve(spec);
    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0]?.umpireIds).toEqual(['ump-1']);
  });
});

describe('SchedulerEngineService — soft constraint scoring', () => {
  const makeBaseSpec = (): SchedulerProblemSpec => ({
    season: {
      id: 'season-1',
      name: 'Test Season',
      startDate: '2026-04-01',
      endDate: '2026-08-31',
      gameDurations: { defaultMinutes: 60 },
    },
    teams: [
      { id: 'team-1', teamSeasonId: 'ts-1', league: { id: 'league-1' } },
      { id: 'team-2', teamSeasonId: 'ts-2', league: { id: 'league-1' } },
    ],
    fields: [{ id: 'field-1', name: 'Field 1' }],
    umpires: [],
    games: [
      {
        id: 'game-1',
        leagueSeasonId: 'league-1',
        homeTeamSeasonId: 'ts-1',
        visitorTeamSeasonId: 'ts-2',
        requiredUmpires: 0,
      },
    ],
    fieldSlots: [],
    constraints: { hard: {} },
  });

  it('no-soft invariant: spec without soft constraints picks the first valid slot', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      ...makeBaseSpec(),
      fieldSlots: [
        {
          id: 'slot-early',
          fieldId: 'field-1',
          startTime: '2026-04-06T09:00:00Z',
          endTime: '2026-04-06T11:00:00Z',
        },
        {
          id: 'slot-late',
          fieldId: 'field-1',
          startTime: '2026-04-06T19:00:00Z',
          endTime: '2026-04-06T21:00:00Z',
        },
      ],
    };

    const result = service.solve(spec);
    expect(result.status).toBe('completed');
    expect(result.assignments[0]?.startTime).toBe('2026-04-06T09:00:00.000Z');
  });

  it('no-soft invariant: all soft constraints explicitly disabled still picks first slot', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      ...makeBaseSpec(),
      fieldSlots: [
        {
          id: 'slot-early',
          fieldId: 'field-1',
          startTime: '2026-04-06T09:00:00Z',
          endTime: '2026-04-06T11:00:00Z',
        },
        {
          id: 'slot-late',
          fieldId: 'field-1',
          startTime: '2026-04-06T19:00:00Z',
          endTime: '2026-04-06T21:00:00Z',
        },
      ],
      constraints: {
        hard: {},
        soft: {
          avoidBackToBackGames: { enabled: false, minRestMinutes: 120 },
          spreadGamesAcrossDays: { enabled: false },
          balanceEarlyVsLate: { enabled: false },
        },
      },
    };

    const result = service.solve(spec);
    expect(result.status).toBe('completed');
    expect(result.assignments[0]?.startTime).toBe('2026-04-06T09:00:00.000Z');
  });

  it('avoidBackToBackGames: prefers the far slot when a team already has a nearby game', () => {
    const service = new SchedulerEngineService();

    const specWithSoft: SchedulerProblemSpec = {
      ...makeBaseSpec(),
      games: [
        {
          id: 'game-existing',
          leagueSeasonId: 'league-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          requiredUmpires: 0,
        },
        {
          id: 'game-new',
          leagueSeasonId: 'league-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          requiredUmpires: 0,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-close',
          fieldId: 'field-1',
          startTime: '2026-04-06T10:30:00Z',
          endTime: '2026-04-06T12:30:00Z',
        },
        {
          id: 'slot-far',
          fieldId: 'field-1',
          startTime: '2026-04-08T09:00:00Z',
          endTime: '2026-04-08T11:00:00Z',
        },
      ],
      constraints: {
        hard: {},
        soft: {
          avoidBackToBackGames: { enabled: true, minRestMinutes: 2880, weight: 3 },
        },
      },
    };

    const result = service.solve(specWithSoft);
    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(2);

    const existingAssignment = result.assignments.find((a) => a.gameId === 'game-existing');
    const newAssignment = result.assignments.find((a) => a.gameId === 'game-new');

    expect(existingAssignment?.startTime).toBe('2026-04-06T10:30:00.000Z');
    expect(newAssignment?.startTime).toBe('2026-04-08T09:00:00.000Z');
  });

  it('avoidBackToBackGames: without soft, the first/close slot is chosen (control)', () => {
    const service = new SchedulerEngineService();

    const specNoSoft: SchedulerProblemSpec = {
      ...makeBaseSpec(),
      teams: [
        { id: 'team-1', teamSeasonId: 'ts-1', league: { id: 'league-1' } },
        { id: 'team-2', teamSeasonId: 'ts-2', league: { id: 'league-1' } },
        { id: 'team-3', teamSeasonId: 'ts-3', league: { id: 'league-1' } },
        { id: 'team-4', teamSeasonId: 'ts-4', league: { id: 'league-1' } },
      ],
      games: [
        {
          id: 'game-anchor',
          leagueSeasonId: 'league-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          requiredUmpires: 0,
        },
        {
          id: 'game-new',
          leagueSeasonId: 'league-1',
          homeTeamSeasonId: 'ts-3',
          visitorTeamSeasonId: 'ts-4',
          requiredUmpires: 0,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-anchor',
          fieldId: 'field-1',
          startTime: '2026-04-06T09:00:00Z',
          endTime: '2026-04-06T11:00:00Z',
        },
        {
          id: 'slot-close',
          fieldId: 'field-1',
          startTime: '2026-04-06T10:30:00Z',
          endTime: '2026-04-06T12:30:00Z',
        },
        {
          id: 'slot-far',
          fieldId: 'field-1',
          startTime: '2026-04-08T09:00:00Z',
          endTime: '2026-04-08T11:00:00Z',
        },
      ],
      constraints: { hard: {} },
    };

    const result = service.solve(specNoSoft);
    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(2);

    const anchorAssignment = result.assignments.find((a) => a.gameId === 'game-anchor');
    const newAssignment = result.assignments.find((a) => a.gameId === 'game-new');
    expect(anchorAssignment?.startTime).toBe('2026-04-06T09:00:00.000Z');
    expect(newAssignment?.startTime).toBe('2026-04-06T10:30:00.000Z');
  });

  it('spreadGamesAcrossDays: prefers a slot on a day the team has no game', () => {
    const service = new SchedulerEngineService();

    const spec: SchedulerProblemSpec = {
      ...makeBaseSpec(),
      teams: [
        { id: 'team-1', teamSeasonId: 'ts-1', league: { id: 'league-1' } },
        { id: 'team-2', teamSeasonId: 'ts-2', league: { id: 'league-1' } },
        { id: 'team-3', teamSeasonId: 'ts-3', league: { id: 'league-1' } },
      ],
      games: [
        {
          id: 'game-monday',
          leagueSeasonId: 'league-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          requiredUmpires: 0,
        },
        {
          id: 'game-new',
          leagueSeasonId: 'league-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-3',
          requiredUmpires: 0,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-monday',
          fieldId: 'field-1',
          startTime: '2026-04-06T09:00:00Z',
          endTime: '2026-04-06T11:00:00Z',
        },
        {
          id: 'slot-monday-afternoon',
          fieldId: 'field-1',
          startTime: '2026-04-06T14:00:00Z',
          endTime: '2026-04-06T16:00:00Z',
        },
        {
          id: 'slot-wednesday',
          fieldId: 'field-1',
          startTime: '2026-04-08T09:00:00Z',
          endTime: '2026-04-08T11:00:00Z',
        },
      ],
      constraints: {
        hard: {},
        soft: {
          spreadGamesAcrossDays: { enabled: true, weight: 2 },
        },
      },
    };

    const result = service.solve(spec);
    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(2);

    const newAssignment = result.assignments.find((a) => a.gameId === 'game-new');
    expect(newAssignment?.startTime).toBe('2026-04-08T09:00:00.000Z');
  });

  it('balanceEarlyVsLate: team with an early game already prefers a late slot for next game', () => {
    const service = new SchedulerEngineService();

    const spec: SchedulerProblemSpec = {
      ...makeBaseSpec(),
      teams: [
        { id: 'team-1', teamSeasonId: 'ts-1', league: { id: 'league-1' } },
        { id: 'team-2', teamSeasonId: 'ts-2', league: { id: 'league-1' } },
        { id: 'team-3', teamSeasonId: 'ts-3', league: { id: 'league-1' } },
      ],
      games: [
        {
          id: 'game-early',
          leagueSeasonId: 'league-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          requiredUmpires: 0,
        },
        {
          id: 'game-new',
          leagueSeasonId: 'league-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-3',
          requiredUmpires: 0,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-early-day1',
          fieldId: 'field-1',
          startTime: '2026-04-06T09:00:00Z',
          endTime: '2026-04-06T11:00:00Z',
        },
        {
          id: 'slot-early-day2',
          fieldId: 'field-1',
          startTime: '2026-04-07T09:00:00Z',
          endTime: '2026-04-07T11:00:00Z',
        },
        {
          id: 'slot-late-day2',
          fieldId: 'field-1',
          startTime: '2026-04-07T19:00:00Z',
          endTime: '2026-04-07T21:00:00Z',
        },
      ],
      constraints: {
        hard: {},
        soft: {
          balanceEarlyVsLate: { enabled: true, weight: 1 },
        },
      },
    };

    const result = service.solve(spec);
    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(2);

    const newAssignment = result.assignments.find((a) => a.gameId === 'game-new');
    expect(newAssignment?.startTime).toBe('2026-04-07T19:00:00.000Z');
  });

  it('weight dominance: higher-weight constraint wins when two soft constraints conflict', () => {
    const service = new SchedulerEngineService();

    const spec: SchedulerProblemSpec = {
      ...makeBaseSpec(),
      teams: [
        { id: 'team-1', teamSeasonId: 'ts-1', league: { id: 'league-1' } },
        { id: 'team-2', teamSeasonId: 'ts-2', league: { id: 'league-1' } },
        { id: 'team-3', teamSeasonId: 'ts-3', league: { id: 'league-1' } },
      ],
      games: [
        {
          id: 'game-anchor',
          leagueSeasonId: 'league-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          requiredUmpires: 0,
        },
        {
          id: 'game-new',
          leagueSeasonId: 'league-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-3',
          requiredUmpires: 0,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-anchor',
          fieldId: 'field-1',
          startTime: '2026-04-06T09:00:00Z',
          endTime: '2026-04-06T11:00:00Z',
        },
        {
          id: 'slot-same-day-late',
          fieldId: 'field-1',
          startTime: '2026-04-06T19:00:00Z',
          endTime: '2026-04-06T21:00:00Z',
        },
        {
          id: 'slot-diff-day-early',
          fieldId: 'field-1',
          startTime: '2026-04-07T09:00:00Z',
          endTime: '2026-04-07T11:00:00Z',
        },
      ],
      constraints: {
        hard: {},
        soft: {
          spreadGamesAcrossDays: { enabled: true, weight: 10 },
          balanceEarlyVsLate: { enabled: true, weight: 1 },
        },
      },
    };

    const result = service.solve(spec);
    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(2);

    const newAssignment = result.assignments.find((a) => a.gameId === 'game-new');
    expect(newAssignment?.startTime).toBe('2026-04-07T09:00:00.000Z');
  });

  it('determinism: identical spec solved twice produces deep-equal results', () => {
    const service = new SchedulerEngineService();

    const spec: SchedulerProblemSpec = {
      ...makeBaseSpec(),
      teams: [
        { id: 'team-1', teamSeasonId: 'ts-1', league: { id: 'league-1' } },
        { id: 'team-2', teamSeasonId: 'ts-2', league: { id: 'league-1' } },
        { id: 'team-3', teamSeasonId: 'ts-3', league: { id: 'league-1' } },
      ],
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'league-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          requiredUmpires: 0,
        },
        {
          id: 'game-2',
          leagueSeasonId: 'league-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-3',
          requiredUmpires: 0,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-a',
          fieldId: 'field-1',
          startTime: '2026-04-06T09:00:00Z',
          endTime: '2026-04-06T11:00:00Z',
        },
        {
          id: 'slot-b',
          fieldId: 'field-1',
          startTime: '2026-04-06T14:00:00Z',
          endTime: '2026-04-06T16:00:00Z',
        },
        {
          id: 'slot-c',
          fieldId: 'field-1',
          startTime: '2026-04-08T09:00:00Z',
          endTime: '2026-04-08T11:00:00Z',
        },
      ],
      constraints: {
        hard: {},
        soft: {
          avoidBackToBackGames: { enabled: true, minRestMinutes: 2880, weight: 3 },
          spreadGamesAcrossDays: { enabled: true, weight: 2 },
          balanceEarlyVsLate: { enabled: true, weight: 1 },
        },
      },
    };

    const result1 = service.solve({ ...spec, runId: 'run-det-1' });
    const result2 = service.solve({ ...spec, runId: 'run-det-1' });

    expect(result1.assignments).toEqual(result2.assignments);
    expect(result1.unscheduled).toEqual(result2.unscheduled);
  });
});

describe('SchedulerEngineService — constraint contrast tests', () => {
  const service = new SchedulerEngineService();

  const makeTwoTeamSeason = (): Pick<
    SchedulerProblemSpec,
    'season' | 'teams' | 'fields' | 'umpires'
  > => ({
    season: {
      id: 'season-c',
      name: 'Contrast Season',
      startDate: '2026-05-01',
      endDate: '2026-09-30',
      gameDurations: { defaultMinutes: 60 },
    },
    teams: [
      { id: 'team-1', teamSeasonId: 'ts-1', league: { id: 'lg-1', name: 'Open' } },
      { id: 'team-2', teamSeasonId: 'ts-2', league: { id: 'lg-1', name: 'Open' } },
    ],
    fields: [{ id: 'field-1', name: 'Field 1' }],
    umpires: [],
  });

  it('season exclusion — game lands on slot-1 without exclusion; forced to slot-2 when slot-1 is blacked out', () => {
    const base: SchedulerProblemSpec = {
      ...makeTwoTeamSeason(),
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          earliestStart: '2026-05-10T09:00:00Z',
          latestEnd: '2026-05-10T18:00:00Z',
          requiredUmpires: 0,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-1',
          startTime: '2026-05-10T09:00:00Z',
          endTime: '2026-05-10T11:00:00Z',
        },
        {
          id: 'slot-2',
          fieldId: 'field-1',
          startTime: '2026-05-10T13:00:00Z',
          endTime: '2026-05-10T15:00:00Z',
        },
      ],
      constraints: { hard: {} },
    };

    const withoutExclusion = service.solve(base);
    expect(withoutExclusion.status).toBe('completed');
    expect(withoutExclusion.assignments[0]?.startTime).toBe('2026-05-10T09:00:00.000Z');

    const withExclusion = service.solve({
      ...base,
      seasonExclusions: [
        {
          id: 'ex-1',
          seasonId: 'season-c',
          startTime: '2026-05-10T08:00:00Z',
          endTime: '2026-05-10T12:00:00Z',
          enabled: true,
        },
      ],
    });
    expect(withExclusion.status).toBe('completed');
    expect(withExclusion.assignments[0]?.startTime).toBe('2026-05-10T13:00:00.000Z');
  });

  it('season exclusion — disabled exclusion does not block placement', () => {
    const spec: SchedulerProblemSpec = {
      ...makeTwoTeamSeason(),
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          earliestStart: '2026-05-10T09:00:00Z',
          latestEnd: '2026-05-10T11:00:00Z',
          requiredUmpires: 0,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-1',
          startTime: '2026-05-10T09:00:00Z',
          endTime: '2026-05-10T11:00:00Z',
        },
      ],
      seasonExclusions: [
        {
          id: 'ex-disabled',
          seasonId: 'season-c',
          startTime: '2026-05-10T08:00:00Z',
          endTime: '2026-05-10T18:00:00Z',
          enabled: false,
        },
      ],
      constraints: { hard: {} },
    };

    const result = service.solve(spec);
    expect(result.status).toBe('completed');
    expect(result.assignments[0]?.startTime).toBe('2026-05-10T09:00:00.000Z');
  });

  it('team exclusion applies to visitor team — visitor exclusion blocks slot, game goes unscheduled', () => {
    const base: SchedulerProblemSpec = {
      ...makeTwoTeamSeason(),
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          earliestStart: '2026-05-10T09:00:00Z',
          latestEnd: '2026-05-10T11:00:00Z',
          requiredUmpires: 0,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-1',
          startTime: '2026-05-10T09:00:00Z',
          endTime: '2026-05-10T11:00:00Z',
        },
      ],
      constraints: { hard: {} },
    };

    const withoutExclusion = service.solve(base);
    expect(withoutExclusion.status).toBe('completed');
    expect(withoutExclusion.assignments[0]?.startTime).toBe('2026-05-10T09:00:00.000Z');

    const withVisitorExclusion = service.solve({
      ...base,
      teamExclusions: [
        {
          id: 'tex-1',
          seasonId: 'season-c',
          teamSeasonId: 'ts-2',
          startTime: '2026-05-10T08:00:00Z',
          endTime: '2026-05-10T12:00:00Z',
          enabled: true,
        },
      ],
    });
    expect(withVisitorExclusion.status).toBe('infeasible');
    expect(withVisitorExclusion.unscheduled[0]?.gameId).toBe('game-1');
    expect(withVisitorExclusion.unscheduled[0]?.reason).toBeTruthy();
  });

  it('team exclusion — disabled exclusion does not block visitor team', () => {
    const spec: SchedulerProblemSpec = {
      ...makeTwoTeamSeason(),
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          earliestStart: '2026-05-10T09:00:00Z',
          latestEnd: '2026-05-10T11:00:00Z',
          requiredUmpires: 0,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-1',
          startTime: '2026-05-10T09:00:00Z',
          endTime: '2026-05-10T11:00:00Z',
        },
      ],
      teamExclusions: [
        {
          id: 'tex-disabled',
          seasonId: 'season-c',
          teamSeasonId: 'ts-2',
          startTime: '2026-05-10T08:00:00Z',
          endTime: '2026-05-10T12:00:00Z',
          enabled: false,
        },
      ],
      constraints: { hard: {} },
    };

    const result = service.solve(spec);
    expect(result.status).toBe('completed');
    expect(result.assignments[0]?.startTime).toBe('2026-05-10T09:00:00.000Z');
  });

  it('umpire exclusion — all umpires excluded during slot causes game to be unscheduled', () => {
    const base: SchedulerProblemSpec = {
      ...makeTwoTeamSeason(),
      umpires: [
        { id: 'ump-1', name: 'Alice' },
        { id: 'ump-2', name: 'Bob' },
      ],
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          earliestStart: '2026-05-10T09:00:00Z',
          latestEnd: '2026-05-10T11:00:00Z',
          requiredUmpires: 1,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-1',
          startTime: '2026-05-10T09:00:00Z',
          endTime: '2026-05-10T11:00:00Z',
        },
      ],
      umpireAvailability: [
        { umpireId: 'ump-1', startTime: '2026-05-10T08:00:00Z', endTime: '2026-05-10T18:00:00Z' },
        { umpireId: 'ump-2', startTime: '2026-05-10T08:00:00Z', endTime: '2026-05-10T18:00:00Z' },
      ],
      constraints: { hard: { respectUmpireAvailability: true } },
    };

    const withoutExclusions = service.solve(base);
    expect(withoutExclusions.status).toBe('completed');
    expect(withoutExclusions.assignments[0]?.umpireIds).toHaveLength(1);

    const withBothExcluded = service.solve({
      ...base,
      umpireExclusions: [
        {
          id: 'uex-1',
          seasonId: 'season-c',
          umpireId: 'ump-1',
          startTime: '2026-05-10T08:30:00Z',
          endTime: '2026-05-10T11:30:00Z',
          enabled: true,
        },
        {
          id: 'uex-2',
          seasonId: 'season-c',
          umpireId: 'ump-2',
          startTime: '2026-05-10T08:30:00Z',
          endTime: '2026-05-10T11:30:00Z',
          enabled: true,
        },
      ],
    });
    expect(withBothExcluded.status).toBe('infeasible');
    expect(withBothExcluded.unscheduled[0]?.gameId).toBe('game-1');
    expect(withBothExcluded.unscheduled[0]?.reason).toBeTruthy();
  });

  it('umpire exclusion — one umpire excluded during slot; the other umpire is assigned instead', () => {
    const spec: SchedulerProblemSpec = {
      ...makeTwoTeamSeason(),
      umpires: [
        { id: 'ump-1', name: 'Alice' },
        { id: 'ump-2', name: 'Bob' },
      ],
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          earliestStart: '2026-05-10T09:00:00Z',
          latestEnd: '2026-05-10T11:00:00Z',
          requiredUmpires: 1,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-1',
          startTime: '2026-05-10T09:00:00Z',
          endTime: '2026-05-10T11:00:00Z',
        },
      ],
      umpireAvailability: [
        { umpireId: 'ump-1', startTime: '2026-05-10T08:00:00Z', endTime: '2026-05-10T18:00:00Z' },
        { umpireId: 'ump-2', startTime: '2026-05-10T08:00:00Z', endTime: '2026-05-10T18:00:00Z' },
      ],
      umpireExclusions: [
        {
          id: 'uex-1',
          seasonId: 'season-c',
          umpireId: 'ump-1',
          startTime: '2026-05-10T08:30:00Z',
          endTime: '2026-05-10T11:30:00Z',
          enabled: true,
        },
      ],
      constraints: { hard: { respectUmpireAvailability: true } },
    };

    const result = service.solve(spec);
    expect(result.status).toBe('completed');
    expect(result.assignments[0]?.umpireIds).toEqual(['ump-2']);
  });

  it('field closed date — field absent from slots on closed date causes unscheduled; adding the slot allows placement', () => {
    const base: SchedulerProblemSpec = {
      ...makeTwoTeamSeason(),
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          earliestStart: '2026-05-15T09:00:00Z',
          latestEnd: '2026-05-15T18:00:00Z',
          requiredUmpires: 0,
        },
      ],
      fieldSlots: [],
      constraints: { hard: {} },
    };

    const closedResult = service.solve({
      ...base,
      fieldSlots: [
        {
          id: 'slot-other-day',
          fieldId: 'field-1',
          startTime: '2026-05-16T09:00:00Z',
          endTime: '2026-05-16T11:00:00Z',
        },
      ],
    });
    expect(closedResult.status).toBe('infeasible');
    expect(closedResult.unscheduled[0]?.gameId).toBe('game-1');
    expect(closedResult.unscheduled[0]?.reason).toBeTruthy();

    const openResult = service.solve({
      ...base,
      fieldSlots: [
        {
          id: 'slot-correct-day',
          fieldId: 'field-1',
          startTime: '2026-05-15T09:00:00Z',
          endTime: '2026-05-15T11:00:00Z',
        },
      ],
    });
    expect(openResult.status).toBe('completed');
    expect(openResult.assignments[0]?.startTime).toBe('2026-05-15T09:00:00.000Z');
  });

  it('field availability rule — Saturday-only field rejects a Sunday game window (no valid slot on that day)', () => {
    const sundayGame: SchedulerProblemSpec = {
      ...makeTwoTeamSeason(),
      games: [
        {
          id: 'game-sunday',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          earliestStart: '2026-05-17T09:00:00Z',
          latestEnd: '2026-05-17T18:00:00Z',
          requiredUmpires: 0,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-saturday',
          fieldId: 'field-1',
          startTime: '2026-05-16T09:00:00Z',
          endTime: '2026-05-16T11:00:00Z',
        },
      ],
      constraints: { hard: {} },
    };

    const rejectedResult = service.solve(sundayGame);
    expect(rejectedResult.status).toBe('infeasible');
    expect(rejectedResult.unscheduled[0]?.gameId).toBe('game-sunday');
    expect(rejectedResult.unscheduled[0]?.reason).toBeTruthy();

    const saturdayGame: SchedulerProblemSpec = {
      ...sundayGame,
      games: [
        {
          id: 'game-saturday',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          earliestStart: '2026-05-16T09:00:00Z',
          latestEnd: '2026-05-16T18:00:00Z',
          requiredUmpires: 0,
        },
      ],
    };

    const placedResult = service.solve(saturdayGame);
    expect(placedResult.status).toBe('completed');
    expect(placedResult.assignments[0]?.startTime).toBe('2026-05-16T09:00:00.000Z');
  });

  it('max-games-per-umpire-per-day — umpire at cap is skipped; second game goes to other umpire', () => {
    const spec: SchedulerProblemSpec = {
      ...makeTwoTeamSeason(),
      teams: [
        { id: 'team-1', teamSeasonId: 'ts-1', league: { id: 'lg-1', name: 'Open' } },
        { id: 'team-2', teamSeasonId: 'ts-2', league: { id: 'lg-1', name: 'Open' } },
        { id: 'team-3', teamSeasonId: 'ts-3', league: { id: 'lg-1', name: 'Open' } },
        { id: 'team-4', teamSeasonId: 'ts-4', league: { id: 'lg-1', name: 'Open' } },
      ],
      umpires: [
        { id: 'ump-1', name: 'Alice' },
        { id: 'ump-2', name: 'Bob' },
      ],
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          earliestStart: '2026-05-10T09:00:00Z',
          latestEnd: '2026-05-10T18:00:00Z',
          requiredUmpires: 1,
        },
        {
          id: 'game-2',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-3',
          visitorTeamSeasonId: 'ts-4',
          earliestStart: '2026-05-10T11:00:00Z',
          latestEnd: '2026-05-10T18:00:00Z',
          requiredUmpires: 1,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-1',
          startTime: '2026-05-10T09:00:00Z',
          endTime: '2026-05-10T10:30:00Z',
        },
        {
          id: 'slot-2',
          fieldId: 'field-1',
          startTime: '2026-05-10T11:30:00Z',
          endTime: '2026-05-10T13:00:00Z',
        },
      ],
      umpireAvailability: [
        { umpireId: 'ump-1', startTime: '2026-05-10T08:00:00Z', endTime: '2026-05-10T18:00:00Z' },
        { umpireId: 'ump-2', startTime: '2026-05-10T08:00:00Z', endTime: '2026-05-10T18:00:00Z' },
      ],
      constraints: {
        hard: {
          respectUmpireAvailability: true,
          maxGamesPerUmpirePerDay: 1,
        },
      },
    };

    const result = service.solve(spec);
    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(2);

    const game1Assignment = result.assignments.find((a) => a.gameId === 'game-1');
    const game2Assignment = result.assignments.find((a) => a.gameId === 'game-2');
    expect(game1Assignment?.umpireIds).toHaveLength(1);
    expect(game2Assignment?.umpireIds).toHaveLength(1);
    expect(game1Assignment?.umpireIds[0]).not.toBe(game2Assignment?.umpireIds[0]);
  });

  it('max-games-per-umpire-per-day — single umpire at cap causes third same-day game to be unscheduled', () => {
    const spec: SchedulerProblemSpec = {
      ...makeTwoTeamSeason(),
      teams: [
        { id: 'team-1', teamSeasonId: 'ts-1', league: { id: 'lg-1', name: 'Open' } },
        { id: 'team-2', teamSeasonId: 'ts-2', league: { id: 'lg-1', name: 'Open' } },
        { id: 'team-3', teamSeasonId: 'ts-3', league: { id: 'lg-1', name: 'Open' } },
        { id: 'team-4', teamSeasonId: 'ts-4', league: { id: 'lg-1', name: 'Open' } },
        { id: 'team-5', teamSeasonId: 'ts-5', league: { id: 'lg-1', name: 'Open' } },
        { id: 'team-6', teamSeasonId: 'ts-6', league: { id: 'lg-1', name: 'Open' } },
      ],
      umpires: [{ id: 'ump-solo', name: 'Solo' }],
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          earliestStart: '2026-05-10T09:00:00Z',
          latestEnd: '2026-05-10T18:00:00Z',
          requiredUmpires: 1,
        },
        {
          id: 'game-2',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-3',
          visitorTeamSeasonId: 'ts-4',
          earliestStart: '2026-05-10T11:00:00Z',
          latestEnd: '2026-05-10T18:00:00Z',
          requiredUmpires: 1,
        },
        {
          id: 'game-3',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-5',
          visitorTeamSeasonId: 'ts-6',
          earliestStart: '2026-05-10T13:00:00Z',
          latestEnd: '2026-05-10T18:00:00Z',
          requiredUmpires: 1,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-1',
          startTime: '2026-05-10T09:00:00Z',
          endTime: '2026-05-10T10:30:00Z',
        },
        {
          id: 'slot-2',
          fieldId: 'field-1',
          startTime: '2026-05-10T11:30:00Z',
          endTime: '2026-05-10T13:00:00Z',
        },
        {
          id: 'slot-3',
          fieldId: 'field-1',
          startTime: '2026-05-10T13:30:00Z',
          endTime: '2026-05-10T15:00:00Z',
        },
      ],
      umpireAvailability: [
        {
          umpireId: 'ump-solo',
          startTime: '2026-05-10T08:00:00Z',
          endTime: '2026-05-10T18:00:00Z',
        },
      ],
      constraints: {
        hard: {
          respectUmpireAvailability: true,
          maxGamesPerUmpirePerDay: 2,
        },
      },
    };

    const result = service.solve(spec);
    expect(result.status).toBe('partial');
    expect(result.assignments).toHaveLength(2);
    expect(result.unscheduled).toHaveLength(1);
    expect(result.unscheduled[0]?.gameId).toBe('game-3');
    expect(result.unscheduled[0]?.reason).toBeTruthy();
  });

  it('over-constrained — unplaceable game is in unscheduled list with a reason; other placeable games are still scheduled', () => {
    const spec: SchedulerProblemSpec = {
      ...makeTwoTeamSeason(),
      teams: [
        { id: 'team-1', teamSeasonId: 'ts-1', league: { id: 'lg-1', name: 'Open' } },
        { id: 'team-2', teamSeasonId: 'ts-2', league: { id: 'lg-1', name: 'Open' } },
        { id: 'team-3', teamSeasonId: 'ts-3', league: { id: 'lg-1', name: 'Open' } },
        { id: 'team-4', teamSeasonId: 'ts-4', league: { id: 'lg-1', name: 'Open' } },
      ],
      games: [
        {
          id: 'game-impossible',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          earliestStart: '2026-05-10T09:00:00Z',
          latestEnd: '2026-05-10T10:00:00Z',
          durationMinutes: 90,
          requiredUmpires: 0,
        },
        {
          id: 'game-possible',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-3',
          visitorTeamSeasonId: 'ts-4',
          earliestStart: '2026-05-10T13:00:00Z',
          latestEnd: '2026-05-10T18:00:00Z',
          requiredUmpires: 0,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-1',
          startTime: '2026-05-10T09:00:00Z',
          endTime: '2026-05-10T09:30:00Z',
        },
        {
          id: 'slot-2',
          fieldId: 'field-1',
          startTime: '2026-05-10T13:00:00Z',
          endTime: '2026-05-10T15:00:00Z',
        },
      ],
      constraints: { hard: {} },
    };

    const result = service.solve(spec);
    expect(result.status).toBe('partial');
    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0]?.gameId).toBe('game-possible');
    expect(result.unscheduled).toHaveLength(1);
    expect(result.unscheduled[0]?.gameId).toBe('game-impossible');
    expect(result.unscheduled[0]?.reason).toBeTruthy();
  });

  it('determinism with all constraint types — identical constrained spec produces equal results on two calls', () => {
    const spec: SchedulerProblemSpec = {
      ...makeTwoTeamSeason(),
      teams: [
        { id: 'team-1', teamSeasonId: 'ts-1', league: { id: 'lg-1', name: 'Open' } },
        { id: 'team-2', teamSeasonId: 'ts-2', league: { id: 'lg-1', name: 'Open' } },
        { id: 'team-3', teamSeasonId: 'ts-3', league: { id: 'lg-1', name: 'Open' } },
        { id: 'team-4', teamSeasonId: 'ts-4', league: { id: 'lg-1', name: 'Open' } },
      ],
      umpires: [
        { id: 'ump-1', name: 'Alice' },
        { id: 'ump-2', name: 'Bob' },
      ],
      games: [
        {
          id: 'game-1',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-2',
          earliestStart: '2026-05-10T09:00:00Z',
          latestEnd: '2026-05-10T18:00:00Z',
          requiredUmpires: 1,
        },
        {
          id: 'game-2',
          leagueSeasonId: 'ls-1',
          homeTeamSeasonId: 'ts-3',
          visitorTeamSeasonId: 'ts-4',
          earliestStart: '2026-05-10T11:00:00Z',
          latestEnd: '2026-05-10T18:00:00Z',
          requiredUmpires: 1,
        },
      ],
      fieldSlots: [
        {
          id: 'slot-1',
          fieldId: 'field-1',
          startTime: '2026-05-10T09:00:00Z',
          endTime: '2026-05-10T10:30:00Z',
        },
        {
          id: 'slot-2',
          fieldId: 'field-1',
          startTime: '2026-05-10T11:30:00Z',
          endTime: '2026-05-10T13:00:00Z',
        },
        {
          id: 'slot-3',
          fieldId: 'field-1',
          startTime: '2026-05-10T14:00:00Z',
          endTime: '2026-05-10T15:30:00Z',
        },
      ],
      umpireAvailability: [
        { umpireId: 'ump-1', startTime: '2026-05-10T08:00:00Z', endTime: '2026-05-10T18:00:00Z' },
        { umpireId: 'ump-2', startTime: '2026-05-10T08:00:00Z', endTime: '2026-05-10T18:00:00Z' },
      ],
      seasonExclusions: [
        {
          id: 'ex-1',
          seasonId: 'season-c',
          startTime: '2026-05-10T14:00:00Z',
          endTime: '2026-05-10T16:00:00Z',
          enabled: true,
        },
      ],
      teamExclusions: [
        {
          id: 'tex-1',
          seasonId: 'season-c',
          teamSeasonId: 'ts-1',
          startTime: '2026-05-10T13:00:00Z',
          endTime: '2026-05-10T18:00:00Z',
          enabled: true,
        },
      ],
      umpireExclusions: [
        {
          id: 'uex-1',
          seasonId: 'season-c',
          umpireId: 'ump-1',
          startTime: '2026-05-10T11:00:00Z',
          endTime: '2026-05-10T14:00:00Z',
          enabled: true,
        },
      ],
      constraints: {
        hard: {
          respectUmpireAvailability: true,
          maxGamesPerUmpirePerDay: 2,
        },
      },
      runId: 'det-constraint-test',
    };

    const run1 = service.solve(spec);
    const run2 = service.solve(spec);

    expect(run1.runId).toBe(run2.runId);
    expect(run1.assignments).toEqual(run2.assignments);
    expect(run1.unscheduled).toEqual(run2.unscheduled);
    expect(run1.status).toBe(run2.status);
  });

  describe('league exclusions', () => {
    const leagueAId = 'leagueSeason-A';
    const leagueBId = 'leagueSeason-B';

    const makeLeagueExclusionSpec = (): SchedulerProblemSpec => ({
      season: {
        id: 'spring-2026',
        name: 'Spring 2026',
        startDate: '2026-04-01',
        endDate: '2026-08-31',
        gameDurations: { defaultMinutes: 75 },
      },
      teams: [
        { id: 'team-1', teamSeasonId: 'teamSeason-1', league: { id: leagueAId } },
        { id: 'team-2', teamSeasonId: 'teamSeason-2', league: { id: leagueAId } },
        { id: 'team-3', teamSeasonId: 'teamSeason-3', league: { id: leagueBId } },
        { id: 'team-4', teamSeasonId: 'teamSeason-4', league: { id: leagueBId } },
      ],
      fields: [{ id: 'field-1', name: 'Field 1' }],
      umpires: [],
      games: [
        {
          id: 'game-league-A',
          leagueSeasonId: leagueAId,
          homeTeamSeasonId: 'teamSeason-1',
          visitorTeamSeasonId: 'teamSeason-2',
          requiredUmpires: 0,
        },
        {
          id: 'game-league-B',
          leagueSeasonId: leagueBId,
          homeTeamSeasonId: 'teamSeason-3',
          visitorTeamSeasonId: 'teamSeason-4',
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
        {
          id: 'slot-2',
          fieldId: 'field-1',
          startTime: '2026-04-05T11:30:00Z',
          endTime: '2026-04-05T13:00:00Z',
        },
      ],
      constraints: { hard: { respectFieldSlots: true } },
    });

    it('with/without contrast: league exclusion covering all slots makes league A game unscheduled', () => {
      const service = new SchedulerEngineService();
      const spec = makeLeagueExclusionSpec();

      const withoutExclusion = service.solve(spec);
      const gameAWithout = withoutExclusion.assignments.find((a) => a.gameId === 'game-league-A');
      expect(gameAWithout).toBeDefined();

      const withExclusion = service.solve({
        ...spec,
        leagueExclusions: [
          {
            id: 'lex-1',
            seasonId: 'spring-2026',
            leagueSeasonId: leagueAId,
            startTime: '2026-04-05T09:00:00Z',
            endTime: '2026-04-05T13:00:00Z',
            enabled: true,
          },
        ],
      });

      const gameAWith = withExclusion.assignments.find((a) => a.gameId === 'game-league-A');
      expect(gameAWith).toBeUndefined();
      expect(withExclusion.unscheduled.some((u) => u.gameId === 'game-league-A')).toBe(true);
    });

    it('league A exclusion does not block a game in league B from the same slots', () => {
      const service = new SchedulerEngineService();
      const result = service.solve({
        ...makeLeagueExclusionSpec(),
        leagueExclusions: [
          {
            id: 'lex-1',
            seasonId: 'spring-2026',
            leagueSeasonId: leagueAId,
            startTime: '2026-04-05T09:00:00Z',
            endTime: '2026-04-05T13:00:00Z',
            enabled: true,
          },
        ],
      });

      const gameBAssignment = result.assignments.find((a) => a.gameId === 'game-league-B');
      expect(gameBAssignment).toBeDefined();
    });

    it('disabled league exclusions have no effect on scheduling', () => {
      const service = new SchedulerEngineService();
      const result = service.solve({
        ...makeLeagueExclusionSpec(),
        leagueExclusions: [
          {
            id: 'lex-disabled',
            seasonId: 'spring-2026',
            leagueSeasonId: leagueAId,
            startTime: '2026-04-05T09:00:00Z',
            endTime: '2026-04-05T13:00:00Z',
            enabled: false,
          },
        ],
      });

      const gameAAssignment = result.assignments.find((a) => a.gameId === 'game-league-A');
      expect(gameAAssignment).toBeDefined();
    });
  });
});

describe('SchedulerEngineService — fixedGames occupancy seeding', () => {
  const makeFixedGameSpec = (): SchedulerProblemSpec => ({
    season: {
      id: 'season-fixed',
      name: 'Fixed Test Season',
      startDate: '2026-04-01',
      endDate: '2026-08-31',
      gameDurations: { defaultMinutes: 60 },
    },
    teams: [
      { id: 'team-1', teamSeasonId: 'ts-1', league: { id: 'league-1' } },
      { id: 'team-2', teamSeasonId: 'ts-2', league: { id: 'league-1' } },
      { id: 'team-3', teamSeasonId: 'ts-3', league: { id: 'league-1' } },
      { id: 'team-4', teamSeasonId: 'ts-4', league: { id: 'league-1' } },
    ],
    fields: [
      { id: 'field-1', name: 'Field 1' },
      { id: 'field-2', name: 'Field 2' },
    ],
    umpires: [{ id: 'ump-1', name: 'Alice' }],
    games: [
      {
        id: 'candidate-game',
        leagueSeasonId: 'league-1',
        homeTeamSeasonId: 'ts-3',
        visitorTeamSeasonId: 'ts-4',
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
      {
        id: 'slot-2',
        fieldId: 'field-1',
        startTime: '2026-04-05T11:00:00Z',
        endTime: '2026-04-05T12:30:00Z',
      },
      {
        id: 'slot-field2',
        fieldId: 'field-2',
        startTime: '2026-04-05T09:00:00Z',
        endTime: '2026-04-05T10:30:00Z',
      },
    ],
    constraints: { hard: {} },
  });

  it('no fixedGames: candidate game is placed in slot-1', () => {
    const service = new SchedulerEngineService();
    const result = service.solve(makeFixedGameSpec());

    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0]?.startTime).toBe('2026-04-05T09:00:00.000Z');
    expect(result.assignments[0]?.fieldId).toBe('field-1');
  });

  it('fixedGame occupying field-1 at slot-1 forces candidate to the next available slot on that field', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      ...makeFixedGameSpec(),
      fields: [{ id: 'field-1', name: 'Field 1' }],
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
          startTime: '2026-04-05T11:00:00Z',
          endTime: '2026-04-05T12:30:00Z',
        },
      ],
      fixedGames: [
        {
          fieldId: 'field-1',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:00:00Z',
          teamSeasonIds: ['ts-1', 'ts-2'],
        },
      ],
    };

    const result = service.solve(spec);

    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0]?.startTime).toBe('2026-04-05T11:00:00.000Z');
    expect(result.assignments[0]?.fieldId).toBe('field-1');
  });

  it('fixedGame making a team busy at slot-1 forces candidate to a different slot', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      ...makeFixedGameSpec(),
      games: [
        {
          id: 'candidate-game',
          leagueSeasonId: 'league-1',
          homeTeamSeasonId: 'ts-1',
          visitorTeamSeasonId: 'ts-3',
          requiredUmpires: 0,
        },
      ],
      fixedGames: [
        {
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:00:00Z',
          teamSeasonIds: ['ts-1', 'ts-2'],
        },
      ],
    };

    const result = service.solve(spec);

    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0]?.startTime).not.toBe('2026-04-05T09:00:00.000Z');
  });

  it('fixedGame on an unrelated field and team does NOT block the candidate from slot-1', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      ...makeFixedGameSpec(),
      fixedGames: [
        {
          fieldId: 'field-2',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:00:00Z',
          teamSeasonIds: ['ts-1', 'ts-2'],
        },
      ],
    };

    const result = service.solve(spec);

    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0]?.startTime).toBe('2026-04-05T09:00:00.000Z');
    expect(result.assignments[0]?.fieldId).toBe('field-1');
  });

  it('fixedGame with umpire blocks that umpire for the same time slot', () => {
    const service = new SchedulerEngineService();
    const spec: SchedulerProblemSpec = {
      ...makeFixedGameSpec(),
      games: [
        {
          id: 'candidate-game',
          leagueSeasonId: 'league-1',
          homeTeamSeasonId: 'ts-3',
          visitorTeamSeasonId: 'ts-4',
          requiredUmpires: 1,
        },
      ],
      umpireAvailability: [
        { umpireId: 'ump-1', startTime: '2026-04-05T08:00:00Z', endTime: '2026-04-05T18:00:00Z' },
      ],
      fixedGames: [
        {
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:00:00Z',
          teamSeasonIds: ['ts-1', 'ts-2'],
          umpireIds: ['ump-1'],
        },
      ],
      constraints: { hard: { respectUmpireAvailability: true } },
    };

    const result = service.solve(spec);

    expect(result.status).toBe('completed');
    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0]?.startTime).not.toBe('2026-04-05T09:00:00.000Z');
    expect(result.assignments[0]?.umpireIds).toEqual(['ump-1']);
  });
});
