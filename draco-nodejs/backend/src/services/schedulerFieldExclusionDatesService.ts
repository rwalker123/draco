import type {
  SchedulerFieldExclusionDate,
  SchedulerFieldExclusionDateUpsert,
  SchedulerFieldExclusionDates,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { ISchedulerFieldExclusionDatesRepository } from '../repositories/interfaces/ISchedulerFieldExclusionDatesRepository.js';
import { SchedulerFieldExclusionDateResponseFormatter } from '../responseFormatters/schedulerFieldExclusionDateResponseFormatter.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { DateUtils } from '../utils/dateUtils.js';

export class SchedulerFieldExclusionDatesService {
  private readonly exclusionsRepository: ISchedulerFieldExclusionDatesRepository;
  private readonly seasonsRepository = RepositoryFactory.getSeasonsRepository();
  private readonly fieldRepository = RepositoryFactory.getFieldRepository();

  constructor() {
    this.exclusionsRepository = RepositoryFactory.getSchedulerFieldExclusionDatesRepository();
  }

  async listExclusions(accountId: bigint, seasonId: bigint): Promise<SchedulerFieldExclusionDates> {
    await this.ensureSeasonInAccount(accountId, seasonId);
    const exclusions = await this.exclusionsRepository.listForSeason(accountId, seasonId);
    return SchedulerFieldExclusionDateResponseFormatter.formatExclusions(exclusions);
  }

  async createExclusion(
    accountId: bigint,
    seasonId: bigint,
    payload: SchedulerFieldExclusionDateUpsert,
  ): Promise<SchedulerFieldExclusionDate> {
    await this.ensureSeasonInAccount(accountId, seasonId);
    await this.ensureFieldInAccount(accountId, payload.fieldId);
    const exclusionDate = this.requireDate(payload.date, 'date');

    const created = await this.exclusionsRepository.create({
      accountid: accountId,
      seasonid: seasonId,
      fieldid: BigInt(payload.fieldId),
      exclusiondate: exclusionDate,
      note: payload.note ?? null,
      enabled: payload.enabled,
    });

    return SchedulerFieldExclusionDateResponseFormatter.formatExclusion(created);
  }

  async updateExclusion(
    accountId: bigint,
    seasonId: bigint,
    exclusionId: bigint,
    payload: SchedulerFieldExclusionDateUpsert,
  ): Promise<SchedulerFieldExclusionDate> {
    await this.ensureSeasonInAccount(accountId, seasonId);
    const existing = await this.exclusionsRepository.findForAccount(exclusionId, accountId);
    if (!existing || existing.seasonid !== seasonId) {
      throw new NotFoundError('Field exclusion date not found');
    }

    await this.ensureFieldInAccount(accountId, payload.fieldId);
    const exclusionDate = this.requireDate(payload.date, 'date');

    const updated = await this.exclusionsRepository.update(exclusionId, {
      fieldid: BigInt(payload.fieldId),
      exclusiondate: exclusionDate,
      note: payload.note ?? null,
      enabled: payload.enabled,
    });

    return SchedulerFieldExclusionDateResponseFormatter.formatExclusion(updated);
  }

  async deleteExclusion(
    accountId: bigint,
    seasonId: bigint,
    exclusionId: bigint,
  ): Promise<SchedulerFieldExclusionDate> {
    await this.ensureSeasonInAccount(accountId, seasonId);
    const existing = await this.exclusionsRepository.findForAccount(exclusionId, accountId);
    if (!existing || existing.seasonid !== seasonId) {
      throw new NotFoundError('Field exclusion date not found');
    }

    const deleted = await this.exclusionsRepository.delete(exclusionId);
    return SchedulerFieldExclusionDateResponseFormatter.formatExclusion(deleted);
  }

  private async ensureSeasonInAccount(accountId: bigint, seasonId: bigint): Promise<void> {
    const season = await this.seasonsRepository.findSeasonById(accountId, seasonId);
    if (!season) {
      throw new NotFoundError('Season not found');
    }
  }

  private async ensureFieldInAccount(accountId: bigint, fieldId: string): Promise<void> {
    const parsedFieldId = this.parseBigInt(fieldId, 'fieldId');
    const field = await this.fieldRepository.findAccountField(accountId, parsedFieldId);
    if (!field) {
      throw new NotFoundError('Field not found');
    }
  }

  private parseBigInt(value: string, label: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new ValidationError(`Invalid ${label}`);
    }
  }

  private requireDate(value: string, label: string): Date {
    const parsed = DateUtils.parseDateForDatabase(value);
    if (!parsed) {
      throw new ValidationError(`Invalid ${label}`);
    }
    return parsed;
  }
}
