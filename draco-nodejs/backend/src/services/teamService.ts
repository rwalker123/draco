import { NotFoundError } from '../utils/customErrors.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { ITeamRepository, ISeasonRepository } from '../repositories/interfaces/index.js';
import { ServiceFactory } from './serviceFactory.js';
import {
  TeamSeasonDetailsType,
  TeamSeasonSummaryType,
  TeamSeasonRecordType,
  LeagueType,
  TeamSeasonNameType,
} from '@draco/shared-schemas';
import { TeamResponseFormatter } from '../responseFormatters/TeamResponseFormatter.js';

export class TeamService {
  private readonly teamRepository: ITeamRepository;
  private readonly seasonRepository: ISeasonRepository;

  private contactService = ServiceFactory.getContactService();

  constructor() {
    this.teamRepository = RepositoryFactory.getTeamRepository();
    this.seasonRepository = RepositoryFactory.getSeasonRepository();
  }

  async getUserTeams(accountId: bigint, userId: string): Promise<TeamSeasonSummaryType[]> {
    // Get the user's contact record for this account
    const userContact = await this.contactService.getContactByUserId(userId, accountId);

    // Get current season for this account
    const currentSeason = await this.seasonRepository.findCurrentSeason(accountId);

    if (!currentSeason) {
      throw new NotFoundError('Current season not set for account');
    }

    const season = await this.seasonRepository.findById(currentSeason.id);

    if (!season) {
      throw new NotFoundError('Current season not found');
    }

    const userTeams = await this.teamRepository.findContactTeams(
      accountId,
      BigInt(userContact?.id || 0),
      currentSeason.id,
    );

    // Get teams where the user is a manager
    const managedTeams = await this.teamRepository.findContactManager(
      accountId,
      BigInt(userContact?.id || 0),
      currentSeason.id,
    );

    return TeamResponseFormatter.formatAndCombineTeamsWithLeagueResponse(
      accountId,
      userTeams,
      managedTeams,
    );
  }

  async getTeamsBySeasonId(seasonId: bigint, accountId: bigint): Promise<TeamSeasonSummaryType[]> {
    const season = await this.seasonRepository.findById(seasonId);

    if (!season) {
      throw new NotFoundError('Current season not found');
    }

    const teamsWithLeaguesAndDivisions = await this.teamRepository.fetchTeamsWithLeagueInfo(
      accountId,
      seasonId,
    );

    return TeamResponseFormatter.formatTeamsWithLeaguesAndDivisions(
      accountId,
      teamsWithLeaguesAndDivisions,
    );
  }

  async getTeamSeasonDetails(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<TeamSeasonDetailsType> {
    const teamSeason = await this.teamRepository.findTeamSeasonWithLeaguesAndTeams(
      teamSeasonId,
      seasonId,
      accountId,
    );

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    // Calculate team record
    const record = await this.teamRepository.getTeamRecord(teamSeasonId);

    return TeamResponseFormatter.formatTeamSeasonWithRecord(accountId, teamSeason, record);
  }

  async updateTeamSeasonName(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    teamSeasonName: string,
  ): Promise<TeamSeasonNameType> {
    const teamSeason = await this.teamRepository.updateTeamSeasonName(
      teamSeasonId,
      seasonId,
      accountId,
      teamSeasonName,
    );

    return TeamResponseFormatter.formatTeamSeasonName(teamSeason);
  }

  async getLeagueInfo(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<LeagueType> {
    const leagueInfo = await this.teamRepository.getLeagueInfo(teamSeasonId, seasonId, accountId);
    if (!leagueInfo) {
      throw new NotFoundError('League information not found for team season');
    }

    return {
      id: leagueInfo.leagueseason.league.id.toString(),
      name: leagueInfo.leagueseason.league.name,
    };
  }
}
