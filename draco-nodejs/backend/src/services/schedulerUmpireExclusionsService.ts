import type {
  SchedulerUmpireExclusion,
  SchedulerUmpireExclusionUpsert,
  SchedulerUmpireExclusions,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { ISchedulerUmpireExclusionsRepository } from '../repositories/interfaces/ISchedulerUmpireExclusionsRepository.js';
import { SchedulerUmpireExclusionResponseFormatter } from '../responseFormatters/schedulerUmpireExclusionResponseFormatter.js';
import { NotFoundError } from '../utils/customErrors.js';
import { SchedulerValidationUtils } from '../utils/schedulerValidationUtils.js';

export class SchedulerUmpireExclusionsService {
  private readonly exclusionsRepository: ISchedulerUmpireExclusionsRepository;
  private readonly seasonsRepository = RepositoryFactory.getSeasonsRepository();
  private readonly umpireRepository = RepositoryFactory.getUmpireRepository();

  constructor() {
    this.exclusionsRepository = RepositoryFactory.getSchedulerUmpireExclusionsRepository();
  }

  async listExclusions(accountId: bigint, seasonId: bigint): Promise<SchedulerUmpireExclusions> {
    await SchedulerValidationUtils.ensureSeasonInAccount(
      this.seasonsRepository,
      accountId,
      seasonId,
    );
    const exclusions = await this.exclusionsRepository.listForSeason(accountId, seasonId);
    return SchedulerUmpireExclusionResponseFormatter.formatExclusions(exclusions);
  }

  async createExclusion(
    accountId: bigint,
    seasonId: bigint,
    payload: SchedulerUmpireExclusionUpsert,
  ): Promise<SchedulerUmpireExclusion> {
    await SchedulerValidationUtils.ensureSeasonInAccount(
      this.seasonsRepository,
      accountId,
      seasonId,
    );
    await this.ensureUmpireInAccount(accountId, payload.umpireId);

    const umpireId = SchedulerValidationUtils.parseBigInt(payload.umpireId, 'umpireId');
    const { startTime, endTime } = SchedulerValidationUtils.requireRange(
      payload.startTime,
      payload.endTime,
    );

    const created = await this.exclusionsRepository.create({
      accountid: accountId,
      seasonid: seasonId,
      umpireid: umpireId,
      starttime: startTime,
      endtime: endTime,
      note: payload.note ?? null,
      enabled: payload.enabled,
    });

    return SchedulerUmpireExclusionResponseFormatter.formatExclusion(created);
  }

  async updateExclusion(
    accountId: bigint,
    seasonId: bigint,
    exclusionId: bigint,
    payload: SchedulerUmpireExclusionUpsert,
  ): Promise<SchedulerUmpireExclusion> {
    await SchedulerValidationUtils.ensureSeasonInAccount(
      this.seasonsRepository,
      accountId,
      seasonId,
    );

    const existing = await this.exclusionsRepository.findForAccount(exclusionId, accountId);
    if (!existing || existing.seasonid !== seasonId) {
      throw new NotFoundError('Umpire exclusion not found');
    }

    await this.ensureUmpireInAccount(accountId, payload.umpireId);
    const umpireId = SchedulerValidationUtils.parseBigInt(payload.umpireId, 'umpireId');
    const { startTime, endTime } = SchedulerValidationUtils.requireRange(
      payload.startTime,
      payload.endTime,
    );

    const updated = await this.exclusionsRepository.update(exclusionId, {
      umpireid: umpireId,
      starttime: startTime,
      endtime: endTime,
      note: payload.note ?? null,
      enabled: payload.enabled,
    });

    return SchedulerUmpireExclusionResponseFormatter.formatExclusion(updated);
  }

  async deleteExclusion(
    accountId: bigint,
    seasonId: bigint,
    exclusionId: bigint,
  ): Promise<SchedulerUmpireExclusion> {
    await SchedulerValidationUtils.ensureSeasonInAccount(
      this.seasonsRepository,
      accountId,
      seasonId,
    );

    const existing = await this.exclusionsRepository.findForAccount(exclusionId, accountId);
    if (!existing || existing.seasonid !== seasonId) {
      throw new NotFoundError('Umpire exclusion not found');
    }

    const deleted = await this.exclusionsRepository.delete(exclusionId);
    return SchedulerUmpireExclusionResponseFormatter.formatExclusion(deleted);
  }

  private async ensureUmpireInAccount(accountId: bigint, umpireId: string): Promise<void> {
    const parsed = SchedulerValidationUtils.parseBigInt(umpireId, 'umpireId');
    const umpire = await this.umpireRepository.findById(parsed);
    if (!umpire || umpire.accountid !== accountId) {
      throw new NotFoundError('Umpire not found');
    }
  }
}
