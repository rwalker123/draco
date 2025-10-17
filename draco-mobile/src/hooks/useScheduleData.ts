import { useCallback, useEffect, useMemo } from 'react';
import {
  useScheduleStore,
  selectAssignments,
  selectTeams,
  selectUpcomingGames,
  selectSeasonId
} from '../state/scheduleStore';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';

export function useScheduleData() {
  const { session } = useAuth();
  const { isOnline } = useNetworkStatus();
  const sessionToken = session?.token;
  const sessionAccountId = session?.accountId;
  const hydrated = useScheduleStore((state) => state.hydrated);
  const status = useScheduleStore((state) => state.status);
  const error = useScheduleStore((state) => state.error);
  const hydrate = useScheduleStore((state) => state.hydrate);
  const refresh = useScheduleStore((state) => state.refresh);

  const upcomingGames = useScheduleStore(selectUpcomingGames);
  const teams = useScheduleStore(selectTeams);
  const assignments = useScheduleStore(selectAssignments);
  const seasonId = useScheduleStore(selectSeasonId);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!sessionToken || !sessionAccountId || !isOnline) {
      return;
    }

    void refresh({ token: sessionToken, accountId: sessionAccountId }).catch(() => {
      // Error state is handled inside the store
    });
  }, [refresh, sessionAccountId, sessionToken, isOnline]);

  const manualRefresh = useCallback(() => {
    if (!sessionToken || !sessionAccountId) {
      return Promise.resolve();
    }

    return refresh({ token: sessionToken, accountId: sessionAccountId });
  }, [refresh, sessionAccountId, sessionToken]);

  return useMemo(
    () => ({
      upcomingGames,
      teams,
      assignments,
      seasonId,
      isOnline,
      status,
      hydrated,
      error,
      refresh: manualRefresh
    }),
    [assignments, error, hydrated, isOnline, manualRefresh, seasonId, status, teams, upcomingGames],
  );
}
