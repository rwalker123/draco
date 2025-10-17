import { createStore } from './createStore';
import type {
  ScorekeeperAssignment,
  TeamSummary,
  UpcomingGame,
} from '../types/schedule';
import { fetchScheduleSnapshot } from '../services/schedule/scheduleApi';
import {
  clearScheduleSnapshot,
  loadScheduleSnapshot,
  saveScheduleSnapshot
} from '../storage/scheduleStorage';

type ScheduleStatus = 'idle' | 'loading' | 'error';

type ScheduleState = {
  hydrated: boolean;
  status: ScheduleStatus;
  error: string | null;
  gamesById: Record<string, UpcomingGame>;
  gameOrder: string[];
  teamsById: Record<string, TeamSummary>;
  assignmentsById: Record<string, ScorekeeperAssignment>;
  lastSyncedAt: number | null;
  seasonId: string | null;
  hydrate: () => Promise<void>;
  refresh: (params: { token: string; accountId: string }) => Promise<void>;
  clear: () => Promise<void>;
};

const buildGameOrder = (games: UpcomingGame[]): string[] =>
  [...games]
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .map((game) => game.id);

const mapById = <T extends { id: string }>(items: T[]): Record<string, T> => {
  return items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
};

export const useScheduleStore = createStore<ScheduleState>((set, get) => ({
  hydrated: false,
  status: 'idle',
  error: null,
  gamesById: {},
  gameOrder: [],
  teamsById: {},
  assignmentsById: {},
  lastSyncedAt: null,
  seasonId: null,
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }

    const cached = await loadScheduleSnapshot();
    if (!cached) {
      set({ hydrated: true });
      return;
    }

    set({
      hydrated: true,
      status: 'idle',
      error: null,
      gamesById: mapById(cached.games),
      gameOrder: buildGameOrder(cached.games),
      teamsById: mapById(cached.teams),
      assignmentsById: mapById(cached.assignments),
      seasonId: cached.seasonId ?? null
    });
  },
  refresh: async ({ token, accountId }) => {
    set({ status: 'loading', error: null });
    try {
      const snapshot = await fetchScheduleSnapshot({ token, accountId });
      set({
        status: 'idle',
        error: null,
        hydrated: true,
        gamesById: mapById(snapshot.games),
        gameOrder: buildGameOrder(snapshot.games),
        teamsById: mapById(snapshot.teams),
      assignmentsById: mapById(snapshot.assignments),
      lastSyncedAt: Date.now(),
      seasonId: snapshot.seasonId ?? null
    });
      await saveScheduleSnapshot(snapshot);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh schedule';
      set({ status: 'error', error: message, hydrated: true });
      throw error;
    }
  },
  clear: async () => {
    set({
      gamesById: {},
      gameOrder: [],
      teamsById: {},
      assignmentsById: {},
      status: 'idle',
      error: null,
      hydrated: false,
      lastSyncedAt: null,
      seasonId: null
    });
    await clearScheduleSnapshot();
  }
}));

export const selectUpcomingGames = (state: ScheduleState): UpcomingGame[] =>
  state.gameOrder.map((gameId) => state.gamesById[gameId]).filter(Boolean);

export const selectTeams = (state: ScheduleState): TeamSummary[] => Object.values(state.teamsById);

export const selectAssignments = (state: ScheduleState): ScorekeeperAssignment[] =>
  Object.values(state.assignmentsById);

export const selectSeasonId = (state: ScheduleState): string | null => state.seasonId;
