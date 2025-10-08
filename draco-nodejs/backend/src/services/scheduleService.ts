import {
  GameResultType,
  GamesWithRecapsType,
  UpsertGameType,
  UpdateGameResultsType,
  UpsertGameRecapType,
  GameType,
} from '@draco/shared-schemas';
import type { PagingType } from '@draco/shared-schemas';
import {
  IScheduleRepository,
  ScheduleListFilters,
  ScheduleListOptions,
} from '../repositories/interfaces/IScheduleRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { ScheduleResponseFormatter } from '../responseFormatters/index.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  AuthorizationError,
} from '../utils/customErrors.js';
import { ServiceFactory } from './serviceFactory.js';
import { IRoleQuery } from './interfaces/roleInterfaces.js';
import { ContactService } from './contactService.js';
import { ITeamRepository } from '../repositories/interfaces/index.js';
import {
  dbScheduleGameForAccount,
  dbScheduleGameWithDetails,
  dbScheduleGameWithRecaps,
  dbScheduleCreateData,
  dbScheduleUpdateData,
  dbScheduleResultUpdateData,
} from '../repositories/index.js';

interface GameListFilters {
  startDate?: Date;
  endDate?: Date;
  teamId?: bigint;
  hasRecap?: boolean;
}

export class ScheduleService {
  private readonly scheduleRepository: IScheduleRepository;
  private readonly teamRepository: ITeamRepository;
  private readonly roleService: IRoleQuery;
  private readonly contactService: ContactService;

  constructor() {
    this.scheduleRepository = RepositoryFactory.getScheduleRepository();
    this.teamRepository = RepositoryFactory.getTeamRepository();
    this.roleService = ServiceFactory.getRoleQuery();
    this.contactService = ServiceFactory.getContactService();
  }

  async updateGameResults(
    accountId: bigint,
    gameId: bigint,
    payload: UpdateGameResultsType,
  ): Promise<GameResultType> {
    await this.ensureGameInAccount(gameId, accountId);

    const resultUpdateData: dbScheduleResultUpdateData = {
      hscore: payload.homeScore,
      vscore: payload.visitorScore,
      gamestatus: payload.gameStatus,
    };

    const updatedGame = await this.scheduleRepository.updateGameResults(gameId, resultUpdateData);

    return ScheduleResponseFormatter.formatGameResult(updatedGame);
  }

  async listSeasonGames(
    seasonId: bigint,
    pagination: PagingType,
    filters: GameListFilters,
  ): Promise<GamesWithRecapsType> {
    const scheduleFilters: ScheduleListFilters = {};

    if (filters.startDate && filters.endDate) {
      scheduleFilters.dateRange = {
        start: filters.startDate,
        end: filters.endDate,
      };
    }

    if (filters.teamId) {
      scheduleFilters.teamId = filters.teamId;
    }

    if (filters.hasRecap) {
      scheduleFilters.includeRecaps = true;
    }

    const listOptions: ScheduleListOptions = {
      skip: pagination.skip,
      take: pagination.limit,
      sortOrder: pagination.sortOrder,
    };

    const [total, games] = await Promise.all([
      this.scheduleRepository.countSeasonGames(seasonId, scheduleFilters),
      this.scheduleRepository.listSeasonGames(seasonId, scheduleFilters, listOptions),
    ]);

    const gamesArray = games as dbScheduleGameWithDetails[];

    const teamIds = new Set<bigint>();
    for (const game of gamesArray) {
      teamIds.add(game.hteamid);
      teamIds.add(game.vteamid);
    }

    const teamNames = await this.scheduleRepository.getTeamNames(Array.from(teamIds));

    let formattedGames: GamesWithRecapsType['games'];

    if (filters.hasRecap) {
      const gamesWithRecaps = (games as dbScheduleGameWithRecaps[]).filter(
        (game) => game.gamerecap && game.gamerecap.length,
      );

      formattedGames = gamesWithRecaps.map((game) =>
        ScheduleResponseFormatter.formatGameWithRecaps(game, teamNames),
      );
    } else {
      formattedGames = ScheduleResponseFormatter.formatGamesList(gamesArray, teamNames);
    }

    return {
      games: formattedGames,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
      },
    };
  }

  async createGame(
    accountId: bigint,
    seasonId: bigint,
    payload: UpsertGameType,
  ): Promise<GameType> {
    const leagueSeasonId = BigInt(payload.leagueSeasonId);
    const homeTeamId = BigInt(payload.homeTeam.id);
    const visitorTeamId = BigInt(payload.visitorTeam.id);

    await this.validateTeamsBelongToLeagueSeason(leagueSeasonId, seasonId, [
      homeTeamId,
      visitorTeamId,
    ]);

    const gameDate = this.parseGameDate(payload.gameDate);

    const fieldId = payload.field?.id ? BigInt(payload.field.id) : undefined;

    if (fieldId) {
      const conflict = await this.scheduleRepository.findFieldConflict(
        fieldId,
        gameDate,
        leagueSeasonId,
      );

      if (conflict) {
        throw new ConflictError('Field is already booked for this date and time');
      }
    }

    const createData: dbScheduleCreateData = {
      gamedate: gameDate,
      hteamid: homeTeamId,
      vteamid: visitorTeamId,
      hscore: 0,
      vscore: 0,
      comment: payload.comment ?? '',
      leagueid: leagueSeasonId,
      gamestatus: 0,
      gametype: payload.gameType,
    };

    if (fieldId !== undefined) {
      createData.fieldid = fieldId;
    }

    const umpire1Value = this.mapOptionalContact(payload.umpire1);
    if (umpire1Value !== undefined) {
      createData.umpire1 = umpire1Value;
    }

    const umpire2Value = this.mapOptionalContact(payload.umpire2);
    if (umpire2Value !== undefined) {
      createData.umpire2 = umpire2Value;
    }

    const umpire3Value = this.mapOptionalContact(payload.umpire3);
    if (umpire3Value !== undefined) {
      createData.umpire3 = umpire3Value;
    }

    const umpire4Value = this.mapOptionalContact(payload.umpire4);
    if (umpire4Value !== undefined) {
      createData.umpire4 = umpire4Value;
    }

    const createdGame = await this.scheduleRepository.createGame(createData);

    return ScheduleResponseFormatter.formatGame(createdGame);
  }

  async updateGame(
    accountId: bigint,
    seasonId: bigint,
    gameId: bigint,
    payload: UpsertGameType,
  ): Promise<GameType> {
    const existingGame = await this.ensureGameInAccount(gameId, accountId);

    if (existingGame.leagueseason.seasonid !== seasonId) {
      throw new NotFoundError('Game not found');
    }

    const homeTeamId = payload.homeTeam?.id ? BigInt(payload.homeTeam.id) : undefined;
    const visitorTeamId = payload.visitorTeam?.id ? BigInt(payload.visitorTeam.id) : undefined;

    if (homeTeamId && visitorTeamId && homeTeamId === visitorTeamId) {
      throw new ValidationError('Home team and visitor team cannot be the same');
    }

    if (homeTeamId && visitorTeamId) {
      await this.validateTeamsBelongToLeagueSeason(existingGame.leagueid, seasonId, [
        homeTeamId,
        visitorTeamId,
      ]);
    }

    const fieldId = payload.field?.id ? BigInt(payload.field.id) : undefined;
    const fieldChanged = payload.field !== undefined && fieldId !== existingGame.fieldid;

    if (fieldChanged && fieldId) {
      const gameDate = payload.gameDate
        ? this.parseGameDate(payload.gameDate)
        : existingGame.gamedate;
      const conflict = await this.scheduleRepository.findFieldConflict(
        fieldId,
        gameDate,
        existingGame.leagueid,
        gameId,
      );

      if (conflict) {
        throw new ConflictError('Field is already booked for this date and time');
      }
    }

    const updateData: dbScheduleUpdateData = {};

    if (payload.gameDate) {
      updateData.gamedate = this.parseGameDate(payload.gameDate);
    }

    if (homeTeamId !== undefined) {
      updateData.hteamid = homeTeamId;
    }

    if (visitorTeamId !== undefined) {
      updateData.vteamid = visitorTeamId;
    }

    if (payload.comment !== undefined) {
      updateData.comment = payload.comment;
    }

    if (payload.field !== undefined) {
      if (payload.field === null) {
        updateData.fieldid = null;
      } else if (fieldId !== undefined) {
        updateData.fieldid = fieldId;
      }
    }

    if (payload.gameStatus !== undefined) {
      updateData.gamestatus = payload.gameStatus;
    }

    updateData.gametype = payload.gameType;

    const updatedUmpire1 = this.mapOptionalContact(payload.umpire1);
    if (updatedUmpire1 !== undefined) {
      updateData.umpire1 = updatedUmpire1;
    }

    const updatedUmpire2 = this.mapOptionalContact(payload.umpire2);
    if (updatedUmpire2 !== undefined) {
      updateData.umpire2 = updatedUmpire2;
    }

    const updatedUmpire3 = this.mapOptionalContact(payload.umpire3);
    if (updatedUmpire3 !== undefined) {
      updateData.umpire3 = updatedUmpire3;
    }

    const updatedUmpire4 = this.mapOptionalContact(payload.umpire4);
    if (updatedUmpire4 !== undefined) {
      updateData.umpire4 = updatedUmpire4;
    }

    const updatedGame = await this.scheduleRepository.updateGame(gameId, updateData);

    return ScheduleResponseFormatter.formatGame(updatedGame);
  }

  async deleteGame(accountId: bigint, seasonId: bigint, gameId: bigint): Promise<boolean> {
    const existingGame = await this.ensureGameInAccount(gameId, accountId);

    if (existingGame.leagueseason.seasonid !== seasonId) {
      throw new NotFoundError('Game not found');
    }

    await this.scheduleRepository.deleteGame(gameId);
    return true;
  }

  async getGameRecap(
    accountId: bigint,
    seasonId: bigint,
    gameId: bigint,
    teamSeasonId: bigint,
  ): Promise<string> {
    const game = await this.ensureGameInAccount(gameId, accountId);

    if (game.leagueseason.seasonid !== seasonId) {
      throw new NotFoundError('Game not found');
    }

    this.ensureTeamInGame(game, teamSeasonId);

    const recap = await this.scheduleRepository.findRecap(gameId, teamSeasonId);
    if (!recap) {
      throw new NotFoundError('No recap found for this team');
    }

    return recap.recap;
  }

  async upsertGameRecap(
    accountId: bigint,
    seasonId: bigint,
    gameId: bigint,
    teamSeasonId: bigint,
    userId: string,
    payload: UpsertGameRecapType,
  ): Promise<string> {
    const game = await this.ensureGameInAccount(gameId, accountId);

    if (game.leagueseason.seasonid !== seasonId) {
      throw new ValidationError('Game does not belong to specified account/season');
    }

    this.ensureTeamInGame(game, teamSeasonId);

    const hasRights = await this.userHasTeamRecapRights(userId, accountId, teamSeasonId, seasonId);
    if (!hasRights) {
      throw new AuthorizationError('Not authorized for this team in this game');
    }

    const recap = await this.scheduleRepository.upsertRecap(gameId, teamSeasonId, payload.recap);
    return recap.recap;
  }

  private async validateTeamsBelongToLeagueSeason(
    leagueSeasonId: bigint,
    seasonId: bigint,
    teamIds: bigint[],
  ): Promise<void> {
    const teams = await this.scheduleRepository.findTeamsInLeagueSeason(
      leagueSeasonId,
      seasonId,
      teamIds,
    );

    if (teams.length !== teamIds.length) {
      throw new ValidationError('Both teams must be in the specified league season');
    }
  }

  private async ensureGameInAccount(
    gameId: bigint,
    accountId: bigint,
  ): Promise<dbScheduleGameForAccount> {
    const game = await this.scheduleRepository.findGameWithAccountContext(gameId, accountId);
    if (!game) {
      throw new NotFoundError('Game not found');
    }
    return game;
  }

  private ensureTeamInGame(game: dbScheduleGameForAccount, teamSeasonId: bigint): void {
    if (game.hteamid !== teamSeasonId && game.vteamid !== teamSeasonId) {
      throw new ValidationError('Invalid teamSeasonId for this game');
    }
  }

  private mapOptionalContact(contact?: { id: string } | null): bigint | null | undefined {
    if (contact === undefined) {
      return undefined;
    }
    if (contact === null) {
      return null;
    }
    return BigInt(contact.id);
  }

  private parseGameDate(dateString: string): Date {
    const parsed = new Date(dateString);
    const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(dateString);
    if (Number.isNaN(parsed.getTime()) || !hasTimezone) {
      throw new ValidationError('Invalid date format. Expected ISO 8601 datetime with timezone');
    }

    return parsed;
  }

  private async userHasTeamRecapRights(
    userId: string,
    accountId: bigint,
    teamSeasonId: bigint,
    seasonId: bigint,
  ): Promise<boolean> {
    const userRoles = await this.roleService.getUserRoles(userId, accountId);
    const isTeamAdmin = userRoles.contactRoles.some(
      (role) =>
        role.roleId === 'TeamAdmin' && role.roleData?.toString() === teamSeasonId.toString(),
    );
    if (isTeamAdmin) {
      return true;
    }

    const contact = await this.contactService.getContactByUserId(userId, accountId);
    if (!contact) {
      return false;
    }

    const teamManager = await this.teamRepository.findTeamManager(
      BigInt(contact.id),
      teamSeasonId,
      seasonId,
    );

    return Boolean(teamManager);
  }
}
