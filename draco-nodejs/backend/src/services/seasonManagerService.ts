import { SeasonManagerListType } from '@draco/shared-schemas';
import {
  IManagerRepository,
  SeasonManagerRepositoryFilters,
} from '../repositories/interfaces/IManagerRepository.js';
import { SeasonManagerResponseFormatter } from '../responseFormatters/seasonManagerResponseFormatter.js';

export interface SeasonManagerFilters {
  leagueSeasonId?: string;
  teamSeasonId?: string;
  search?: string;
}

export class SeasonManagerService {
  constructor(private readonly managerRepository: IManagerRepository) {}

  async getSeasonManagers(
    accountId: bigint,
    seasonId: bigint,
    filters: SeasonManagerFilters = {},
  ): Promise<SeasonManagerListType> {
    const repositoryFilters: SeasonManagerRepositoryFilters = {};

    if (filters.leagueSeasonId) {
      repositoryFilters.leagueSeasonId = BigInt(filters.leagueSeasonId);
    }

    if (filters.teamSeasonId) {
      repositoryFilters.teamSeasonId = BigInt(filters.teamSeasonId);
    }

    if (filters.search?.trim()) {
      repositoryFilters.search = filters.search.trim();
    }

    const seasonManagers = await this.managerRepository.findSeasonManagers(
      accountId,
      seasonId,
      repositoryFilters,
    );

    return SeasonManagerResponseFormatter.formatSeasonManagerList(seasonManagers);
  }
}
