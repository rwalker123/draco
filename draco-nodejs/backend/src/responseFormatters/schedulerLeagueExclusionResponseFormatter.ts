import type { SchedulerLeagueExclusion, SchedulerLeagueExclusions } from '@draco/shared-schemas';
import type { schedulerleagueseasonexclusions } from '#prisma/client';
import { DateUtils } from '../utils/dateUtils.js';

export class SchedulerLeagueExclusionResponseFormatter {
  static formatExclusion(record: schedulerleagueseasonexclusions): SchedulerLeagueExclusion {
    const startTime = DateUtils.formatDateTimeForResponse(record.starttime);
    const endTime = DateUtils.formatDateTimeForResponse(record.endtime);
    if (!startTime || !endTime) {
      throw new Error('Invalid scheduler league exclusion window');
    }

    return {
      id: record.id.toString(),
      seasonId: record.seasonid.toString(),
      leagueSeasonId: record.leagueseasonid.toString(),
      startTime,
      endTime,
      note: record.note ?? undefined,
      enabled: record.enabled,
    };
  }

  static formatExclusions(records: schedulerleagueseasonexclusions[]): SchedulerLeagueExclusions {
    return { exclusions: records.map((record) => this.formatExclusion(record)) };
  }
}
