import {
  ConflictError,
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from '../utils/customErrors.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import {
  ITeamRepository,
  ISeasonsRepository,
  ILeagueRepository,
} from '../repositories/interfaces/index.js';
import { ServiceFactory } from './serviceFactory.js';
import {
  TeamSeasonRecordType,
  TeamSeasonType,
  LeagueType,
  TeamSeasonNameType,
  UpsertTeamSeasonType,
} from '@draco/shared-schemas';
import { TeamResponseFormatter } from '../responseFormatters/index.js';
import { Prisma, teamsseason, teams } from '@prisma/client';
import { dbTeamWithLeague, dbTeamSeasonValidationResult } from '../repositories/types/dbTypes.js';

export interface TeamValidationOptions {
  includeTeams?: boolean;
  includeDivisionSeason?: boolean;
  includeLeagueSeason?: boolean;
  customIncludes?: Prisma.teamsseasonInclude;
}

export class TeamService {
  private readonly teamRepository: ITeamRepository;
  private readonly seasonRepository: ISeasonsRepository;
  private readonly leagueRepository: ILeagueRepository;

  private contactService = ServiceFactory.getContactService();

  constructor() {
    this.teamRepository = RepositoryFactory.getTeamRepository();
    this.seasonRepository = RepositoryFactory.getSeasonsRepository();
    this.leagueRepository = RepositoryFactory.getLeagueRepository();
  }

  async getTeamSeasonFromTeamId(accountId: bigint, teamId: bigint): Promise<TeamSeasonType> {
    const currentSeason = await this.seasonRepository.findCurrentSeason(accountId);
    if (!currentSeason) {
      throw new NotFoundError('Current season not set for account');
    }
    const teamSeason = await this.teamRepository.findTeamSeasonByTeamId(
      teamId,
      currentSeason.id,
      accountId,
    );

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    return TeamResponseFormatter.formatTeamSeason(accountId, teamSeason);
  }

  async getUserTeams(accountId: bigint, userId: string): Promise<TeamSeasonType[]> {
    // Get the user's contact record for this account
    const userContact = await this.contactService.getContactByUserId(userId, accountId);

    // Get current season for this account
    const currentSeason = await this.seasonRepository.findCurrentSeason(accountId);

    if (!currentSeason) {
      throw new NotFoundError('Current season not set for account');
    }

    const season = await this.seasonRepository.findSeasonById(accountId, currentSeason.id);

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

  async getTeamsBySeasonId(seasonId: bigint, accountId: bigint): Promise<TeamSeasonType[]> {
    const season = await this.seasonRepository.findSeasonById(accountId, seasonId);

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

  async getTeamsByLeagueSeasonId(
    leagueSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<TeamSeasonType[]> {
    const leagueSeason = await this.leagueRepository.findById(leagueSeasonId);

    if (!leagueSeason || leagueSeason.seasonid !== seasonId) {
      throw new NotFoundError('League season not found');
    }

    const leagueTeams = await this.teamRepository.findTeamsByLeagueId(
      leagueSeasonId,
      seasonId,
      accountId,
    );

    return TeamResponseFormatter.formatTeamsResponse(accountId, leagueTeams);
  }

  async getTeamsByDivisionSeasonId(
    divisionSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<TeamSeasonType[]> {
    const divisionTeams = await this.teamRepository.findTeamsByDivisionId(
      divisionSeasonId,
      seasonId,
      accountId,
    );

    return TeamResponseFormatter.formatTeamsResponse(accountId, divisionTeams);
  }

  async ensureContactIsOnTeam(accountId: bigint, teamId: bigint, contactId: bigint): Promise<void> {
    if (contactId <= 0n) {
      throw new ValidationError('Contact identifier must be a positive value');
    }

    const currentSeason = await this.seasonRepository.findCurrentSeason(accountId);

    if (!currentSeason) {
      throw new NotFoundError('Current season not set for account');
    }

    const rosterTeams = await this.teamRepository.findContactTeams(
      accountId,
      contactId,
      currentSeason.id,
    );
    const managesTeam = await this.teamRepository.findTeamManager(
      contactId,
      teamId,
      currentSeason.id,
    );

    const isRostered = rosterTeams.some((team) => team.teamsseason?.teams?.id === teamId);

    if (!isRostered && !managesTeam) {
      throw new AuthorizationError('Contact is not associated with this team');
    }
  }

  /**
   * Create a new team season
   * @param accountId
   * @param seasonId
   * @param leagueSeasonId
   * @param name
   * @returns
   */
  async createTeamSeason(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
    name: string,
  ): Promise<TeamSeasonType> {
    const trimmedName = name?.trim();

    if (!trimmedName) {
      throw new ValidationError('Team name is required');
    }

    const leagueSeason = await this.leagueRepository.findLeagueSeasonRecord(
      leagueSeasonId,
      seasonId,
      accountId,
    );

    if (!leagueSeason) {
      throw new NotFoundError('League season not found');
    }

    const existingTeams = await this.teamRepository.findMany({
      name: trimmedName,
      leagueseasonid: leagueSeasonId,
    });

    if (existingTeams.length > 0) {
      throw new ConflictError('A team with this name already exists in this league season');
    }

    const teamDefinition = await this.teamRepository.createTeamDefinition({
      accountid: accountId,
      webaddress: '',
      youtubeuserid: null,
      defaultvideo: '',
      autoplayvideo: false,
    });

    const teamSeason = await this.teamRepository.create({
      name: trimmedName,
      leagueseasonid: leagueSeasonId,
      teamid: teamDefinition.id,
    });

    const createdTeamSeason = await this.teamRepository.findTeamSeasonForValidation(
      teamSeason.id,
      seasonId,
      accountId,
      {
        teams: true,
        leagueseason: {
          include: {
            league: true,
          },
        },
      },
    );

    if (!createdTeamSeason) {
      throw new NotFoundError('Team season not found');
    }

    return TeamResponseFormatter.formatTeamSeasonSummary(
      accountId,
      createdTeamSeason as dbTeamWithLeague,
    );
  }

  async removeTeamSeason(accountId: bigint, seasonId: bigint, teamSeasonId: bigint): Promise<void> {
    await this.validateTeamSeasonBasic(teamSeasonId, seasonId, accountId);

    await this.teamRepository.delete(teamSeasonId);
  }

  async deleteTeam(accountId: bigint, teamId: bigint): Promise<void> {
    const team = await this.teamRepository.findTeamDefinition(teamId);

    if (!team || team.accountid !== accountId) {
      throw new NotFoundError('Team not found');
    }

    const seasonsCount = await this.teamRepository.countTeamSeasonsByTeamId(teamId);

    if (seasonsCount > 0) {
      throw new ConflictError('Team cannot be deleted while assigned to seasons');
    }

    await this.teamRepository.deleteTeamDefinition(teamId);
  }

  async getTeamSeasonDetails(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<TeamSeasonRecordType> {
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

  async updateTeamSeason(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    updateData: UpsertTeamSeasonType,
  ): Promise<TeamSeasonType> {
    // Ensure the team season exists
    const teamSeason = await this.teamRepository.findById(teamSeasonId);
    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    const teamSeasonUpdate: Partial<teamsseason> = {};
    const teamUpdate: Partial<teams> = {};

    if (updateData.name !== undefined) {
      const trimmedName = updateData.name.trim();

      if (!trimmedName) {
        throw new ValidationError('Team name is required');
      }

      const duplicateTeams = await this.teamRepository.findMany({
        leagueseasonid: teamSeason.leagueseasonid,
        name: trimmedName,
        id: { not: teamSeasonId },
      });

      if (duplicateTeams.length > 0) {
        throw new ConflictError('A team with this name already exists in this league season');
      }

      teamSeasonUpdate.name = trimmedName;
    }

    if (updateData.divisionId !== undefined) {
      teamSeasonUpdate.divisionseasonid =
        updateData.divisionId === null ? null : BigInt(updateData.divisionId);
    }

    if (updateData.team) {
      if (updateData.team.webAddress !== undefined) {
        teamUpdate.webaddress = updateData.team.webAddress ?? '';
      }

      if (updateData.team.youtubeUserId !== undefined) {
        teamUpdate.youtubeuserid = updateData.team.youtubeUserId ?? null;
      }

      if (updateData.team.defaultVideo !== undefined) {
        teamUpdate.defaultvideo = updateData.team.defaultVideo ?? '';
      }

      if (updateData.team.autoPlayVideo !== undefined) {
        teamUpdate.autoplayvideo = updateData.team.autoPlayVideo ?? false;
      }
    }

    const teamsSeasonPayload =
      Object.keys(teamSeasonUpdate).length > 0 ? teamSeasonUpdate : undefined;
    const teamPayload = Object.keys(teamUpdate).length > 0 ? teamUpdate : undefined;

    const updatedTeam = await this.teamRepository.updateTeamSeason(
      teamSeasonId,
      seasonId,
      accountId,
      teamsSeasonPayload,
      teamPayload,
    );

    return TeamResponseFormatter.formatTeamSeasonSummary(accountId, updatedTeam);
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
      accountId: accountId.toString(),
    };
  }

  async validateTeamSeasonAccess(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    options: TeamValidationOptions = {},
  ): Promise<dbTeamSeasonValidationResult> {
    const include = this.buildTeamValidationInclude(options);
    const teamSeason = await this.teamRepository.findTeamSeasonForValidation(
      teamSeasonId,
      seasonId,
      accountId,
      include,
    );

    if (!teamSeason) {
      throw new NotFoundError('Team not found or access denied');
    }

    return teamSeason;
  }

  async findTeamSeason(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
  ): Promise<TeamSeasonType | null> {
    const teamSeason = await this.teamRepository.findTeamSeason(teamSeasonId, seasonId, accountId);

    if (!teamSeason) {
      return null;
    }

    return TeamResponseFormatter.formatTeamSeason(accountId, teamSeason);
  }

  async validateTeamSeasonWithTeamDetails(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbTeamSeasonValidationResult> {
    return this.validateTeamSeasonAccess(teamSeasonId, seasonId, accountId, {
      includeTeams: true,
      includeLeagueSeason: true,
    });
  }

  async validateTeamSeasonWithDivision(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbTeamSeasonValidationResult> {
    return this.validateTeamSeasonAccess(teamSeasonId, seasonId, accountId, {
      includeTeams: true,
      includeDivisionSeason: true,
      includeLeagueSeason: true,
    });
  }

  async validateTeamSeasonBasic(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbTeamSeasonValidationResult> {
    return this.validateTeamSeasonAccess(teamSeasonId, seasonId, accountId, {
      includeLeagueSeason: true,
    });
  }

  private buildTeamValidationInclude(options: TeamValidationOptions): Prisma.teamsseasonInclude {
    if (options.customIncludes) {
      return options.customIncludes;
    }

    const include: Prisma.teamsseasonInclude = {
      leagueseason: {
        include: {
          league: true,
          ...(options.includeLeagueSeason ? { season: true } : {}),
        },
      },
      ...(options.includeTeams ? { teams: true } : {}),
      ...(options.includeDivisionSeason
        ? {
            divisionseason: {
              include: {
                divisiondefs: true,
              },
            },
          }
        : {}),
    };

    return include;
  }
}
