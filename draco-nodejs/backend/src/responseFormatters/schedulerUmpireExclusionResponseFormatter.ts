import type { SchedulerUmpireExclusion, SchedulerUmpireExclusions } from '@draco/shared-schemas';
import type { schedulerumpireexclusions } from '#prisma/client';
import { DateUtils } from '../utils/dateUtils.js';

export class SchedulerUmpireExclusionResponseFormatter {
  static formatExclusion(record: schedulerumpireexclusions): SchedulerUmpireExclusion {
    const startTime = DateUtils.formatDateTimeForResponse(record.starttime);
    const endTime = DateUtils.formatDateTimeForResponse(record.endtime);
    if (!startTime || !endTime) {
      throw new Error('Invalid scheduler umpire exclusion window');
    }

    return {
      id: record.id.toString(),
      seasonId: record.seasonid.toString(),
      umpireId: record.umpireid.toString(),
      startTime,
      endTime,
      note: record.note ?? undefined,
      enabled: record.enabled,
    };
  }

  static formatExclusions(records: schedulerumpireexclusions[]): SchedulerUmpireExclusions {
    return { exclusions: records.map((record) => this.formatExclusion(record)) };
  }
}
