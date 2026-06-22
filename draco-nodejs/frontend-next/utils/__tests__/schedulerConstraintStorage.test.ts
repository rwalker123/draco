import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildSolveConstraints,
  DEFAULT_CONSTRAINT_CONFIG,
  loadConstraintConfig,
  saveConstraintConfig,
  type SchedulerConstraintConfig,
} from '../schedulerConstraintStorage';

const cloneDefault = (): SchedulerConstraintConfig => ({
  ...DEFAULT_CONSTRAINT_CONFIG,
  softOrder: [...DEFAULT_CONSTRAINT_CONFIG.softOrder],
  avoidBackToBackGames: { ...DEFAULT_CONSTRAINT_CONFIG.avoidBackToBackGames },
  spreadGamesAcrossDays: { ...DEFAULT_CONSTRAINT_CONFIG.spreadGamesAcrossDays },
  balanceEarlyVsLate: { ...DEFAULT_CONSTRAINT_CONFIG.balanceEarlyVsLate },
  maxGamesPerTeamPerDay: { ...DEFAULT_CONSTRAINT_CONFIG.maxGamesPerTeamPerDay },
  requireLightsAfter: { ...DEFAULT_CONSTRAINT_CONFIG.requireLightsAfter },
});

describe('schedulerConstraintStorage — buildSolveConstraints', () => {
  it('returns undefined when nothing is enabled and no umpire limit is supplied', () => {
    expect(buildSolveConstraints(cloneDefault(), undefined)).toBeUndefined();
  });

  it('includes only the umpire limit when no constraint is enabled', () => {
    expect(buildSolveConstraints(cloneDefault(), 3)).toEqual({
      hard: { maxGamesPerUmpirePerDay: 3 },
    });
  });

  it('derives soft weights from list order (top = highest)', () => {
    const config = cloneDefault();
    config.softOrder = ['spreadGamesAcrossDays', 'balanceEarlyVsLate', 'avoidBackToBackGames'];
    config.avoidBackToBackGames = { enabled: true, minRestMinutes: 120 };
    config.spreadGamesAcrossDays = { enabled: true };
    config.balanceEarlyVsLate = { enabled: true };

    const result = buildSolveConstraints(config, undefined);

    expect(result?.soft?.spreadGamesAcrossDays).toEqual({ enabled: true, weight: 3 });
    expect(result?.soft?.balanceEarlyVsLate).toEqual({ enabled: true, weight: 2 });
    expect(result?.soft?.avoidBackToBackGames).toEqual({
      enabled: true,
      minRestMinutes: 120,
      weight: 1,
    });
  });

  it('omits disabled soft constraints', () => {
    const config = cloneDefault();
    config.spreadGamesAcrossDays = { enabled: true };

    const result = buildSolveConstraints(config, undefined);

    expect(result?.soft?.spreadGamesAcrossDays).toBeDefined();
    expect(result?.soft?.avoidBackToBackGames).toBeUndefined();
    expect(result?.soft?.balanceEarlyVsLate).toBeUndefined();
  });

  it('maps enabled hard limits and merges the umpire limit', () => {
    const config = cloneDefault();
    config.maxGamesPerTeamPerDay = { enabled: true, value: 2 };
    config.requireLightsAfter = { enabled: true, startHourLocal: 19 };

    const result = buildSolveConstraints(config, 4);

    expect(result?.hard).toEqual({
      maxGamesPerUmpirePerDay: 4,
      maxGamesPerTeamPerDay: 2,
      requireLightsAfter: { enabled: true, startHourLocal: 19 },
    });
    expect(result?.soft).toBeUndefined();
  });
});

describe('schedulerConstraintStorage — persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to all-off when nothing is stored', () => {
    expect(loadConstraintConfig('1', '2026')).toEqual(DEFAULT_CONSTRAINT_CONFIG);
  });

  it('round-trips a saved config for the same account and season', () => {
    const config = cloneDefault();
    config.softOrder = ['balanceEarlyVsLate', 'avoidBackToBackGames', 'spreadGamesAcrossDays'];
    config.avoidBackToBackGames = { enabled: true, minRestMinutes: 60 };
    config.maxGamesPerTeamPerDay = { enabled: true, value: 3 };

    saveConstraintConfig('1', '2026', config);

    expect(loadConstraintConfig('1', '2026')).toEqual(config);
  });

  it('isolates config by account and season key', () => {
    const config = cloneDefault();
    config.spreadGamesAcrossDays = { enabled: true };
    saveConstraintConfig('1', '2026', config);

    expect(loadConstraintConfig('1', '2025')).toEqual(DEFAULT_CONSTRAINT_CONFIG);
    expect(loadConstraintConfig('2', '2026')).toEqual(DEFAULT_CONSTRAINT_CONFIG);
    expect(loadConstraintConfig('1', '2026').spreadGamesAcrossDays.enabled).toBe(true);
  });

  it('repairs a partial/corrupt softOrder by appending missing keys', () => {
    window.localStorage.setItem(
      'scheduler:constraintConfig:1:2026',
      JSON.stringify({ softOrder: ['balanceEarlyVsLate'] }),
    );

    const loaded = loadConstraintConfig('1', '2026');

    expect(loaded.softOrder).toEqual([
      'balanceEarlyVsLate',
      'avoidBackToBackGames',
      'spreadGamesAcrossDays',
    ]);
  });
});
