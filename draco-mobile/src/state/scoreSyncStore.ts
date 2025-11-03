import { createStore } from './createStore';
import { generateId } from '../utils/id';
import type { ScoreEvent, ScoreEventMutation, ScoreMutationAudit, ScoreMutationType } from '../types/scoring';
import { loadScoreSyncQueue, saveScoreSyncQueue } from '../storage/scoreSyncStorage';
import { useScorecardStore } from './scorecardStore';
import { submitScoreMutation } from '../services/scoring/scoreApi';
import { ApiError } from '../services/api/httpClient';

const MAX_BACKOFF_MS = 5 * 60 * 1000;
const BASE_BACKOFF_MS = 2000;

const eligibleStatuses: ScoreEventMutation['status'][] = ['pending', 'failed'];

type EnqueueOptions = {
  accountId: string;
  gameId: string;
  event: ScoreEvent;
  audit: ScoreMutationAudit;
  type?: ScoreMutationType;
};

type ScoreSyncState = {
  hydrated: boolean;
  syncing: boolean;
  queue: ScoreEventMutation[];
  hydrate: () => Promise<void>;
  enqueue: (options: EnqueueOptions) => Promise<void>;
  removeForEvent: (eventId: string) => Promise<void>;
  flush: (token: string) => Promise<void>;
  retry: (mutationId: string) => Promise<void>;
  clear: () => Promise<void>;
};

const now = () => Date.now();

const computeNextRetryAt = (attempts: number) =>
  now() + Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, Math.max(0, attempts - 1)));

export const useScoreSyncStore = createStore<ScoreSyncState>((set, get) => ({
  hydrated: false,
  syncing: false,
  queue: [],
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }

    const stored = await loadScoreSyncQueue();
    set({ hydrated: true, queue: stored });
  },
  enqueue: async ({ accountId, gameId, event, audit, type = 'create' }) => {
    const mutation: ScoreEventMutation = {
      id: generateId('mutation'),
      accountId,
      gameId,
      eventId: event.id,
      serverId: event.serverId,
      sequence: event.sequence,
      type,
      payload: event,
      audit,
      attempts: 0,
      status: 'pending',
      lastError: null,
      nextRetryAt: now(),
    };

    const updated = [...get().queue, mutation];
    set({ queue: updated });
    await saveScoreSyncQueue(updated);
  },
  removeForEvent: async (eventId: string) => {
    const filtered = get().queue.filter((mutation) => mutation.eventId !== eventId);
    set({ queue: filtered });
    await saveScoreSyncQueue(filtered);
  },
  flush: async (token: string) => {
    const state = get();
    if (state.syncing) {
      return;
    }

    const mutations = state.queue;
    const ready = mutations.filter(
      (mutation) =>
        eligibleStatuses.includes(mutation.status) && (!mutation.nextRetryAt || mutation.nextRetryAt <= now()),
    );

    if (!ready.length) {
      return;
    }

    set({ syncing: true });

    for (const mutation of ready) {
      try {
        await useScorecardStore.getState().markEventSyncing(mutation.gameId, mutation.eventId);
      } catch {
        // Ignore marking errors; continue syncing queue
      }

      const syncingQueue = get().queue.map((item) =>
        item.id === mutation.id
          ? {
              ...item,
              status: 'syncing',
              lastError: null,
              nextRetryAt: null,
            }
          : item,
      );
      set({ queue: syncingQueue });
      await saveScoreSyncQueue(syncingQueue);

      try {
        const response = await submitScoreMutation(token, mutation);
        const nextQueue = get().queue.filter((item) => item.id !== mutation.id);
        set({ queue: nextQueue });
        await saveScoreSyncQueue(nextQueue);

        if (response.event) {
          try {
            await useScorecardStore
              .getState()
              .markEventSynced(mutation.gameId, mutation.eventId, {
                serverId: response.serverEventId,
                sequence: response.sequence,
                input: response.event.input,
                createdAt: response.event.createdAt,
              });
          } catch {
            // If updating scorecard fails we still continue; queue already cleared
          }
        }
      } catch (error) {
        const message = extractErrorMessage(error);
        const nextAttempts = mutation.attempts + 1;
        const updatedMutation: ScoreEventMutation = {
          ...mutation,
          attempts: nextAttempts,
          status: 'failed',
          lastError: message,
          nextRetryAt: computeNextRetryAt(nextAttempts),
        };
        const nextQueue = get().queue.map((item) => (item.id === mutation.id ? updatedMutation : item));
        set({ queue: nextQueue });
        await saveScoreSyncQueue(nextQueue);

        try {
          await useScorecardStore.getState().markEventFailed(mutation.gameId, mutation.eventId, message);
        } catch {
          // ignore
        }
      }
    }

    set({ syncing: false });
  },
  retry: async (mutationId: string) => {
    const nextQueue = get().queue.map((mutation) =>
      mutation.id === mutationId
        ? {
            ...mutation,
            status: 'pending',
            lastError: null,
            nextRetryAt: now(),
          }
        : mutation,
    );
    set({ queue: nextQueue });
    await saveScoreSyncQueue(nextQueue);
  },
  clear: async () => {
    set({ queue: [] });
    await saveScoreSyncQueue([]);
  },
}));

function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409 && typeof error.responseBody === 'object' && error.responseBody && 'message' in error.responseBody) {
      return String((error.responseBody as { message?: unknown }).message ?? 'Server rejected the update');
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to sync event';
}

export const selectPendingMutations = (state: ScoreSyncState): ScoreEventMutation[] =>
  state.queue.filter((mutation) => mutation.status === 'pending' || mutation.status === 'syncing');

export const selectFailedMutations = (state: ScoreSyncState): ScoreEventMutation[] =>
  state.queue.filter((mutation) => mutation.status === 'failed');

export const selectQueueLength = (state: ScoreSyncState): number => state.queue.length;
