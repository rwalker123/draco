import type { FieldScheduleConfigType } from '@draco/shared-schemas';
import type { availablefields, fieldopenhours, fieldcloseddates } from '#prisma/client';
import { DateUtils } from '../utils/dateUtils.js';

export class FieldScheduleConfigResponseFormatter {
  static format(
    field: availablefields,
    openHours: fieldopenhours[],
    closedDates: fieldcloseddates[],
  ): FieldScheduleConfigType {
    return {
      fieldId: field.id.toString(),
      scheduleEnabled: field.scheduleenabled,
      gameLengthMinutes: field.gamelengthminutes ?? null,
      bufferMinutes: field.bufferminutes,
      openHours: [...openHours]
        .sort((a, b) => a.dayofweek - b.dayofweek)
        .map((r) => ({
          id: r.id.toString(),
          dayOfWeek: r.dayofweek,
          startTimeLocal: r.starttimelocal,
          endTimeLocal: r.endtimelocal,
        })),
      closedDates: [...closedDates]
        .sort((a, b) => a.closeddate.getTime() - b.closeddate.getTime())
        .map((r) => ({
          id: r.id.toString(),
          date: DateUtils.formatDateForResponse(r.closeddate)!,
          note: r.note ?? undefined,
        })),
    };
  }
}
