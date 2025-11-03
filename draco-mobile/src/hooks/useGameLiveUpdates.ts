import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { connectToGameStream } from '../services/scoring/liveUpdates';
import { useScorecardStore } from '../state/scorecardStore';
import type { ScoreEvent } from '../types/scoring';

export function useGameLiveUpdates(gameId: string | null): void {
  const { session } = useAuth();
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (!gameId || !session?.token || !session.accountId || !isOnline) {
      return;
    }

    const subscription = connectToGameStream({
      accountId: session.accountId,
      gameId,
      token: session.token,
      onEvent: (event: ScoreEvent) => {
        void useScorecardStore
          .getState()
          .ingestServerEvent(gameId, { ...event, syncStatus: 'synced', syncError: null });
      },
      onError: (error) => {
        console.warn('Score event stream error', error);
      },
    });

    return () => {
      subscription.close();
    };
  }, [gameId, isOnline, session?.accountId, session?.token]);
}
