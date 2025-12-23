import type {
  SchedulerSeasonWindowConfig,
  SchedulerSeasonWindowConfigUpsert,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { ISchedulerSeasonConfigRepository } from '../repositories/interfaces/ISchedulerSeasonConfigRepository.js';
import type { ISchedulerSeasonLeagueSelectionsRepository } from '../repositories/interfaces/ISchedulerSeasonLeagueSelectionsRepository.js';
import { SchedulerSeasonWindowConfigResponseFormatter } from '../responseFormatters/schedulerSeasonWindowConfigResponseFormatter.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { DateUtils } from '../utils/dateUtils.js';

export class SchedulerSeasonWindowConfigService {
  private readonly schedulerSeasonConfigRepository: ISchedulerSeasonConfigRepository;
  private readonly schedulerSeasonLeagueSelectionsRepository: ISchedulerSeasonLeagueSelectionsRepository;
  private readonly seasonsRepository = RepositoryFactory.getSeasonsRepository();

  constructor() {
    this.schedulerSeasonConfigRepository = RepositoryFactory.getSchedulerSeasonConfigRepository();
    this.schedulerSeasonLeagueSelectionsRepository =
      RepositoryFactory.getSchedulerSeasonLeagueSelectionsRepository();
  }

  async getConfig(accountId: bigint, seasonId: bigint): Promise<SchedulerSeasonWindowConfig> {
    await this.ensureSeasonInAccount(accountId, seasonId);
    const config = await this.schedulerSeasonConfigRepository.findForSeason(accountId, seasonId);
    if (!config) {
      throw new NotFoundError('Scheduler season window is not configured');
    }
    const selections = await this.schedulerSeasonLeagueSelectionsRepository.listForSeason(
      accountId,
      seasonId,
    );
    const leagueSeasonIds = selections
      .filter((row) => row.enabled)
      .map((row) => row.leagueseasonid.toString());

    return SchedulerSeasonWindowConfigResponseFormatter.formatConfig(config, leagueSeasonIds);
  }

  async upsertConfig(
    accountId: bigint,
    seasonId: bigint,
    payload: SchedulerSeasonWindowConfigUpsert,
  ): Promise<SchedulerSeasonWindowConfig> {
    await this.ensureSeasonInAccount(accountId, seasonId);

    const startDate = this.requireDate(payload.startDate, 'startDate');
    const endDate = this.requireDate(payload.endDate, 'endDate');
    if (startDate > endDate) {
      throw new ValidationError('startDate must be on or before endDate');
    }

    const seasonWithLeagues = await this.seasonsRepository.findSeasonWithLeagues(
      accountId,
      seasonId,
      false,
    );
    if (!seasonWithLeagues) {
      throw new NotFoundError('Season not found');
    }

    const allowedLeagueSeasonIds = new Set(
      seasonWithLeagues.leagueseason.map((leagueSeason) => leagueSeason.id.toString()),
    );
    const nextLeagueSeasonIds =
      payload.leagueSeasonIds?.length && payload.leagueSeasonIds.length > 0
        ? payload.leagueSeasonIds
        : Array.from(allowedLeagueSeasonIds);
    if (nextLeagueSeasonIds.length === 0) {
      throw new ValidationError('At least one league must be selected for scheduling');
    }
    const invalidLeagueSelections = nextLeagueSeasonIds.filter(
      (id) => !allowedLeagueSeasonIds.has(id),
    );
    if (invalidLeagueSelections.length > 0) {
      throw new ValidationError(
        `Invalid leagueSeasonIds for season: ${invalidLeagueSelections.join(', ')}`,
      );
    }

    const existingConfig = await this.schedulerSeasonConfigRepository.findForSeason(
      accountId,
      seasonId,
    );
    const nextUmpiresPerGame = payload.umpiresPerGame ?? existingConfig?.umpirespergame ?? 2;
    if (!Number.isFinite(nextUmpiresPerGame) || nextUmpiresPerGame < 1 || nextUmpiresPerGame > 4) {
      throw new ValidationError('umpiresPerGame must be between 1 and 4');
    }

    const nextMaxGamesPerUmpirePerDay =
      payload.maxGamesPerUmpirePerDay === undefined
        ? (existingConfig?.maxgamesperumpireperday ?? null)
        : payload.maxGamesPerUmpirePerDay;
    if (
      nextMaxGamesPerUmpirePerDay !== null &&
      nextMaxGamesPerUmpirePerDay !== undefined &&
      (!Number.isFinite(nextMaxGamesPerUmpirePerDay) || nextMaxGamesPerUmpirePerDay <= 0)
    ) {
      throw new ValidationError('maxGamesPerUmpirePerDay must be a positive number or null');
    }

    const updated = await this.schedulerSeasonConfigRepository.upsertForSeason({
      accountid: accountId,
      seasonid: seasonId,
      startdate: startDate,
      enddate: endDate,
      umpirespergame: Math.floor(nextUmpiresPerGame),
      maxgamesperumpireperday:
        nextMaxGamesPerUmpirePerDay === null
          ? null
          : nextMaxGamesPerUmpirePerDay !== undefined
            ? Math.floor(nextMaxGamesPerUmpirePerDay)
            : null,
    });

    const persistedSelections =
      await this.schedulerSeasonLeagueSelectionsRepository.replaceForSeason({
        accountid: accountId,
        seasonid: seasonId,
        leagueseasonids: nextLeagueSeasonIds.map((value) => BigInt(value)),
      });
    const leagueSeasonIds = persistedSelections
      .filter((row) => row.enabled)
      .map((row) => row.leagueseasonid.toString());

    return SchedulerSeasonWindowConfigResponseFormatter.formatConfig(updated, leagueSeasonIds);
  }

  private async ensureSeasonInAccount(accountId: bigint, seasonId: bigint): Promise<void> {
    const season = await this.seasonsRepository.findSeasonById(accountId, seasonId);
    if (!season) {
      throw new NotFoundError('Season not found');
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
