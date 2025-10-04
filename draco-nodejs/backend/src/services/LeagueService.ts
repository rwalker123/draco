import { LeagueType, UpsertLeagueType } from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { LeagueResponseFormatter } from '../responseFormatters/index.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/customErrors.js';

export class LeagueService {
  private readonly leagueRepository = RepositoryFactory.getLeagueRepository();

  async listAccountLeagues(accountId: bigint): Promise<LeagueType[]> {
    const leagues = await this.leagueRepository.findAccountLeagues(accountId);
    return LeagueResponseFormatter.formatMany(leagues);
  }

  async listLeaguesWithSeasons(accountId: bigint): Promise<LeagueType[]> {
    const leagues = await this.leagueRepository.findLeaguesWithSeasons(accountId);
    return LeagueResponseFormatter.formatMany(leagues);
  }

  async getLeague(accountId: bigint, leagueId: bigint): Promise<LeagueType> {
    const league = await this.leagueRepository.findLeagueById(accountId, leagueId);

    if (!league) {
      throw new NotFoundError('League not found');
    }

    return LeagueResponseFormatter.format(league);
  }

  async createLeague(accountId: bigint, input: UpsertLeagueType): Promise<LeagueType> {
    const name = input.name.trim();

    const existingLeague = await this.leagueRepository.findLeagueByName(accountId, name);
    if (existingLeague) {
      throw new ConflictError('A league with this name already exists for this account');
    }

    const newLeague = await this.leagueRepository.createLeague({
      name,
      accountid: accountId,
    });

    return LeagueResponseFormatter.format(newLeague);
  }

  async updateLeague(
    accountId: bigint,
    leagueId: bigint,
    input: UpsertLeagueType,
  ): Promise<LeagueType> {
    const name = input.name.trim();

    const league = await this.leagueRepository.findLeagueById(accountId, leagueId);
    if (!league) {
      throw new NotFoundError('League not found');
    }

    const duplicateLeague = await this.leagueRepository.findLeagueByNameExcludingId(
      accountId,
      name,
      leagueId,
    );

    if (duplicateLeague) {
      throw new ConflictError('A league with this name already exists for this account');
    }

    const updatedLeague = await this.leagueRepository.updateLeague(leagueId, { name });

    return LeagueResponseFormatter.format(updatedLeague);
  }

  async deleteLeague(accountId: bigint, leagueId: bigint): Promise<boolean> {
    const league = await this.leagueRepository.findLeagueById(accountId, leagueId);

    if (!league) {
      throw new NotFoundError('League not found');
    }

    const hasRelatedData = await this.leagueRepository.hasLeagueSeasons(leagueId);

    if (hasRelatedData) {
      throw new ValidationError(
        'Cannot delete league because it is associated with seasons. Remove league from seasons first.',
      );
    }

    await this.leagueRepository.deleteLeague(leagueId);

    return true;
  }
}
