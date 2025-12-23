import type {
  SchedulerFieldAvailabilityRule,
  SchedulerFieldAvailabilityRuleUpsert,
  SchedulerFieldAvailabilityRules,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { ISchedulerFieldAvailabilityRulesRepository } from '../repositories/interfaces/ISchedulerFieldAvailabilityRulesRepository.js';
import { SchedulerFieldAvailabilityRuleResponseFormatter } from '../responseFormatters/schedulerFieldAvailabilityRuleResponseFormatter.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { DateUtils } from '../utils/dateUtils.js';
import { SchedulerValidationUtils } from '../utils/schedulerValidationUtils.js';

export class SchedulerFieldAvailabilityRulesService {
  private readonly rulesRepository: ISchedulerFieldAvailabilityRulesRepository;
  private readonly seasonsRepository = RepositoryFactory.getSeasonsRepository();
  private readonly fieldRepository = RepositoryFactory.getFieldRepository();

  constructor() {
    this.rulesRepository = RepositoryFactory.getSchedulerFieldAvailabilityRulesRepository();
  }

  async listRules(accountId: bigint, seasonId: bigint): Promise<SchedulerFieldAvailabilityRules> {
    await this.ensureSeasonInAccount(accountId, seasonId);
    const rules = await this.rulesRepository.listForSeason(accountId, seasonId);
    return SchedulerFieldAvailabilityRuleResponseFormatter.formatRules(rules);
  }

  async createRule(
    accountId: bigint,
    seasonId: bigint,
    payload: SchedulerFieldAvailabilityRuleUpsert,
  ): Promise<SchedulerFieldAvailabilityRule> {
    await this.ensureSeasonInAccount(accountId, seasonId);
    await this.ensureFieldInAccount(accountId, payload.fieldId);

    const startDate = this.parseOptionalDate(payload.startDate, 'startDate');
    const endDate = this.parseOptionalDate(payload.endDate, 'endDate');
    if (startDate && endDate && startDate > endDate) {
      throw new ValidationError('startDate must be on or before endDate');
    }

    this.validateLocalTime(payload.startTimeLocal, 'startTimeLocal');
    this.validateLocalTime(payload.endTimeLocal, 'endTimeLocal');
    if (payload.startTimeLocal >= payload.endTimeLocal) {
      throw new ValidationError('startTimeLocal must be before endTimeLocal');
    }

    const created = await this.rulesRepository.create({
      accountid: accountId,
      seasonid: seasonId,
      fieldid: BigInt(payload.fieldId),
      startdate: startDate ?? null,
      enddate: endDate ?? null,
      daysofweekmask: payload.daysOfWeekMask,
      starttimelocal: payload.startTimeLocal,
      endtimelocal: payload.endTimeLocal,
      enabled: payload.enabled,
    });

    return SchedulerFieldAvailabilityRuleResponseFormatter.formatRule(created);
  }

  async updateRule(
    accountId: bigint,
    seasonId: bigint,
    ruleId: bigint,
    payload: SchedulerFieldAvailabilityRuleUpsert,
  ): Promise<SchedulerFieldAvailabilityRule> {
    await this.ensureSeasonInAccount(accountId, seasonId);
    const existing = await this.rulesRepository.findForAccount(ruleId, accountId);
    if (!existing || existing.seasonid !== seasonId) {
      throw new NotFoundError('Field availability rule not found');
    }

    await this.ensureFieldInAccount(accountId, payload.fieldId);

    const startDate = this.parseOptionalDate(payload.startDate, 'startDate');
    const endDate = this.parseOptionalDate(payload.endDate, 'endDate');
    if (startDate && endDate && startDate > endDate) {
      throw new ValidationError('startDate must be on or before endDate');
    }

    this.validateLocalTime(payload.startTimeLocal, 'startTimeLocal');
    this.validateLocalTime(payload.endTimeLocal, 'endTimeLocal');
    if (payload.startTimeLocal >= payload.endTimeLocal) {
      throw new ValidationError('startTimeLocal must be before endTimeLocal');
    }

    const updated = await this.rulesRepository.update(ruleId, {
      fieldid: BigInt(payload.fieldId),
      startdate: startDate ?? null,
      enddate: endDate ?? null,
      daysofweekmask: payload.daysOfWeekMask,
      starttimelocal: payload.startTimeLocal,
      endtimelocal: payload.endTimeLocal,
      enabled: payload.enabled,
    });

    return SchedulerFieldAvailabilityRuleResponseFormatter.formatRule(updated);
  }

  async deleteRule(
    accountId: bigint,
    seasonId: bigint,
    ruleId: bigint,
  ): Promise<SchedulerFieldAvailabilityRule> {
    await this.ensureSeasonInAccount(accountId, seasonId);
    const existing = await this.rulesRepository.findForAccount(ruleId, accountId);
    if (!existing || existing.seasonid !== seasonId) {
      throw new NotFoundError('Field availability rule not found');
    }

    const deleted = await this.rulesRepository.delete(ruleId);
    return SchedulerFieldAvailabilityRuleResponseFormatter.formatRule(deleted);
  }

  private async ensureSeasonInAccount(accountId: bigint, seasonId: bigint): Promise<void> {
    await SchedulerValidationUtils.ensureSeasonInAccount(
      this.seasonsRepository,
      accountId,
      seasonId,
    );
  }

  private async ensureFieldInAccount(accountId: bigint, fieldId: string): Promise<void> {
    const parsedFieldId = SchedulerValidationUtils.parseBigInt(fieldId, 'fieldId');
    const field = await this.fieldRepository.findAccountField(accountId, parsedFieldId);
    if (!field) {
      throw new NotFoundError('Field not found');
    }
  }

  private requireDate(value: string, label: string): Date {
    const parsed = DateUtils.parseDateForDatabase(value);
    if (!parsed) {
      throw new ValidationError(`Invalid ${label}`);
    }
    return parsed;
  }

  private parseOptionalDate(value: string | undefined, label: string): Date | null {
    if (!value) {
      return null;
    }
    const parsed = DateUtils.parseDateForDatabase(value);
    if (!parsed) {
      throw new ValidationError(`Invalid ${label}`);
    }
    return parsed;
  }

  private validateLocalTime(value: string, label: string): void {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      throw new ValidationError(`Invalid ${label}`);
    }
  }
}
