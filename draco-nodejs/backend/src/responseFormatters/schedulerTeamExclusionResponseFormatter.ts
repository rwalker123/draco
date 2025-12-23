import type { SchedulerTeamExclusion, SchedulerTeamExclusions } from '@draco/shared-schemas';
import type { schedulerteamseasonexclusions } from '#prisma/client';
import { DateUtils } from '../utils/dateUtils.js';

export class SchedulerTeamExclusionResponseFormatter {
  static formatExclusion(record: schedulerteamseasonexclusions): SchedulerTeamExclusion {
    const startTime = DateUtils.formatDateTimeForResponse(record.starttime);
    const endTime = DateUtils.formatDateTimeForResponse(record.endtime);
    if (!startTime || !endTime) {
      throw new Error('Invalid scheduler team exclusion window');
    }

    return {
      id: record.id.toString(),
      seasonId: record.seasonid.toString(),
      teamSeasonId: record.teamseasonid.toString(),
      startTime,
      endTime,
      note: record.note ?? undefined,
      enabled: record.enabled,
    };
  }

  static formatExclusions(records: schedulerteamseasonexclusions[]): SchedulerTeamExclusions {
    return { exclusions: records.map((record) => this.formatExclusion(record)) };
  }
}
