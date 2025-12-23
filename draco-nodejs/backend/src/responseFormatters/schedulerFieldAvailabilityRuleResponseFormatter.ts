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

    return {
      id: record.id.toString(),
      seasonId: record.seasonid.toString(),
      fieldId: record.fieldid.toString(),
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
      daysOfWeekMask: record.daysofweekmask,
      startTimeLocal: record.starttimelocal,
      endTimeLocal: record.endtimelocal,
      enabled: record.enabled,
    };
  }

  static formatRules(records: schedulerfieldavailabilityrules[]): SchedulerFieldAvailabilityRules {
    return {
      rules: records.map((record) => this.formatRule(record)),
    };
  }
}
