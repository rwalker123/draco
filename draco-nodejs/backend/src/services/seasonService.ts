import {
  CurrentSeasonResponseType,
  LeagueSeasonWithDivisionType,
  SeasonParticipantCountDataType,
  SeasonType,
  UpsertSeasonType,
} from '@draco/shared-schemas';
import {
  ISeasonsRepository,
  RepositoryFactory,
  dbLeagueSeasonBasic,
} from '../repositories/index.js';
import { SeasonResponseFormatter } from '../responseFormatters/index.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/customErrors.js';
import { ServiceFactory } from './serviceFactory.js';

export class SeasonService {
  private readonly discordIntegrationService = ServiceFactory.getDiscordIntegrationService();

  constructor(
    private readonly seasonsRepository: ISeasonsRepository = RepositoryFactory.getSeasonsRepository(),
  ) {}

  async listAccountSeasons(
    accountId: bigint,
    includeDivisions: boolean,
  ): Promise<LeagueSeasonWithDivisionType[]> {
    const [seasons, currentSeasonRecord] = await Promise.all([
      this.seasonsRepository.findAccountSeasons(accountId, includeDivisions),
      this.seasonsRepository.findCurrentSeason(accountId),
    ]);

    return SeasonResponseFormatter.formatSeasonsWithLeagues(seasons, {
      includeDivisions,
      currentSeasonId: currentSeasonRecord?.id ?? null,
    });
  }

  async getCurrentSeason(
    accountId: bigint,
    options?: { includeLeagues?: boolean; includeDivisions?: boolean },
  ): Promise<CurrentSeasonResponseType> {
    const includeLeagues = options?.includeLeagues ?? false;
    const includeDivisions = options?.includeDivisions ?? false;

    const currentSeasonRecord = await this.seasonsRepository.findCurrentSeason(accountId);

    if (!currentSeasonRecord) {
      throw new NotFoundError('No current season set for this account');
    }

    if (!includeLeagues) {
      return SeasonResponseFormatter.formatSeason(currentSeasonRecord, { isCurrent: true });
    }

    const season = await this.seasonsRepository.findSeasonWithLeagues(
      accountId,
      currentSeasonRecord.id,
      includeDivisions,
    );

    if (!season) {
      throw new NotFoundError('Current season not found');
    }

    return SeasonResponseFormatter.formatSeasonWithLeagues(season, {
      includeDivisions,
      currentSeasonId: currentSeasonRecord.id,
      forceCurrent: true,
    });
  }

  async getSeason(accountId: bigint, seasonId: bigint): Promise<LeagueSeasonWithDivisionType> {
    const [season, currentSeasonRecord] = await Promise.all([
      this.seasonsRepository.findSeasonWithLeagues(accountId, seasonId, false),
      this.seasonsRepository.findCurrentSeason(accountId),
    ]);

    if (!season) {
      throw new NotFoundError('Season not found');
    }

    return SeasonResponseFormatter.formatSeasonWithLeagues(season, {
      includeDivisions: false,
      currentSeasonId: currentSeasonRecord?.id ?? null,
    });
  }

  async createSeason(
    accountId: bigint,
    input: UpsertSeasonType,
  ): Promise<LeagueSeasonWithDivisionType> {
    const name = input.name.trim();

    if (!name) {
      throw new ValidationError('Season name is required');
    }

    const existingSeason = await this.seasonsRepository.findSeasonByName(accountId, name);
    if (existingSeason) {
      throw new ConflictError('A season with this name already exists for this account');
    }

    const newSeason = await this.seasonsRepository.createSeason({
      name,
      accountid: accountId,
    });

    return SeasonResponseFormatter.formatSeasonWithLeagueBasics(newSeason, [], {
      isCurrent: false,
    });
  }

  async updateSeason(
    accountId: bigint,
    seasonId: bigint,
    input: UpsertSeasonType,
  ): Promise<SeasonType> {
    const existingSeason = await this.seasonsRepository.findSeasonById(accountId, seasonId);

    if (!existingSeason) {
      throw new NotFoundError('Season not found');
    }

    const name = input.name.trim();

    if (!name) {
      throw new ValidationError('Season name is required');
    }

    const duplicateSeason = await this.seasonsRepository.findSeasonByName(
      accountId,
      name,
      seasonId,
    );
    if (duplicateSeason) {
      throw new ConflictError('A season with this name already exists for this account');
    }

    const updatedSeason = await this.seasonsRepository.updateSeasonName(seasonId, name);
    const currentSeasonRecord = await this.seasonsRepository.findCurrentSeason(accountId);

    return SeasonResponseFormatter.formatSeason(updatedSeason, {
      isCurrent: currentSeasonRecord?.id === updatedSeason.id,
    });
  }

  async copySeason(accountId: bigint, seasonId: bigint): Promise<LeagueSeasonWithDivisionType> {
    const sourceSeason = await this.seasonsRepository.findSeasonWithLeagues(
      accountId,
      seasonId,
      false,
    );

    if (!sourceSeason) {
      throw new NotFoundError('Source season not found');
    }

    const newSeasonName = `${sourceSeason.name} Copy`;
    const existingCopy = await this.seasonsRepository.findSeasonByName(accountId, newSeasonName);

    if (existingCopy) {
      throw new ConflictError('A season with this copy name already exists');
    }

    const newSeason = await this.seasonsRepository.createSeason({
      name: newSeasonName,
      accountid: accountId,
    });

    const copiedLeagueSeasons: dbLeagueSeasonBasic[] = [];
    for (const leagueSeason of sourceSeason.leagueseason) {
      const createdLeagueSeason = await this.seasonsRepository.createLeagueSeason(
        newSeason.id,
        leagueSeason.leagueid,
      );
      copiedLeagueSeasons.push(createdLeagueSeason);
    }

    return SeasonResponseFormatter.formatSeasonWithLeagueBasics(newSeason, copiedLeagueSeasons, {
      isCurrent: false,
    });
  }

  async setCurrentSeason(accountId: bigint, seasonId: bigint): Promise<SeasonType> {
    const season = await this.seasonsRepository.findSeasonById(accountId, seasonId);

    if (!season) {
      throw new NotFoundError('Season not found');
    }

    await this.seasonsRepository.upsertCurrentSeason(accountId, seasonId);
    this.discordIntegrationService.clearChannelIngestionTargetsCacheForAccount(accountId);

    return SeasonResponseFormatter.formatSeason(season, { isCurrent: true });
  }

  async deleteSeason(accountId: bigint, seasonId: bigint): Promise<boolean> {
    const season = await this.seasonsRepository.findSeasonById(accountId, seasonId);

    if (!season) {
      throw new NotFoundError('Season not found');
    }

    const currentSeasonRecord = await this.seasonsRepository.findCurrentSeason(accountId);

    if (currentSeasonRecord?.id === seasonId) {
      throw new ValidationError(
        'Cannot delete the current season. Set a different season as current first.',
      );
    }

    await this.seasonsRepository.deleteSeason(seasonId);

    return true;
  }

  async getSeasonParticipantCount(
    accountId: bigint,
    seasonId: bigint,
  ): Promise<SeasonParticipantCountDataType> {
    const season = await this.seasonsRepository.findSeasonById(accountId, seasonId);

    if (!season) {
      throw new NotFoundError('Season not found');
    }

    const participantCount = await this.seasonsRepository.countSeasonParticipants(
      accountId,
      seasonId,
    );

    return SeasonResponseFormatter.formatParticipantCount(seasonId, participantCount);
  }
}
