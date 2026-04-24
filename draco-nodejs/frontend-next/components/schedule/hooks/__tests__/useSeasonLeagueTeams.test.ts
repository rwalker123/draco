import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TeamSeasonType } from '@draco/shared-schemas';

const { loadTeamsMock, getSportAdapterMock, stableApiClient } = vi.hoisted(() => {
  const loadTeamsMock = vi.fn();
  const getSportAdapterMock = vi.fn();
  const stableApiClient = { key: 'test-client' };
  return { loadTeamsMock, getSportAdapterMock, stableApiClient };
});

vi.mock('../../../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ loading: false, user: null })),
}));

vi.mock('../../../../hooks/useApiClient', () => ({
  useApiClient: vi.fn(() => stableApiClient),
}));

vi.mock('../../adapters', () => ({
  getSportAdapter: getSportAdapterMock,
}));

const makeAdapter = (overrides: Partial<{ loadTeams: typeof loadTeamsMock }> = {}) => ({
  sportType: 'baseball',
  locationLabel: 'Field',
  hasOfficials: true,
  officialLabel: 'Umpire',
  loadLocations: vi.fn(async () => []),
  loadGames: vi.fn(async () => []),
  createGame: vi.fn(),
  updateGame: vi.fn(),
  deleteGame: vi.fn(),
  GameDialog: () => null,
  ScoreEntryDialog: () => null,
  loadTeams: loadTeamsMock,
  ...overrides,
});

const buildTeam = (id: string, name: string): TeamSeasonType =>
  ({
    id,
    name,
  }) as TeamSeasonType;

describe('useSeasonLeagueTeams', () => {
  beforeEach(() => {
    loadTeamsMock.mockReset();
    getSportAdapterMock.mockReset();
    getSportAdapterMock.mockReturnValue(makeAdapter());
  });

  it('calls adapter.loadTeams with the provided seasonId (not current season)', async () => {
    loadTeamsMock.mockResolvedValue({ leagues: [], leagueTeamsCache: new Map() });

    const { useSeasonLeagueTeams } = await import('../useSeasonLeagueTeams');
    renderHook(() =>
      useSeasonLeagueTeams({ accountId: '1', seasonId: '65', accountType: 'baseball' }),
    );

    await waitFor(() => {
      expect(loadTeamsMock).toHaveBeenCalledTimes(1);
    });

    expect(loadTeamsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: '1',
        seasonId: '65',
      }),
    );
  });

  it('populates leagues and leagueTeamsCache from the adapter response', async () => {
    const teamA = buildTeam('t-a', 'Alpha');
    const teamB = buildTeam('t-b', 'Beta');
    const cache = new Map<string, TeamSeasonType[]>([['ls-1', [teamA, teamB]]]);
    loadTeamsMock.mockResolvedValue({
      leagues: [{ id: 'ls-1', name: 'A League' }],
      leagueTeamsCache: cache,
    });

    const { useSeasonLeagueTeams } = await import('../useSeasonLeagueTeams');
    const { result } = renderHook(() => useSeasonLeagueTeams({ accountId: '1', seasonId: '65' }));

    await waitFor(() => {
      expect(result.current.leagues).toEqual([{ id: 'ls-1', name: 'A League' }]);
    });

    expect(result.current.leagueTeamsCache.get('ls-1')).toEqual([teamA, teamB]);
    expect(result.current.loading).toBe(false);
  });

  it('threads an AbortSignal into adapter.loadTeams', async () => {
    loadTeamsMock.mockResolvedValue({ leagues: [], leagueTeamsCache: new Map() });

    const { useSeasonLeagueTeams } = await import('../useSeasonLeagueTeams');
    renderHook(() => useSeasonLeagueTeams({ accountId: '1', seasonId: '65' }));

    await waitFor(() => {
      expect(loadTeamsMock).toHaveBeenCalled();
    });

    const signal = loadTeamsMock.mock.calls[0][0].signal as AbortSignal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal.aborted).toBe(false);
  });

  it('aborts the in-flight request when the hook unmounts', async () => {
    loadTeamsMock.mockResolvedValue({ leagues: [], leagueTeamsCache: new Map() });

    const { useSeasonLeagueTeams } = await import('../useSeasonLeagueTeams');
    const { unmount } = renderHook(() => useSeasonLeagueTeams({ accountId: '1', seasonId: '65' }));

    await waitFor(() => {
      expect(loadTeamsMock).toHaveBeenCalled();
    });

    const signal = loadTeamsMock.mock.calls[0][0].signal as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it('refetches when seasonId changes', async () => {
    loadTeamsMock.mockResolvedValue({ leagues: [], leagueTeamsCache: new Map() });

    const { useSeasonLeagueTeams } = await import('../useSeasonLeagueTeams');
    const { rerender } = renderHook(
      ({ seasonId }: { seasonId: string }) => useSeasonLeagueTeams({ accountId: '1', seasonId }),
      { initialProps: { seasonId: '65' } },
    );

    await waitFor(() => {
      expect(loadTeamsMock).toHaveBeenCalledTimes(1);
    });
    expect(loadTeamsMock.mock.calls[0][0].seasonId).toBe('65');

    rerender({ seasonId: '70' });

    await waitFor(() => {
      expect(loadTeamsMock).toHaveBeenCalledTimes(2);
    });
    expect(loadTeamsMock.mock.calls[1][0].seasonId).toBe('70');
  });

  it('reports errors via onError and leaves the cache empty', async () => {
    loadTeamsMock.mockRejectedValue(new Error('boom'));
    const onError = vi.fn();

    const { useSeasonLeagueTeams } = await import('../useSeasonLeagueTeams');
    const { result } = renderHook(() =>
      useSeasonLeagueTeams({ accountId: '1', seasonId: '65', onError }),
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('Unable to load team data'));
    });

    expect(result.current.leagues).toEqual([]);
    expect(result.current.leagueTeamsCache.size).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it('does not fetch when the adapter has no loadTeams implementation', async () => {
    getSportAdapterMock.mockReturnValue({
      ...makeAdapter(),
      loadTeams: undefined,
    });

    const { useSeasonLeagueTeams } = await import('../useSeasonLeagueTeams');
    const { result } = renderHook(() =>
      useSeasonLeagueTeams({ accountId: '1', seasonId: '65', accountType: 'unknown' }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(loadTeamsMock).not.toHaveBeenCalled();
    expect(result.current.leagues).toEqual([]);
    expect(result.current.leagueTeamsCache.size).toBe(0);
  });

  it('does not fetch when accountId or seasonId is missing', async () => {
    loadTeamsMock.mockResolvedValue({ leagues: [], leagueTeamsCache: new Map() });

    const { useSeasonLeagueTeams } = await import('../useSeasonLeagueTeams');
    renderHook(() => useSeasonLeagueTeams({ accountId: '', seasonId: '65' }));
    renderHook(() => useSeasonLeagueTeams({ accountId: '1', seasonId: '' }));

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(loadTeamsMock).not.toHaveBeenCalled();
  });
});
