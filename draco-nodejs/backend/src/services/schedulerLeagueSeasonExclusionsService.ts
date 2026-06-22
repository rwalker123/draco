import type {
  SchedulerLeagueExclusion,
  SchedulerLeagueExclusionUpsert,
  SchedulerLeagueExclusions,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { ISchedulerLeagueSeasonExclusionsRepository } from '../repositories/interfaces/ISchedulerLeagueSeasonExclusionsRepository.js';
import { SchedulerLeagueExclusionResponseFormatter } from '../responseFormatters/schedulerLeagueExclusionResponseFormatter.js';
import { NotFoundError } from '../utils/customErrors.js';
import { SchedulerValidationUtils } from '../utils/schedulerValidationUtils.js';

export class SchedulerLeagueSeasonExclusionsService {
  private readonly exclusionsRepository: ISchedulerLeagueSeasonExclusionsRepository;
  private readonly seasonsRepository = RepositoryFactory.getSeasonsRepository();
  private readonly leagueRepository = RepositoryFactory.getLeagueRepository();

  constructor() {
    this.exclusionsRepository = RepositoryFactory.getSchedulerLeagueSeasonExclusionsRepository();
  }

  async listExclusions(accountId: bigint, seasonId: bigint): Promise<SchedulerLeagueExclusions> {
    await SchedulerValidationUtils.ensureSeasonInAccount(
      this.seasonsRepository,
      accountId,
      seasonId,
    );
    const exclusions = await this.exclusionsRepository.listForSeason(accountId, seasonId);
    return SchedulerLeagueExclusionResponseFormatter.formatExclusions(exclusions);
  }

  async createExclusion(
    accountId: bigint,
    seasonId: bigint,
    payload: SchedulerLeagueExclusionUpsert,
  ): Promise<SchedulerLeagueExclusion> {
    await SchedulerValidationUtils.ensureSeasonInAccount(
      this.seasonsRepository,
      accountId,
      seasonId,
    );
    await this.ensureLeagueSeasonInSeason(accountId, seasonId, payload.leagueSeasonId);

    const leagueSeasonId = SchedulerValidationUtils.parseBigInt(
      payload.leagueSeasonId,
      'leagueSeasonId',
    );
    const { startTime, endTime } = SchedulerValidationUtils.requireRange(
      payload.startTime,
      payload.endTime,
    );

    const created = await this.exclusionsRepository.create({
      accountid: accountId,
      seasonid: seasonId,
      leagueseasonid: leagueSeasonId,
      starttime: startTime,
      endtime: endTime,
      note: payload.note ?? null,
      enabled: payload.enabled,
    });

    return SchedulerLeagueExclusionResponseFormatter.formatExclusion(created);
  }

  async updateExclusion(
    accountId: bigint,
    seasonId: bigint,
    exclusionId: bigint,
    payload: SchedulerLeagueExclusionUpsert,
  ): Promise<SchedulerLeagueExclusion> {
    await SchedulerValidationUtils.ensureSeasonInAccount(
      this.seasonsRepository,
      accountId,
      seasonId,
    );

    const existing = await this.exclusionsRepository.findForAccount(exclusionId, accountId);
    if (!existing || existing.seasonid !== seasonId) {
      throw new NotFoundError('League exclusion not found');
    }

    await this.ensureLeagueSeasonInSeason(accountId, seasonId, payload.leagueSeasonId);
    const leagueSeasonId = SchedulerValidationUtils.parseBigInt(
      payload.leagueSeasonId,
      'leagueSeasonId',
    );
    const { startTime, endTime } = SchedulerValidationUtils.requireRange(
      payload.startTime,
      payload.endTime,
    );

    const updated = await this.exclusionsRepository.update(exclusionId, {
      leagueseasonid: leagueSeasonId,
      starttime: startTime,
      endtime: endTime,
      note: payload.note ?? null,
      enabled: payload.enabled,
    });

    return SchedulerLeagueExclusionResponseFormatter.formatExclusion(updated);
  }

  async deleteExclusion(
    accountId: bigint,
    seasonId: bigint,
    exclusionId: bigint,
  ): Promise<SchedulerLeagueExclusion> {
    await SchedulerValidationUtils.ensureSeasonInAccount(
      this.seasonsRepository,
      accountId,
      seasonId,
    );

    const existing = await this.exclusionsRepository.findForAccount(exclusionId, accountId);
    if (!existing || existing.seasonid !== seasonId) {
      throw new NotFoundError('League exclusion not found');
    }

    const deleted = await this.exclusionsRepository.delete(exclusionId);
    return SchedulerLeagueExclusionResponseFormatter.formatExclusion(deleted);
  }

  private async ensureLeagueSeasonInSeason(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: string,
  ): Promise<void> {
    const parsed = SchedulerValidationUtils.parseBigInt(leagueSeasonId, 'leagueSeasonId');
    const leagueSeason = await this.leagueRepository.findLeagueSeason(parsed, seasonId, accountId);
    if (!leagueSeason) {
      throw new NotFoundError('League not found in this season');
    }
  }
}
