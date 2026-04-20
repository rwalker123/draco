import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useApiClient } from '../../../hooks/useApiClient';
import { Game, FilterType } from '@/types/schedule';
import { getSportAdapter } from '../adapters';
import type {
  ScheduleLocation,
  ScheduleOfficial,
  GameDialogProps,
  ScoreEntryDialogProps,
} from '../types/sportAdapter';
import {
  collectGamesForRange,
  computeDateRange,
  getMonthKeysForRange,
  getMonthRangeForKey,
} from './scheduleDateHelpers';

const EMPTY_OFFICIALS: ScheduleOfficial[] = [];

interface UseTeamScheduleDataProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
  accountType?: string;
  filterType: FilterType;
  filterDate?: Date;
  onError?: (message: string) => void;
}

interface UseTeamScheduleDataReturn {
  games: Game[];
  locations: ScheduleLocation[];
  officials: ScheduleOfficial[];
  loadingGames: boolean;
  loadingStaticData: boolean;
  loadingDateRange: boolean;
  earliestGameDate: Date | null;
  latestGameDate: Date | null;
  startDate: Date;
  endDate: Date;
  locationLabel: string;
  hasOfficials: boolean;
  officialLabel: string;
  GameDialog: ComponentType<GameDialogProps>;
  ScoreEntryDialog: ComponentType<ScoreEntryDialogProps>;
  supportsTeamSchedule: boolean;
}

export const useTeamScheduleData = ({
  accountId,
  seasonId,
  teamSeasonId,
  accountType,
  filterType,
  filterDate,
  onError,
}: UseTeamScheduleDataProps): UseTeamScheduleDataReturn => {
  const { loading: authLoading } = useAuth();
  const apiClient = useApiClient();

  const adapter = getSportAdapter(accountType);
  const supportsTeamSchedule = typeof adapter.loadTeamGames === 'function';

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const [locations, setLocations] = useState<ScheduleLocation[]>([]);
  const officials = EMPTY_OFFICIALS;

  const [games, setGames] = useState<Game[]>([]);
  const gamesCacheRef = useRef<Map<string, Game[]>>(new Map());
  const gamesRequestCacheRef = useRef<Map<string, Promise<Game[]>>>(new Map());

  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingStaticData, setLoadingStaticData] = useState(true);
  const [loadingDateRange, setLoadingDateRange] = useState(true);
  const [earliestGameDate, setEarliestGameDate] = useState<Date | null>(null);
  const [latestGameDate, setLatestGameDate] = useState<Date | null>(null);

  const referenceDate = filterDate ?? new Date();
  const { startDate, endDate } = computeDateRange(filterType, referenceDate);

  useEffect(() => {
    gamesCacheRef.current.clear();
    gamesRequestCacheRef.current.clear();
    setGames([]);
  }, [accountId, seasonId, teamSeasonId]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!supportsTeamSchedule || !adapter.loadTeamGameDateRange) {
      setEarliestGameDate(null);
      setLatestGameDate(null);
      setLoadingDateRange(false);
      return;
    }

    const controller = new AbortController();

    const runProbe = async () => {
      try {
        setLoadingDateRange(true);
        const range = await adapter.loadTeamGameDateRange!({
          accountId,
          seasonId,
          teamSeasonId,
          apiClient,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setEarliestGameDate(range.earliest);
        setLatestGameDate(range.latest);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Failed to probe team schedule date range:', err);
        setEarliestGameDate(null);
        setLatestGameDate(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingDateRange(false);
        }
      }
    };

    void runProbe();

    return () => {
      controller.abort();
    };
  }, [authLoading, accountId, seasonId, teamSeasonId, apiClient, adapter, supportsTeamSchedule]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!supportsTeamSchedule) {
      setLocations([]);
      setLoadingStaticData(false);
      return;
    }

    const controller = new AbortController();

    const runLoadStaticData = async () => {
      try {
        setLoadingStaticData(true);

        try {
          const loadedLocations = await adapter.loadLocations({
            accountId,
            apiClient,
            signal: controller.signal,
          });
          if (controller.signal.aborted) return;
          setLocations(loadedLocations);
        } catch (locationsError) {
          if (controller.signal.aborted) return;
          console.warn(`Failed to load ${adapter.locationLabel.toLowerCase()}s:`, locationsError);
          setLocations([]);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Failed to load static data:', err);
        onErrorRef.current?.('Unable to load schedule data. Please refresh the page.');
      } finally {
        if (!controller.signal.aborted) {
          setLoadingStaticData(false);
        }
      }
    };

    void runLoadStaticData();

    return () => {
      controller.abort();
    };
  }, [authLoading, accountId, apiClient, adapter, supportsTeamSchedule]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!supportsTeamSchedule || !adapter.loadTeamGames) {
      setGames([]);
      setLoadingGames(false);
      return;
    }

    if (filterDate === undefined) {
      return;
    }

    const controller = new AbortController();
    const requestCache = gamesRequestCacheRef.current;
    const { startDate: rangeStart, endDate: rangeEnd } = computeDateRange(filterType, filterDate);

    const runLoadGamesData = async () => {
      try {
        setLoadingGames(true);

        const monthKeys = getMonthKeysForRange(rangeStart, rangeEnd);

        if (monthKeys.length === 0) {
          setGames([]);
          return;
        }

        const fetchPromises = monthKeys.map((monthKey) => {
          if (gamesCacheRef.current.has(monthKey)) {
            return Promise.resolve(gamesCacheRef.current.get(monthKey)!);
          }

          let requestPromise = gamesRequestCacheRef.current.get(monthKey);
          if (!requestPromise) {
            const { start, end } = getMonthRangeForKey(monthKey);

            requestPromise = (async () => {
              const loadedGames = await adapter.loadTeamGames!({
                accountId,
                seasonId,
                teamSeasonId,
                startDate: start,
                endDate: end,
                apiClient,
                signal: controller.signal,
              });

              gamesCacheRef.current.set(monthKey, loadedGames);
              return loadedGames;
            })();

            gamesRequestCacheRef.current.set(monthKey, requestPromise);
            void requestPromise
              .finally(() => {
                gamesRequestCacheRef.current.delete(monthKey);
              })
              .catch(() => {});
          }

          return requestPromise;
        });

        await Promise.all(fetchPromises);

        if (controller.signal.aborted) return;

        const nextGames = collectGamesForRange(gamesCacheRef, rangeStart, rangeEnd);
        setGames(nextGames);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Failed to load team games:', err);
        onErrorRef.current?.('Unable to load games. Please refresh the page.');
      } finally {
        if (!controller.signal.aborted) {
          setLoadingGames(false);
        }
      }
    };

    void runLoadGamesData();

    return () => {
      controller.abort();
      requestCache.clear();
    };
  }, [
    authLoading,
    accountId,
    seasonId,
    teamSeasonId,
    apiClient,
    adapter,
    filterType,
    filterDate,
    supportsTeamSchedule,
  ]);

  return {
    games,
    locations,
    officials,
    loadingGames,
    loadingStaticData,
    loadingDateRange,
    earliestGameDate,
    latestGameDate,
    startDate,
    endDate,
    locationLabel: adapter.locationLabel,
    hasOfficials: adapter.hasOfficials,
    officialLabel: adapter.officialLabel ?? 'Official',
    GameDialog: adapter.GameDialog,
    ScoreEntryDialog: adapter.ScoreEntryDialog,
    supportsTeamSchedule,
  };
};
