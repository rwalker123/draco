import { NotFoundError } from '../utils/customErrors.js';
import { IGolfLeagueRepository, RepositoryFactory } from '../repositories/index.js';
import {
  GolfLeagueResponseFormatter,
  GolfAccountInfoResponse,
} from '../responseFormatters/golfLeagueResponseFormatter.js';
import { GolfLeagueSetupType, UpdateGolfLeagueSetupType } from '@draco/shared-schemas';
import {
  mapGolfLeagueFieldsForUpdate,
  mapGolfLeagueFieldsForCreate,
} from '../utils/golfLeagueFieldMapper.js';

export class GolfLeagueService {
  private readonly leagueRepository: IGolfLeagueRepository;

  constructor(leagueRepository?: IGolfLeagueRepository) {
    this.leagueRepository = leagueRepository ?? RepositoryFactory.getGolfLeagueRepository();
  }

  async getLeagueSetup(accountId: bigint, leagueSeasonId: bigint): Promise<GolfLeagueSetupType> {
    const setup = await this.leagueRepository.findByLeagueSeasonId(leagueSeasonId);
    if (!setup) {
      throw new NotFoundError('Golf league setup not found');
    }
    return GolfLeagueResponseFormatter.format(setup, accountId);
  }

  async updateLeagueSetup(
    accountId: bigint,
    leagueSeasonId: bigint,
    data: UpdateGolfLeagueSetupType,
  ): Promise<GolfLeagueSetupType> {
    const existingSetup = await this.leagueRepository.findByLeagueSeasonId(leagueSeasonId);

    if (!existingSetup) {
      return this.createLeagueSetup(accountId, leagueSeasonId, data);
    }

    const updateData = mapGolfLeagueFieldsForUpdate(data);

    if (Object.keys(updateData).length > 0) {
      await this.leagueRepository.update(leagueSeasonId, updateData);
    }

    if (data.teamSize !== undefined) {
      await this.leagueRepository.upsertSeasonConfig(leagueSeasonId, data.teamSize);
    }

    const updated = await this.leagueRepository.findByLeagueSeasonId(leagueSeasonId);
    if (!updated) {
      throw new NotFoundError('Golf league setup not found after update');
    }
    return GolfLeagueResponseFormatter.format(updated, accountId);
  }

  private async createLeagueSetup(
    accountId: bigint,
    leagueSeasonId: bigint,
    data: UpdateGolfLeagueSetupType,
  ): Promise<GolfLeagueSetupType> {
    const createData = mapGolfLeagueFieldsForCreate(accountId, leagueSeasonId, data);

    await this.leagueRepository.create(createData);

    const teamSize = data.teamSize ?? 2;
    await this.leagueRepository.upsertSeasonConfig(leagueSeasonId, teamSize);

    const created = await this.leagueRepository.findByLeagueSeasonId(leagueSeasonId);
    if (!created) {
      throw new NotFoundError('Golf league setup not found after creation');
    }
    return GolfLeagueResponseFormatter.format(created, accountId);
  }

  async getGolfAccounts(): Promise<GolfAccountInfoResponse[]> {
    const accounts = await this.leagueRepository.getGolfAccounts();
    return GolfLeagueResponseFormatter.formatGolfAccounts(accounts);
  }
}
