import type { SchedulerSeasonExclusion, SchedulerSeasonExclusions } from '@draco/shared-schemas';
import type { schedulerseasonexclusions } from '#prisma/client';
import { DateUtils } from '../utils/dateUtils.js';

export class SchedulerSeasonExclusionResponseFormatter {
  static formatExclusion(record: schedulerseasonexclusions): SchedulerSeasonExclusion {
    const startTime = DateUtils.formatDateTimeForResponse(record.starttime);
    const endTime = DateUtils.formatDateTimeForResponse(record.endtime);
    if (!startTime || !endTime) {
      throw new Error('Invalid scheduler season exclusion window');
    }

    return {
      id: record.id.toString(),
      seasonId: record.seasonid.toString(),
      startTime,
      endTime,
      note: record.note ?? undefined,
      enabled: record.enabled,
    };
  }

  static formatExclusions(records: schedulerseasonexclusions[]): SchedulerSeasonExclusions {
    return { exclusions: records.map((record) => this.formatExclusion(record)) };
  }
}
