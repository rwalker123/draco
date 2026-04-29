import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useApiClient } from '../../../hooks/useApiClient';
import { getSportAdapter } from '../adapters';
import { Game } from '@/types/schedule';
import { buildScheduleSummary } from '../utils/buildScheduleSummary';

export type StartTimeBucket = 'morning' | 'afternoon' | 'earlyEvening' | 'lateEvening' | 'night';

export interface FieldSummary {
  fieldId: string | null;
  fieldName: string;
  upcoming: number;
  played: number;
  notPlayed: number;
}

export interface DayTypeCounts {
  played: number;
  scheduled: number;
}

export interface StartTimeSummary {
  bucket: StartTimeBucket;
  played: number;
  scheduled: number;
}

export interface SeasonSummary {
  totalGames: number;
  totalPlayed: number;
  totalScheduled: number;
  byField: FieldSummary[];
  byDayType: { weekday: DayTypeCounts; weekend: DayTypeCounts };
  byStartTime: StartTimeSummary[];
  homeAway?: { home: number; away: number; played: { home: number; away: number } };
}

interface UseTeamSeasonSummaryProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
  accountType?: string;
  earliestGameDate: Date | null;
  latestGameDate: Date | null;
  timeZone: string;
  onError?: (message: string) => void;
}

interface UseTeamSeasonSummaryReturn {
  summary: SeasonSummary | null;
  loading: boolean;
  games: Game[];
}

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const useTeamSeasonSummary = ({
  accountId,
  seasonId,
  teamSeasonId,
  accountType,
  earliestGameDate,
  latestGameDate,
  timeZone,
  onError,
}: UseTeamSeasonSummaryProps): UseTeamSeasonSummaryReturn => {
  const { loading: authLoading } = useAuth();
  const apiClient = useApiClient();
  const adapter = getSportAdapter(accountType);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const [summary, setSummary] = useState<SeasonSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<Game[]>([]);

  const earliestTime = earliestGameDate ? earliestGameDate.getTime() : null;
  const latestTime = latestGameDate ? latestGameDate.getTime() : null;

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (typeof adapter.loadTeamGames !== 'function') {
      setGames([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    if (earliestTime === null || latestTime === null) {
      setGames([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const rangeStart = addDays(new Date(earliestTime), -1);
    const rangeEnd = addDays(new Date(latestTime), 1);

    const runLoadSummary = async () => {
      try {
        setLoading(true);
        const loadedGames: Game[] = await adapter.loadTeamGames!({
          accountId,
          seasonId,
          teamSeasonId,
          startDate: rangeStart,
          endDate: rangeEnd,
          apiClient,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setGames(loadedGames);
        setSummary(buildScheduleSummary(loadedGames, { timeZone, teamSeasonId }));
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Failed to load team season summary:', err);
        setGames([]);
        setSummary(null);
        onErrorRef.current?.('Unable to load season summary.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void runLoadSummary();

    return () => {
      controller.abort();
    };
  }, [
    authLoading,
    accountId,
    seasonId,
    teamSeasonId,
    apiClient,
    adapter,
    earliestTime,
    latestTime,
    timeZone,
  ]);

  return { summary, loading, games };
};
