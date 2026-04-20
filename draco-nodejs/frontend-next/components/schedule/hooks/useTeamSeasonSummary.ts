import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useApiClient } from '../../../hooks/useApiClient';
import { getSportAdapter } from '../adapters';
import { Game, GameStatus } from '@/types/schedule';
import { convertUTCToZonedDate } from '../../../utils/dateUtils';

export type StartTimeBucket = 'morning' | 'afternoon' | 'earlyEvening' | 'lateEvening' | 'night';

export interface FieldSummary {
  fieldId: string | null;
  fieldName: string;
  played: number;
  scheduled: number;
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
}

const NO_FIELD_KEY = '__no_field__';
const NO_FIELD_LABEL = 'No Field / TBD';

const isPlayedStatus = (status: number): boolean => {
  return (
    status === GameStatus.Completed ||
    status === GameStatus.Forfeit ||
    status === GameStatus.DidNotReport
  );
};

const isExcludedStatus = (status: number): boolean => {
  return status === GameStatus.Rainout || status === GameStatus.Postponed;
};

const bucketForHour = (hour: number): StartTimeBucket => {
  if (hour < 12) return 'morning';
  if (hour < 16) return 'afternoon';
  if (hour < 19) return 'earlyEvening';
  if (hour < 22) return 'lateEvening';
  return 'night';
};

const BUCKET_ORDER: StartTimeBucket[] = [
  'morning',
  'afternoon',
  'earlyEvening',
  'lateEvening',
  'night',
];

const buildSummary = (games: Game[], timeZone: string): SeasonSummary => {
  const fieldMap = new Map<string, FieldSummary>();
  const dayType = {
    weekday: { played: 0, scheduled: 0 } as DayTypeCounts,
    weekend: { played: 0, scheduled: 0 } as DayTypeCounts,
  };
  const bucketMap = new Map<StartTimeBucket, StartTimeSummary>();

  let totalPlayed = 0;
  let totalScheduled = 0;

  for (const game of games) {
    if (isExcludedStatus(game.gameStatus)) {
      continue;
    }

    const played = isPlayedStatus(game.gameStatus);

    if (played) {
      totalPlayed += 1;
    } else {
      totalScheduled += 1;
    }

    const fieldKey = game.field?.id ?? game.fieldId ?? NO_FIELD_KEY;
    const fieldName =
      game.field?.name ||
      game.field?.shortName ||
      (fieldKey === NO_FIELD_KEY ? NO_FIELD_LABEL : '');

    const existingField = fieldMap.get(fieldKey);
    if (existingField) {
      if (played) {
        existingField.played += 1;
      } else {
        existingField.scheduled += 1;
      }
    } else {
      fieldMap.set(fieldKey, {
        fieldId: fieldKey === NO_FIELD_KEY ? null : fieldKey,
        fieldName: fieldName || NO_FIELD_LABEL,
        played: played ? 1 : 0,
        scheduled: played ? 0 : 1,
      });
    }

    const zoned = convertUTCToZonedDate(game.gameDate, timeZone);
    if (!zoned) {
      continue;
    }

    const day = zoned.getDay();
    const isWeekend = day === 0 || day === 6;
    const dayBucket = isWeekend ? dayType.weekend : dayType.weekday;
    if (played) {
      dayBucket.played += 1;
    } else {
      dayBucket.scheduled += 1;
    }

    const bucket = bucketForHour(zoned.getHours());
    const existingBucket = bucketMap.get(bucket);
    if (existingBucket) {
      if (played) {
        existingBucket.played += 1;
      } else {
        existingBucket.scheduled += 1;
      }
    } else {
      bucketMap.set(bucket, {
        bucket,
        played: played ? 1 : 0,
        scheduled: played ? 0 : 1,
      });
    }
  }

  const byField = Array.from(fieldMap.values()).sort((a, b) => {
    const totalDiff = b.played + b.scheduled - (a.played + a.scheduled);
    if (totalDiff !== 0) return totalDiff;
    return a.fieldName.localeCompare(b.fieldName);
  });

  const byStartTime = BUCKET_ORDER.filter((bucket) => bucketMap.has(bucket)).map(
    (bucket) => bucketMap.get(bucket)!,
  );

  return {
    totalGames: totalPlayed + totalScheduled,
    totalPlayed,
    totalScheduled,
    byField,
    byDayType: dayType,
    byStartTime,
  };
};

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

  const earliestTime = earliestGameDate ? earliestGameDate.getTime() : null;
  const latestTime = latestGameDate ? latestGameDate.getTime() : null;

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (typeof adapter.loadTeamGames !== 'function') {
      setSummary(null);
      setLoading(false);
      return;
    }

    if (earliestTime === null || latestTime === null) {
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
        const games = await adapter.loadTeamGames!({
          accountId,
          seasonId,
          teamSeasonId,
          startDate: rangeStart,
          endDate: rangeEnd,
          apiClient,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setSummary(buildSummary(games, timeZone));
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Failed to load team season summary:', err);
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

  return { summary, loading };
};
