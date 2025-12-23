import type {
  SchedulerSeasonExclusion,
  SchedulerSeasonExclusionUpsert,
  SchedulerSeasonExclusions,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { ISchedulerSeasonExclusionsRepository } from '../repositories/interfaces/ISchedulerSeasonExclusionsRepository.js';
import { SchedulerSeasonExclusionResponseFormatter } from '../responseFormatters/schedulerSeasonExclusionResponseFormatter.js';
import { NotFoundError } from '../utils/customErrors.js';
import { SchedulerValidationUtils } from '../utils/schedulerValidationUtils.js';

export class SchedulerSeasonExclusionsService {
  private readonly exclusionsRepository: ISchedulerSeasonExclusionsRepository;
  private readonly seasonsRepository = RepositoryFactory.getSeasonsRepository();

  constructor() {
    this.exclusionsRepository = RepositoryFactory.getSchedulerSeasonExclusionsRepository();
  }

  async listExclusions(accountId: bigint, seasonId: bigint): Promise<SchedulerSeasonExclusions> {
    await SchedulerValidationUtils.ensureSeasonInAccount(
      this.seasonsRepository,
      accountId,
      seasonId,
    );
    const exclusions = await this.exclusionsRepository.listForSeason(accountId, seasonId);
    return SchedulerSeasonExclusionResponseFormatter.formatExclusions(exclusions);
  }

  async createExclusion(
    accountId: bigint,
    seasonId: bigint,
    payload: SchedulerSeasonExclusionUpsert,
  ): Promise<SchedulerSeasonExclusion> {
    await SchedulerValidationUtils.ensureSeasonInAccount(
      this.seasonsRepository,
      accountId,
      seasonId,
    );

    const { startTime, endTime } = SchedulerValidationUtils.requireRange(
      payload.startTime,
      payload.endTime,
    );
    const created = await this.exclusionsRepository.create({
      accountid: accountId,
      seasonid: seasonId,
      starttime: startTime,
      endtime: endTime,
      note: payload.note ?? null,
      enabled: payload.enabled,
    });

    return SchedulerSeasonExclusionResponseFormatter.formatExclusion(created);
  }

  async updateExclusion(
    accountId: bigint,
    seasonId: bigint,
    exclusionId: bigint,
    payload: SchedulerSeasonExclusionUpsert,
  ): Promise<SchedulerSeasonExclusion> {
    await SchedulerValidationUtils.ensureSeasonInAccount(
      this.seasonsRepository,
      accountId,
      seasonId,
    );

    const existing = await this.exclusionsRepository.findForAccount(exclusionId, accountId);
    if (!existing || existing.seasonid !== seasonId) {
      throw new NotFoundError('Season exclusion not found');
    }

    const { startTime, endTime } = SchedulerValidationUtils.requireRange(
      payload.startTime,
      payload.endTime,
    );
    const updated = await this.exclusionsRepository.update(exclusionId, {
      starttime: startTime,
      endtime: endTime,
      note: payload.note ?? null,
      enabled: payload.enabled,
    });

    return SchedulerSeasonExclusionResponseFormatter.formatExclusion(updated);
  }

  async deleteExclusion(
    accountId: bigint,
    seasonId: bigint,
    exclusionId: bigint,
  ): Promise<SchedulerSeasonExclusion> {
    await SchedulerValidationUtils.ensureSeasonInAccount(
      this.seasonsRepository,
      accountId,
      seasonId,
    );

    const existing = await this.exclusionsRepository.findForAccount(exclusionId, accountId);
    if (!existing || existing.seasonid !== seasonId) {
      throw new NotFoundError('Season exclusion not found');
    }

    const deleted = await this.exclusionsRepository.delete(exclusionId);
    return SchedulerSeasonExclusionResponseFormatter.formatExclusion(deleted);
  }
}
