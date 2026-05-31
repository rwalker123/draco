import type { availablefields, fieldopenhours, fieldcloseddates } from '#prisma/client';

export interface IFieldScheduleConfigRepository {
  findFieldInAccount(accountId: bigint, fieldId: bigint): Promise<availablefields | null>;
  getConfigForField(
    fieldId: bigint,
  ): Promise<{ openHours: fieldopenhours[]; closedDates: fieldcloseddates[] }>;
  getConfigsForAccount(
    accountId: bigint,
  ): Promise<
    { field: availablefields; openHours: fieldopenhours[]; closedDates: fieldcloseddates[] }[]
  >;
  replaceConfigForField(
    fieldId: bigint,
    input: {
      scheduleEnabled: boolean;
      gameLengthMinutes: number | null;
      bufferMinutes: number;
      openHours: { dayOfWeek: number; startTimeLocal: string; endTimeLocal: string }[];
      closedDates: { date: string; endDate: string | null; note: string | null }[];
    },
  ): Promise<void>;
  listOpenHoursForAccount(accountId: bigint): Promise<fieldopenhours[]>;
  listClosedDatesForAccount(accountId: bigint): Promise<fieldcloseddates[]>;
}
