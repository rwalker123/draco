import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ loading: false, user: null })),
}));

vi.mock('../../../hooks/useApiClient', () => ({
  useApiClient: vi.fn(() => ({ key: 'test-client' })),
}));

vi.mock('@draco/shared-api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@draco/shared-api-client')>();
  return {
    ...actual,
    getCurrentSeason: vi.fn(),
    listSeasonLeagueSeasons: vi.fn(),
  };
});

vi.mock('../adapters', () => ({
  getSportAdapter: vi.fn(() => ({
    hasOfficials: false,
    locationLabel: 'Field',
    officialLabel: 'Umpire',
    loadLocations: vi.fn(async () => []),
    loadGames: vi.fn(async () => []),
    deleteGame: vi.fn(async () => {}),
    GameDialog: () => null,
    ScoreEntryDialog: () => null,
  })),
}));

describe('useScheduleData module-level helpers', { timeout: 15000 }, () => {
  it('module-level pure helpers (getMonthKeyFromDate, getMonthRangeForKey, getMonthKeysForRange, collectGamesForRange, computeDateRange) are not exported', async () => {
    const mod = await import('../useScheduleData');
    const exportedKeys = Object.keys(mod);

    expect(exportedKeys).toContain('useScheduleData');
    expect(exportedKeys).not.toContain('getMonthKeyFromDate');
    expect(exportedKeys).not.toContain('getMonthRangeForKey');
    expect(exportedKeys).not.toContain('getMonthKeysForRange');
    expect(exportedKeys).not.toContain('collectGamesForRange');
    expect(exportedKeys).not.toContain('computeDateRange');
  });

  it('exports only the useScheduleData hook', async () => {
    const mod = await import('../useScheduleData');
    const exportedKeys = Object.keys(mod);

    expect(exportedKeys).toHaveLength(1);
    expect(typeof mod.useScheduleData).toBe('function');
  });
});
