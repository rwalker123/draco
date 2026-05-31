import type {
  FieldClosedDateType,
  FieldOpenHourType,
  FieldScheduleConfigType,
  FieldScheduleConfigUpsertType,
} from '@draco/shared-schemas';
import { DAYS } from '../../utils/daysOfWeekUtils';
import { formatLocalHhmmTo12Hour } from '../../utils/schedulerTimeFormat';

export type DraftDayMap = Map<number, { open: boolean; start: string; end: string }>;

export interface DraftClosedDate {
  key: string;
  date: string;
  endDate: string;
  note: string;
}

export const DEFAULT_OPEN_START = '09:00';
export const DEFAULT_OPEN_END = '21:00';

export const buildDraftDays = (openHours: FieldOpenHourType[]): DraftDayMap => {
  const map: DraftDayMap = new Map();
  for (const day of DAYS) {
    map.set(day.bit, { open: false, start: DEFAULT_OPEN_START, end: DEFAULT_OPEN_END });
  }
  for (const hour of openHours) {
    map.set(hour.dayOfWeek, { open: true, start: hour.startTimeLocal, end: hour.endTimeLocal });
  }
  return map;
};

export const buildDraftClosedDates = (closedDates: FieldClosedDateType[]): DraftClosedDate[] =>
  closedDates.map((cd, i) => ({
    key: `${cd.id}-${i}`,
    date: cd.date,
    endDate: cd.endDate ?? '',
    note: cd.note ?? '',
  }));

export const buildOpenHoursPayload = (
  draftDays: DraftDayMap,
): FieldScheduleConfigUpsertType['openHours'] => {
  const result: FieldScheduleConfigUpsertType['openHours'] = [];
  for (const day of DAYS) {
    const entry = draftDays.get(day.bit);
    if (entry?.open) {
      result.push({
        dayOfWeek: day.bit,
        startTimeLocal: entry.start,
        endTimeLocal: entry.end,
      });
    }
  }
  return result;
};

export const buildClosedDatesPayload = (
  draftClosedDates: DraftClosedDate[],
): FieldScheduleConfigUpsertType['closedDates'] =>
  draftClosedDates
    .filter((cd) => cd.date.trim().length > 0)
    .map((cd) => {
      const start = cd.date.trim();
      const entry: FieldScheduleConfigUpsertType['closedDates'][number] = { date: start };
      const end = cd.endDate.trim();
      if (end.length > 0 && end !== start) {
        entry.endDate = end;
      }
      if (cd.note.trim().length > 0) {
        entry.note = cd.note.trim();
      }
      return entry;
    });

export const applyQuickSetToDays = (
  current: DraftDayMap,
  bitsToOpen: number[],
  startTime: string,
  endTime: string,
): DraftDayMap => {
  const next = new Map(current);
  const openSet = new Set(bitsToOpen);
  for (const day of DAYS) {
    const existing = next.get(day.bit) ?? { open: false, start: startTime, end: endTime };
    if (openSet.has(day.bit)) {
      next.set(day.bit, { open: true, start: startTime, end: endTime });
    } else {
      next.set(day.bit, { ...existing, open: false });
    }
  }
  return next;
};

const buildSegmentLabel = (start: FieldOpenHourType, end: FieldOpenHourType): string => {
  const startDayLabel = DAYS.find((d) => d.bit === start.dayOfWeek)?.label ?? '';
  const endDayLabel = DAYS.find((d) => d.bit === end.dayOfWeek)?.label ?? '';
  const dayRange =
    start.dayOfWeek === end.dayOfWeek ? startDayLabel : `${startDayLabel}–${endDayLabel}`;
  const timeRange = `${formatLocalHhmmTo12Hour(start.startTimeLocal)}–${formatLocalHhmmTo12Hour(
    start.endTimeLocal,
  )}`;
  return `${dayRange} ${timeRange}`;
};

export const groupOpenHoursLabel = (openHours: FieldOpenHourType[]): string => {
  if (openHours.length === 0) return '';
  const sorted = [...openHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const segments: string[] = [];
  let groupStart = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const sameTime =
      cur.startTimeLocal === prev.startTimeLocal && cur.endTimeLocal === prev.endTimeLocal;
    const consecutive = cur.dayOfWeek === prev.dayOfWeek + 1;
    if (sameTime && consecutive) {
      prev = cur;
    } else {
      segments.push(buildSegmentLabel(groupStart, prev));
      groupStart = cur;
      prev = cur;
    }
  }
  segments.push(buildSegmentLabel(groupStart, prev));
  return segments.join(' · ');
};

export const formatMinutesAsHoursMinutes = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
};

export const formatClosedDateLabel = (closedDate: {
  date: string;
  endDate?: string | null;
}): string =>
  closedDate.endDate && closedDate.endDate !== closedDate.date
    ? `${closedDate.date} – ${closedDate.endDate}`
    : closedDate.date;

export const hhmmToDate = (hhmm: string): Date | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!match) return null;
  return new Date(2000, 0, 1, Number(match[1]), Number(match[2]), 0, 0);
};

export const dateToHhmm = (date: Date | null): string => {
  if (!date || Number.isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const isoDateToDate = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

export const dateToIsoDate = (date: Date | null): string => {
  if (!date || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const configToUpsert = (config: FieldScheduleConfigType): FieldScheduleConfigUpsertType => ({
  scheduleEnabled: config.scheduleEnabled,
  gameLengthMinutes: config.gameLengthMinutes ?? null,
  bufferMinutes: config.bufferMinutes,
  openHours: config.openHours.map((h) => ({
    dayOfWeek: h.dayOfWeek,
    startTimeLocal: h.startTimeLocal,
    endTimeLocal: h.endTimeLocal,
  })),
  closedDates: config.closedDates.map((cd) => ({
    date: cd.date,
    note: cd.note ?? undefined,
  })),
});
