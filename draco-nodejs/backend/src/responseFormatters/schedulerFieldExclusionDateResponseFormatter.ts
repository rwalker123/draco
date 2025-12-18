import type {
  SchedulerFieldExclusionDate,
  SchedulerFieldExclusionDates,
} from '@draco/shared-schemas';
import type { schedulerfieldexclusiondates } from '#prisma/client';
import { DateUtils } from '../utils/dateUtils.js';

export class SchedulerFieldExclusionDateResponseFormatter {
  static formatExclusion(record: schedulerfieldexclusiondates): SchedulerFieldExclusionDate {
    const date = DateUtils.formatDateForResponse(record.exclusiondate);
    if (!date) {
      throw new Error('Invalid scheduler field exclusion date');
    }

    return {
      id: record.id.toString(),
      seasonId: record.seasonid.toString(),
      fieldId: record.fieldid.toString(),
      date,
      note: record.note ?? undefined,
      enabled: record.enabled,
    };
  }

  static formatExclusions(records: schedulerfieldexclusiondates[]): SchedulerFieldExclusionDates {
    return {
      exclusions: records.map((record) => this.formatExclusion(record)),
    };
  }
}
