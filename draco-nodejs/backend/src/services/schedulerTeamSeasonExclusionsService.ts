import type {
  SchedulerTeamExclusion,
  SchedulerTeamExclusionUpsert,
  SchedulerTeamExclusions,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { ISchedulerTeamSeasonExclusionsRepository } from '../repositories/interfaces/ISchedulerTeamSeasonExclusionsRepository.js';
import { SchedulerTeamExclusionResponseFormatter } from '../responseFormatters/schedulerTeamExclusionResponseFormatter.js';
import { NotFoundError } from '../utils/customErrors.js';
import { SchedulerValidationUtils } from '../utils/schedulerValidationUtils.js';

export class SchedulerTeamSeasonExclusionsService {
  private readonly exclusionsRepository: ISchedulerTeamSeasonExclusionsRepository;
  private readonly seasonsRepository = RepositoryFactory.getSeasonsRepository();
  private readonly teamRepository = RepositoryFactory.getTeamRepository();

  constructor() {
    this.exclusionsRepository = RepositoryFactory.getSchedulerTeamSeasonExclusionsRepository();
  }

  async listExclusions(accountId: bigint, seasonId: bigint): Promise<SchedulerTeamExclusions> {
    await SchedulerValidationUtils.ensureSeasonInAccount(
      this.seasonsRepository,
      accountId,
      seasonId,
    );
    const exclusions = await this.exclusionsRepository.listForSeason(accountId, seasonId);
    return SchedulerTeamExclusionResponseFormatter.formatExclusions(exclusions);
  }

  async createExclusion(
    accountId: bigint,
    seasonId: bigint,
    payload: SchedulerTeamExclusionUpsert,
  ): Promise<SchedulerTeamExclusion> {
    await SchedulerValidationUtils.ensureSeasonInAccount(
      this.seasonsRepository,
      accountId,
      seasonId,
    );
    await this.ensureTeamSeasonInSeason(accountId, seasonId, payload.teamSeasonId);

    const teamSeasonId = SchedulerValidationUtils.parseBigInt(payload.teamSeasonId, 'teamSeasonId');
    const { startTime, endTime } = SchedulerValidationUtils.requireRange(
      payload.startTime,
      payload.endTime,
    );

    const created = await this.exclusionsRepository.create({
      accountid: accountId,
      seasonid: seasonId,
      teamseasonid: teamSeasonId,
      starttime: startTime,
      endtime: endTime,
      note: payload.note ?? null,
      enabled: payload.enabled,
    });

    return SchedulerTeamExclusionResponseFormatter.formatExclusion(created);
  }

  async updateExclusion(
    accountId: bigint,
    seasonId: bigint,
    exclusionId: bigint,
    payload: SchedulerTeamExclusionUpsert,
  ): Promise<SchedulerTeamExclusion> {
    await SchedulerValidationUtils.ensureSeasonInAccount(
      this.seasonsRepository,
      accountId,
      seasonId,
    );

    const existing = await this.exclusionsRepository.findForAccount(exclusionId, accountId);
    if (!existing || existing.seasonid !== seasonId) {
      throw new NotFoundError('Team exclusion not found');
    }

    await this.ensureTeamSeasonInSeason(accountId, seasonId, payload.teamSeasonId);
    const teamSeasonId = SchedulerValidationUtils.parseBigInt(payload.teamSeasonId, 'teamSeasonId');
    const { startTime, endTime } = SchedulerValidationUtils.requireRange(
      payload.startTime,
      payload.endTime,
    );

    const updated = await this.exclusionsRepository.update(exclusionId, {
      teamseasonid: teamSeasonId,
      starttime: startTime,
      endtime: endTime,
      note: payload.note ?? null,
      enabled: payload.enabled,
    });

    return SchedulerTeamExclusionResponseFormatter.formatExclusion(updated);
  }

  async deleteExclusion(
    accountId: bigint,
    seasonId: bigint,
    exclusionId: bigint,
  ): Promise<SchedulerTeamExclusion> {
    await SchedulerValidationUtils.ensureSeasonInAccount(
      this.seasonsRepository,
      accountId,
      seasonId,
    );

    const existing = await this.exclusionsRepository.findForAccount(exclusionId, accountId);
    if (!existing || existing.seasonid !== seasonId) {
      throw new NotFoundError('Team exclusion not found');
    }

    const deleted = await this.exclusionsRepository.delete(exclusionId);
    return SchedulerTeamExclusionResponseFormatter.formatExclusion(deleted);
  }

  private async ensureTeamSeasonInSeason(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: string,
  ): Promise<void> {
    const parsed = SchedulerValidationUtils.parseBigInt(teamSeasonId, 'teamSeasonId');
    const teamSeason = await this.teamRepository.findTeamSeasonForValidation(
      parsed,
      seasonId,
      accountId,
    );
    if (!teamSeason) {
      throw new NotFoundError('Team not found in this season');
    }
  }
}
