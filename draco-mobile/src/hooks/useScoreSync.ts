import { useCallback, useEffect, useMemo } from 'react';
import type { ScoreEvent, ScoreMutationAudit, ScoreMutationType } from '../types/scoring';
import {
  useScoreSyncStore,
  selectFailedMutations,
  selectPendingMutations,
  selectQueueLength,
} from '../state/scoreSyncStore';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';

export function useScoreSync() {
  const hydrate = useScoreSyncStore((state) => state.hydrate);
  const enqueue = useScoreSyncStore((state) => state.enqueue);
  const flushQueue = useScoreSyncStore((state) => state.flush);
  const retryMutation = useScoreSyncStore((state) => state.retry);
  const removeForEvent = useScoreSyncStore((state) => state.removeForEvent);
  const pendingMutations = useScoreSyncStore(selectPendingMutations);
  const failedMutations = useScoreSyncStore(selectFailedMutations);
  const queueLength = useScoreSyncStore(selectQueueLength);
  const { session } = useAuth();
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!session?.token || !isOnline) {
      return;
    }

    void flushQueue(session.token);
  }, [flushQueue, isOnline, session?.token]);

  const enqueueEvent = useCallback(
    async (event: ScoreEvent, audit: ScoreMutationAudit, type: ScoreMutationType = 'create') => {
      if (!session?.accountId) {
        return;
      }

      await enqueue({ accountId: session.accountId, gameId: event.gameId, event, audit, type });
      if (session.token && isOnline) {
        await flushQueue(session.token);
      }
    },
    [enqueue, flushQueue, isOnline, session?.accountId, session?.token],
  );

  const retry = useCallback(
    async (mutationId: string) => {
      await retryMutation(mutationId);
      if (session?.token && isOnline) {
        await flushQueue(session.token);
      }
    },
    [flushQueue, isOnline, retryMutation, session?.token],
  );

  const removeEventMutations = useCallback(
    (eventId: string) => removeForEvent(eventId),
    [removeForEvent],
  );

  const status = useMemo(
    () => ({
      pending: pendingMutations.length,
      failed: failedMutations.length,
      total: queueLength,
    }),
    [failedMutations.length, pendingMutations.length, queueLength],
  );

  return {
    enqueueEvent,
    retry,
    removeEventMutations,
    pendingMutations,
    failedMutations,
    status,
    flush: flushQueue,
    token: session?.token ?? null,
    isOnline,
  };
}
