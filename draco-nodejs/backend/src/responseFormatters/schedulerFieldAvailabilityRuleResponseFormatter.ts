import type {
  SchedulerFieldAvailabilityRule,
  SchedulerFieldAvailabilityRules,
} from '@draco/shared-schemas';
import type { schedulerfieldavailabilityrules } from '#prisma/client';
import { DateUtils } from '../utils/dateUtils.js';

export class SchedulerFieldAvailabilityRuleResponseFormatter {
  static formatRule(record: schedulerfieldavailabilityrules): SchedulerFieldAvailabilityRule {
    const startDate = DateUtils.formatDateForResponse(record.startdate);
    const endDate = DateUtils.formatDateForResponse(record.enddate);

    if (!startDate || !endDate) {
      throw new Error('Invalid scheduler field availability rule dates');
    }

    return {
      id: record.id.toString(),
      seasonId: record.seasonid.toString(),
      fieldId: record.fieldid.toString(),
      startDate,
      endDate,
      daysOfWeekMask: record.daysofweekmask,
      startTimeLocal: record.starttimelocal,
      endTimeLocal: record.endtimelocal,
      startIncrementMinutes: record.startincrementminutes,
      enabled: record.enabled,
    };
  }

  static formatRules(records: schedulerfieldavailabilityrules[]): SchedulerFieldAvailabilityRules {
    return {
      rules: records.map((record) => this.formatRule(record)),
    };
  }
}
