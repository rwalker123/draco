import { Game, GameStatus } from '@/types/schedule';
import { convertUTCToZonedDate } from '../../../utils/dateUtils';
import type {
  SeasonSummary,
  FieldSummary,
  DayTypeCounts,
  StartTimeBucket,
  StartTimeSummary,
} from '../hooks/useTeamSeasonSummary';

export type { SeasonSummary, FieldSummary, DayTypeCounts, StartTimeBucket, StartTimeSummary };

const NO_FIELD_KEY = '__no_field__';
const NO_FIELD_LABEL = 'No Field / TBD';

const normalizeFieldId = (value?: string | null): string | undefined => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return undefined;
};

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

type FieldBucket = 'upcoming' | 'played' | 'notPlayed';

const fieldBucketForStatus = (status: number): FieldBucket => {
  if (status === GameStatus.Scheduled) return 'upcoming';
  if (
    status === GameStatus.Completed ||
    status === GameStatus.Forfeit ||
    status === GameStatus.DidNotReport
  )
    return 'played';
  return 'notPlayed';
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

export interface BuildScheduleSummaryOptions {
  timeZone: string;
  teamSeasonId?: string;
}

export const buildScheduleSummary = (
  games: Game[],
  options: BuildScheduleSummaryOptions,
): SeasonSummary => {
  const { timeZone, teamSeasonId } = options;

  const fieldMap = new Map<string, FieldSummary>();
  const dayType = {
    weekday: { played: 0, scheduled: 0 } as DayTypeCounts,
    weekend: { played: 0, scheduled: 0 } as DayTypeCounts,
  };
  const bucketMap = new Map<StartTimeBucket, StartTimeSummary>();

  let totalPlayed = 0;
  let totalScheduled = 0;

  let homeTotal = 0;
  let awayTotal = 0;
  let homePlayed = 0;
  let awayPlayed = 0;

  for (const game of games) {
    const fieldKey =
      normalizeFieldId(game.field?.id) ?? normalizeFieldId(game.fieldId) ?? NO_FIELD_KEY;
    const fieldName =
      game.field?.name ||
      game.field?.shortName ||
      (fieldKey === NO_FIELD_KEY ? NO_FIELD_LABEL : '');
    const bucket = fieldBucketForStatus(game.gameStatus);

    const existingField = fieldMap.get(fieldKey);
    if (existingField) {
      existingField[bucket] += 1;
    } else {
      fieldMap.set(fieldKey, {
        fieldId: fieldKey === NO_FIELD_KEY ? null : fieldKey,
        fieldName: fieldName || NO_FIELD_LABEL,
        upcoming: bucket === 'upcoming' ? 1 : 0,
        played: bucket === 'played' ? 1 : 0,
        notPlayed: bucket === 'notPlayed' ? 1 : 0,
      });
    }

    if (isExcludedStatus(game.gameStatus)) {
      continue;
    }

    const played = isPlayedStatus(game.gameStatus);

    if (played) {
      totalPlayed += 1;
    } else {
      totalScheduled += 1;
    }

    if (teamSeasonId) {
      if (game.homeTeamId === teamSeasonId) {
        homeTotal += 1;
        if (played) homePlayed += 1;
      } else if (game.visitorTeamId === teamSeasonId) {
        awayTotal += 1;
        if (played) awayPlayed += 1;
      }
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

    const timeBucket = bucketForHour(zoned.getHours());
    const existingBucket = bucketMap.get(timeBucket);
    if (existingBucket) {
      if (played) {
        existingBucket.played += 1;
      } else {
        existingBucket.scheduled += 1;
      }
    } else {
      bucketMap.set(timeBucket, {
        bucket: timeBucket,
        played: played ? 1 : 0,
        scheduled: played ? 0 : 1,
      });
    }
  }

  const byField = Array.from(fieldMap.values()).sort((a, b) => {
    const totalA = a.upcoming + a.played + a.notPlayed;
    const totalB = b.upcoming + b.played + b.notPlayed;
    const totalDiff = totalB - totalA;
    if (totalDiff !== 0) return totalDiff;
    return a.fieldName.localeCompare(b.fieldName);
  });

  const byStartTime = BUCKET_ORDER.filter((bucket) => bucketMap.has(bucket)).map(
    (bucket) => bucketMap.get(bucket)!,
  );

  const homeAway = teamSeasonId
    ? {
        home: homeTotal,
        away: awayTotal,
        played: { home: homePlayed, away: awayPlayed },
      }
    : undefined;

  return {
    totalGames: totalPlayed + totalScheduled,
    totalPlayed,
    totalScheduled,
    byField,
    byDayType: dayType,
    byStartTime,
    homeAway,
  };
};
