import type { SchedulerSeasonWindowConfig } from '@draco/shared-schemas';
import type { schedulerseasonconfig } from '#prisma/client';
import { DateUtils } from '../utils/dateUtils.js';

export class SchedulerSeasonWindowConfigResponseFormatter {
  static formatConfig(
    record: schedulerseasonconfig,
    leagueSeasonIds?: string[],
  ): SchedulerSeasonWindowConfig {
    const startDate = DateUtils.formatDateForResponse(record.startdate);
    const endDate = DateUtils.formatDateForResponse(record.enddate);
    if (!startDate || !endDate) {
      throw new Error('Invalid scheduler season window config');
    }

    return {
      seasonId: record.seasonid.toString(),
      startDate,
      endDate,
      leagueSeasonIds: leagueSeasonIds && leagueSeasonIds.length > 0 ? leagueSeasonIds : undefined,
      umpiresPerGame: record.umpirespergame,
      maxGamesPerUmpirePerDay:
        record.maxgamesperumpireperday === null ? null : record.maxgamesperumpireperday,
    };
  }
}
