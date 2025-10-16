import { useCallback, useEffect, useMemo } from 'react';
import { useScheduleStore, selectAssignments, selectTeams, selectUpcomingGames } from '../state/scheduleStore';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';

export function useScheduleData() {
  const { session } = useAuth();
  const { isOnline } = useNetworkStatus();
  const hydrated = useScheduleStore((state) => state.hydrated);
  const status = useScheduleStore((state) => state.status);
  const error = useScheduleStore((state) => state.error);
  const hydrate = useScheduleStore((state) => state.hydrate);
  const refresh = useScheduleStore((state) => state.refresh);

  const upcomingGames = useScheduleStore(selectUpcomingGames);
  const teams = useScheduleStore(selectTeams);
  const assignments = useScheduleStore(selectAssignments);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!session?.token || !isOnline) {
      return;
    }

    void refresh(session.token).catch(() => {
      // Error state is handled inside the store
    });
  }, [refresh, session?.token, isOnline]);

  const manualRefresh = useCallback(() => {
    if (!session?.token) {
      return Promise.resolve();
    }

    return refresh(session.token);
  }, [refresh, session?.token]);

  return useMemo(
    () => ({
      upcomingGames,
      teams,
      assignments,
      isOnline,
      status,
      hydrated,
      error,
      refresh: manualRefresh
    }),
    [assignments, error, hydrated, isOnline, manualRefresh, status, teams, upcomingGames],
  );
}
