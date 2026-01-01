import {
  DivisionSeasonType,
  DivisionSeasonWithTeamsType,
  GameType,
  LeagueSeasonType,
  LeagueSeasonWithDivisionTeamsAndUnassignedType,
  LeagueSetupType,
  LeagueType,
  UpdateDivisionSeasonResponseType,
  UpsertDivisionSeasonType,
  UpsertLeagueType,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { LeagueResponseFormatter } from '../responseFormatters/index.js';
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../utils/customErrors.js';
import {
  dbSeason,
  dbTeamSeasonCountResult,
  dbTeamSeasonValidationResult,
  dbTeamSeasonWithTeam,
  dbLeague,
} from '../repositories/index.js';

interface LeagueSeasonSetupOptions {
  includeTeams: boolean;
  includeUnassignedTeams: boolean;
  includePlayerCounts: boolean;
  includeManagerCounts: boolean;
}

interface LeagueSeasonGameOptions {
  startDate?: Date;
  endDate?: Date;
  teamId?: bigint;
}

export class LeagueService {
  private readonly leagueRepository = RepositoryFactory.getLeagueRepository();
  private readonly seasonRepository = RepositoryFactory.getSeasonsRepository();
  private readonly teamRepository = RepositoryFactory.getTeamRepository();

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

  async getSeasonLeagueSetup(
    accountId: bigint,
    seasonId: bigint,
    options: LeagueSeasonSetupOptions,
  ): Promise<LeagueSetupType> {
    const leagueSeasons = await this.leagueRepository.findSeasonLeagueSeasons(seasonId, accountId, {
      includeTeams: options.includeTeams,
    });

    const leagueSeasonIds = leagueSeasons.map((leagueSeason) => leagueSeason.id);

    const playerCountMap =
      options.includeTeams && options.includePlayerCounts
        ? this.buildCountMap(
            await this.leagueRepository.getPlayerCountsForLeagueSeasons(leagueSeasonIds, accountId),
          )
        : new Map<string, number>();

    const managerCountMap =
      options.includeTeams && options.includeManagerCounts
        ? this.buildCountMap(
            await this.leagueRepository.getManagerCountsForLeagueSeasons(
              leagueSeasonIds,
              accountId,
            ),
          )
        : new Map<string, number>();

    return LeagueResponseFormatter.formatLeagueSetup(leagueSeasons, {
      includeTeams: options.includeTeams,
      includeUnassignedTeams: options.includeUnassignedTeams,
      includePlayerCount: options.includePlayerCounts,
      includeManagerCount: options.includeManagerCounts,
      playerCounts: playerCountMap,
      managerCounts: managerCountMap,
      accountId,
    });
  }

  async getLeagueSeason(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
  ): Promise<LeagueSeasonWithDivisionTeamsAndUnassignedType> {
    const leagueSeason = await this.leagueRepository.findLeagueSeasonById(
      leagueSeasonId,
      seasonId,
      accountId,
    );

    if (!leagueSeason) {
      throw new NotFoundError('League season not found');
    }

    return LeagueResponseFormatter.formatLeagueSeasonDetails(leagueSeason, accountId);
  }

  async addLeagueToSeason(
    accountId: bigint,
    seasonId: bigint,
    leagueId: bigint,
  ): Promise<LeagueSeasonType> {
    const season = await this.ensureSeasonInAccount(accountId, seasonId);
    const league = await this.ensureLeagueInAccount(accountId, leagueId);

    const existingLeagueSeason = await this.leagueRepository.findLeagueSeasonByLeague(
      leagueId,
      seasonId,
    );

    if (existingLeagueSeason) {
      throw new ConflictError('This league is already added to this season');
    }

    const leagueSeason = await this.leagueRepository.createLeagueSeason(seasonId, leagueId);

    return LeagueResponseFormatter.formatLeagueSeasonSummary({
      leagueSeasonId: leagueSeason.id,
      leagueId,
      leagueName: league.name,
      seasonId,
      seasonName: season.name,
    });
  }

  async removeLeagueFromSeason(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
  ): Promise<boolean> {
    await this.ensureSeasonInAccount(accountId, seasonId);

    const leagueSeason = await this.leagueRepository.getLeagueSeasonRelationCounts(
      leagueSeasonId,
      seasonId,
      accountId,
    );

    if (!leagueSeason) {
      throw new NotFoundError('League season not found');
    }

    const { _count: counts } = leagueSeason;
    if (
      counts.divisionseason > 0 ||
      counts.gameejections > 0 ||
      counts.golfmatch > 0 ||
      counts.leagueevents > 0 ||
      counts.leagueschedule > 0 ||
      counts.playoffsetup > 0 ||
      counts.teamsseason > 0
    ) {
      throw new ConflictError(
        'Cannot remove league from season because it has related data (divisions, games, teams, etc.). Remove related data first.',
      );
    }

    await this.leagueRepository.deleteLeagueSeason(leagueSeasonId);

    return true;
  }

  async listDivisionSeasons(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
  ): Promise<DivisionSeasonWithTeamsType[]> {
    await this.ensureLeagueSeasonRecord(accountId, seasonId, leagueSeasonId);

    const divisions = await this.leagueRepository.findDivisionSeasons(leagueSeasonId, accountId);

    return LeagueResponseFormatter.formatDivisionSeasons(accountId, divisions);
  }

  async listLeagueSeasonGames(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
    options: LeagueSeasonGameOptions,
  ): Promise<GameType[]> {
    await this.ensureLeagueSeasonRecord(accountId, seasonId, leagueSeasonId);

    const games = await this.leagueRepository.findLeagueSeasonGames(leagueSeasonId, accountId, {
      startDate: options.startDate,
      endDate: options.endDate,
      teamId: options.teamId,
    });

    const teamIds = new Set<bigint>();
    games.forEach((game) => {
      teamIds.add(game.hteamid);
      teamIds.add(game.vteamid);
    });

    const teamSeasons = await this.leagueRepository.findTeamSeasonsByIds(Array.from(teamIds));
    const teamNames = this.buildTeamNameMap(teamIds, teamSeasons);

    return LeagueResponseFormatter.formatLeagueSeasonGames(games, teamNames);
  }

  async addDivisionSeason(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
    input: UpsertDivisionSeasonType,
  ): Promise<DivisionSeasonType> {
    await this.ensureLeagueSeasonRecord(accountId, seasonId, leagueSeasonId);

    const { divisionId, name, priority } = input;

    if (!divisionId && (!name || !name.trim())) {
      throw new ValidationError('Either Division ID or Division name is required');
    }

    let divisionDefinitionId: bigint;
    if (divisionId) {
      const existingDivision = await this.leagueRepository.findDivisionDefinitionById(
        accountId,
        BigInt(divisionId),
      );

      if (!existingDivision) {
        throw new NotFoundError('Division not found');
      }

      divisionDefinitionId = existingDivision.id;
    } else {
      const trimmedName = name!.trim();
      const existingDivision = await this.leagueRepository.findDivisionDefinitionByName(
        accountId,
        trimmedName,
      );

      if (existingDivision) {
        throw new ConflictError('A division with this name already exists');
      }

      const createdDivision = await this.leagueRepository.createDivisionDefinition(
        accountId,
        trimmedName,
      );
      divisionDefinitionId = createdDivision.id;
    }

    const existingDivisionSeason = await this.leagueRepository.findDivisionSeasonByDivision(
      leagueSeasonId,
      divisionDefinitionId,
    );

    if (existingDivisionSeason) {
      throw new ConflictError('This division is already added to this league season');
    }

    const newDivisionSeason = await this.leagueRepository.createDivisionSeason(
      leagueSeasonId,
      divisionDefinitionId,
      priority ?? 0,
    );

    return LeagueResponseFormatter.formatDivisionSeason(newDivisionSeason);
  }

  async updateDivisionSeason(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
    divisionSeasonId: bigint,
    input: UpsertDivisionSeasonType,
  ): Promise<UpdateDivisionSeasonResponseType> {
    await this.ensureLeagueSeasonRecord(accountId, seasonId, leagueSeasonId);

    const divisionSeason = await this.leagueRepository.findDivisionSeasonById(
      divisionSeasonId,
      leagueSeasonId,
      accountId,
    );

    if (!divisionSeason) {
      throw new NotFoundError('Division season not found');
    }

    if (divisionSeason.divisiondefs.accountid !== accountId) {
      throw new AuthorizationError('Access denied');
    }

    if (input.priority !== undefined) {
      await this.leagueRepository.updateDivisionSeasonPriority(divisionSeasonId, input.priority);
    }

    if (input.name && input.name.trim() && input.name.trim() !== divisionSeason.divisiondefs.name) {
      const trimmedName = input.name.trim();
      const conflictingDivision = await this.leagueRepository.findDivisionDefinitionByName(
        accountId,
        trimmedName,
      );

      if (conflictingDivision && conflictingDivision.id !== divisionSeason.divisionid) {
        if (input.switchToExistingDivision) {
          await this.leagueRepository.updateDivisionSeasonDivisionId(
            divisionSeasonId,
            conflictingDivision.id,
          );
          return { success: true };
        }
        return {
          success: false,
          conflict: {
            existingDivisionId: conflictingDivision.id.toString(),
            existingDivisionName: conflictingDivision.name,
          },
        };
      }

      await this.leagueRepository.updateDivisionDefinitionName(
        divisionSeason.divisionid,
        trimmedName,
      );
    }

    return { success: true };
  }

  async removeDivisionSeason(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
    divisionSeasonId: bigint,
  ): Promise<boolean> {
    await this.ensureLeagueSeasonRecord(accountId, seasonId, leagueSeasonId);

    const divisionSeason = await this.leagueRepository.findDivisionSeasonById(
      divisionSeasonId,
      leagueSeasonId,
      accountId,
    );

    if (!divisionSeason) {
      throw new NotFoundError('Division season not found');
    }

    if (divisionSeason.divisiondefs.accountid !== accountId) {
      throw new AuthorizationError('Access denied');
    }

    const hasTeams = await this.leagueRepository.divisionSeasonHasTeams(divisionSeasonId);

    if (hasTeams) {
      throw new ConflictError(
        'Cannot remove division because it contains teams. Remove teams from division first.',
      );
    }

    await this.leagueRepository.deleteDivisionSeason(divisionSeasonId);

    return true;
  }

  async assignTeamToDivision(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
    teamSeasonId: bigint,
    divisionSeasonId: bigint,
  ): Promise<boolean> {
    await this.ensureLeagueSeasonRecord(accountId, seasonId, leagueSeasonId);

    const divisionSeason = await this.leagueRepository.findDivisionSeasonById(
      divisionSeasonId,
      leagueSeasonId,
      accountId,
    );

    if (!divisionSeason) {
      throw new NotFoundError('Division season not found');
    }

    const teamSeason = await this.getTeamSeasonForValidation(teamSeasonId, seasonId, accountId);

    if (teamSeason.leagueseason.id !== leagueSeasonId) {
      throw new NotFoundError('Team season not found');
    }

    if (teamSeason.divisionseasonid) {
      throw new ConflictError(
        'Team is already assigned to a division. Remove from current division first.',
      );
    }

    await this.leagueRepository.updateTeamSeasonDivision(teamSeasonId, divisionSeasonId);

    return true;
  }

  async removeTeamFromDivision(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
    teamSeasonId: bigint,
  ): Promise<boolean> {
    await this.ensureLeagueSeasonRecord(accountId, seasonId, leagueSeasonId);

    const teamSeason = await this.getTeamSeasonForValidation(teamSeasonId, seasonId, accountId);

    if (teamSeason.leagueseason.id !== leagueSeasonId) {
      throw new NotFoundError('Team season not found');
    }

    if (!teamSeason.divisionseasonid) {
      throw new ValidationError('Team is not currently assigned to any division');
    }

    await this.leagueRepository.updateTeamSeasonDivision(teamSeasonId, null);

    return true;
  }

  private buildCountMap(results: dbTeamSeasonCountResult[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const result of results) {
      map.set(result.teamseasonid.toString(), result.count);
    }
    return map;
  }

  private buildTeamNameMap(
    teamIds: Set<bigint>,
    teamSeasons: dbTeamSeasonWithTeam[],
  ): Map<string, string> {
    const map = new Map<string, string>();

    for (const teamSeason of teamSeasons) {
      map.set(teamSeason.id.toString(), teamSeason.name);
    }

    for (const teamId of teamIds) {
      const idString = teamId.toString();
      if (!map.has(idString)) {
        map.set(idString, `Team ${idString}`);
      }
    }

    return map;
  }

  private async ensureSeasonInAccount(accountId: bigint, seasonId: bigint): Promise<dbSeason> {
    const season = await this.seasonRepository.findSeasonById(accountId, seasonId);

    if (!season || season.accountid !== accountId) {
      throw new NotFoundError('Season not found');
    }

    return season as dbSeason;
  }

  private async ensureLeagueSeasonRecord(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
  ) {
    const leagueSeason = await this.leagueRepository.findLeagueSeasonRecord(
      leagueSeasonId,
      seasonId,
      accountId,
    );

    if (!leagueSeason) {
      throw new NotFoundError('League season not found');
    }

    return leagueSeason;
  }

  private async ensureLeagueInAccount(accountId: bigint, leagueId: bigint): Promise<dbLeague> {
    const league = await this.leagueRepository.findLeagueById(accountId, leagueId);

    if (!league) {
      throw new NotFoundError('League not found');
    }

    return league;
  }

  private async getTeamSeasonForValidation(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbTeamSeasonValidationResult> {
    const teamSeason = await this.teamRepository.findTeamSeasonForValidation(
      teamSeasonId,
      seasonId,
      accountId,
    );

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    return teamSeason;
  }
}
