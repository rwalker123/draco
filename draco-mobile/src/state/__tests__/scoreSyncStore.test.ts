import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { submitScoreMutation } from '../../services/scoring/scoreApi';
import { useScoreSyncStore } from '../scoreSyncStore';
import { useScorecardStore } from '../scorecardStore';

vi.mock('react-native', () => ({
  NativeModules: {},
  Platform: {
    OS: 'ios',
    select: (options: Record<string, unknown>) => options.ios ?? options.default ?? null,
  },
  AppState: {
    currentState: 'active',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  TurboModuleRegistry: {
    get: vi.fn(),
    getEnforcing: vi.fn(),
  },
}));

const { mockSubmitScoreMutation } = vi.hoisted(() => ({
  mockSubmitScoreMutation: vi.fn(),
}));

vi.mock('../../services/scoring/scoreApi', () => ({
  submitScoreMutation: mockSubmitScoreMutation,
}));

async function createGameWithEvent() {
  await useScorecardStore.getState().setActiveGame({
    id: 'game-1',
    homeTeam: { id: 'home', name: 'Home Team' } as any,
    visitorTeam: { id: 'away', name: 'Away Team' } as any,
    field: { name: 'Field' } as any,
    startsAt: new Date().toISOString(),
  });

  return await useScorecardStore.getState().recordEvent('game-1', {
    type: 'at_bat',
    batter: { id: 'batter-1', name: 'Batter One' },
    result: 'single',
    advances: [],
  }, {
    userName: 'Tester',
    deviceId: 'device-1',
    accountId: 'account-1',
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  useScoreSyncStore.setState({ hydrated: true, syncing: false, queue: [] });
  useScorecardStore.setState((state) => ({
    ...state,
    games: {},
    activeGameId: null,
    hydrated: true,
    status: 'idle',
    error: null,
  }));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('scoreSyncStore', () => {
  it('enqueues mutations with pending status', async () => {
    const event = await createGameWithEvent();
    await useScoreSyncStore.getState().enqueue({
      accountId: 'account-1',
      gameId: 'game-1',
      event,
      audit: {
        userName: 'Tester',
        deviceId: 'device-1',
        timestamp: '2024-01-01T00:00:00Z',
      },
    });

    const queue = useScoreSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      accountId: 'account-1',
      gameId: 'game-1',
      eventId: event.id,
      status: 'pending',
      attempts: 0,
    });
  });

  it('flushes pending mutations and marks events as synced', async () => {
    const event = await createGameWithEvent();
    await useScoreSyncStore.getState().enqueue({
      accountId: 'account-1',
      gameId: 'game-1',
      event,
      audit: {
        userName: 'Tester',
        deviceId: 'device-1',
        timestamp: '2024-01-01T00:00:00Z',
      },
    });

    const serverEvent = JSON.parse(JSON.stringify({ ...event, serverId: 'server-1', syncStatus: 'synced', syncError: null }));

    mockSubmitScoreMutation.mockResolvedValue({
      serverEventId: 'server-1',
      sequence: event.sequence,
      event: serverEvent,
    });

    await useScoreSyncStore.getState().flush('token-123');

    expect(useScoreSyncStore.getState().queue).toHaveLength(0);
    const updated = useScorecardStore
      .getState()
      .games['game-1'].events.find((existing) => existing.id === event.id);
    expect(updated?.serverId).toBe('server-1');
    expect(updated?.syncStatus).toBe('synced');
  });

  it('updates mutations with failure state when sync fails', async () => {
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    const event = await createGameWithEvent();
    await useScoreSyncStore.getState().enqueue({
      accountId: 'account-1',
      gameId: 'game-1',
      event,
      audit: {
        userName: 'Tester',
        deviceId: 'device-1',
        timestamp: '2024-01-01T00:00:00Z',
      },
    });

    mockSubmitScoreMutation.mockRejectedValue(new Error('network down'));

    await useScoreSyncStore.getState().flush('token-123');

    const [mutation] = useScoreSyncStore.getState().queue;
    expect(mutation.status).toBe('failed');
    expect(mutation.attempts).toBe(1);
    expect(mutation.lastError).toBe('network down');
    expect(mutation.nextRetryAt).toBeGreaterThan(Date.now());
    const updated = useScorecardStore
      .getState()
      .games['game-1'].events.find((existing) => existing.id === event.id);
    expect(updated?.syncStatus).toBe('failed');
  });
});

