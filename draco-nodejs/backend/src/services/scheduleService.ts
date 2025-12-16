import {
  GameResultType,
  GamesWithRecapsType,
  UpsertGameType,
  UpdateGameResultsType,
  UpsertGameRecapType,
  GameType,
  EmailSendType,
  AccountSettingKey,
} from '@draco/shared-schemas';
import type { PagingType } from '@draco/shared-schemas';
import {
  IScheduleRepository,
  ScheduleListFilters,
  ScheduleListOptions,
} from '../repositories/interfaces/IScheduleRepository.js';
import { ServiceFactory } from './serviceFactory.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { ScheduleResponseFormatter } from '../responseFormatters/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/customErrors.js';
import {
  dbScheduleGameForAccount,
  dbScheduleGameWithDetails,
  dbScheduleGameWithRecaps,
  dbScheduleCreateData,
  dbScheduleUpdateData,
  dbScheduleResultUpdateData,
} from '../repositories/index.js';
import { DiscordIntegrationService } from './discordIntegrationService.js';
import { TwitterIntegrationService } from './twitterIntegrationService.js';
import { BlueskyIntegrationService } from './blueskyIntegrationService.js';
import { FacebookIntegrationService } from './facebookIntegrationService.js';
import { AccountSettingsService } from './accountSettingsService.js';
import { EmailService } from './emailService.js';
import { RosterService } from './rosterService.js';
import { AccountsService } from './accountsService.js';
import { getFrontendBaseUrlOrFallback } from '../utils/frontendBaseUrl.js';
import { getGameStatusText } from '../utils/gameStatus.js';
import { GameStatus } from '../types/gameEnums.js';
import { DateUtils } from '../utils/dateUtils.js';
import { sanitizePlainText } from '../utils/htmlSanitizer.js';

interface GameListFilters {
  startDate?: Date;
  endDate?: Date;
  teamId?: bigint;
  hasRecap?: boolean;
}

export class ScheduleService {
  private readonly scheduleRepository: IScheduleRepository;
  private readonly discordIntegrationService: DiscordIntegrationService;
  private readonly twitterIntegrationService: TwitterIntegrationService;
  private readonly blueskyIntegrationService: BlueskyIntegrationService;
  private readonly facebookIntegrationService: FacebookIntegrationService;
  private readonly accountSettingsService: AccountSettingsService;
  private readonly emailService: EmailService;
  private readonly rosterService: RosterService;
  private readonly accountsService: AccountsService;

  constructor() {
    this.scheduleRepository = RepositoryFactory.getScheduleRepository();
    this.discordIntegrationService = ServiceFactory.getDiscordIntegrationService();
    this.twitterIntegrationService = ServiceFactory.getTwitterIntegrationService();
    this.blueskyIntegrationService = ServiceFactory.getBlueskyIntegrationService();
    this.facebookIntegrationService = ServiceFactory.getFacebookIntegrationService();
    this.accountSettingsService = ServiceFactory.getAccountSettingsService();
    this.emailService = ServiceFactory.getEmailService();
    this.rosterService = ServiceFactory.getRosterService();
    this.accountsService = ServiceFactory.getAccountsService();
  }

  async updateGameResults(
    accountId: bigint,
    gameId: bigint,
    payload: UpdateGameResultsType,
    userId: string,
  ): Promise<GameResultType> {
    await this.ensureGameInAccount(gameId, accountId);

    const resultUpdateData: dbScheduleResultUpdateData = {
      hscore: payload.homeScore,
      vscore: payload.visitorScore,
      gamestatus: payload.gameStatus,
    };

    const updatedGame = await this.scheduleRepository.updateGameResults(gameId, resultUpdateData);

    void this.syncGameResultToSocial(accountId, updatedGame);
    void this.syncGameResultToEmail(accountId, updatedGame, userId);

    return ScheduleResponseFormatter.formatGameResult(updatedGame);
  }

  private async syncGameResultToSocial(
    accountId: bigint,
    game: dbScheduleGameWithDetails,
  ): Promise<void> {
    try {
      const teamIds: bigint[] = [];
      if (game.hteamid !== undefined && game.hteamid !== null) {
        teamIds.push(game.hteamid);
      }
      if (game.vteamid !== undefined && game.vteamid !== null) {
        teamIds.push(game.vteamid);
      }

      const teamNames = teamIds.length
        ? await this.scheduleRepository.getTeamNames(teamIds)
        : new Map<string, string>();

      const payload = {
        gameId: game.id,
        gameDate: game.gamedate ?? undefined,
        gameStatus: game.gamestatus ?? undefined,
        homeScore: game.hscore ?? undefined,
        visitorScore: game.vscore ?? undefined,
        homeTeamName:
          game.hteamid !== undefined && game.hteamid !== null
            ? (teamNames.get(game.hteamid.toString()) ?? undefined)
            : undefined,
        visitorTeamName:
          game.vteamid !== undefined && game.vteamid !== null
            ? (teamNames.get(game.vteamid.toString()) ?? undefined)
            : undefined,
        leagueName: game.leagueseason?.league?.name ?? undefined,
        seasonName: game.leagueseason?.season?.name ?? undefined,
      };

      const results = await Promise.allSettled([
        this.discordIntegrationService.publishGameResult(accountId, payload),
        this.twitterIntegrationService.publishGameResult(accountId, payload),
        this.blueskyIntegrationService.publishGameResult(accountId, payload),
        this.facebookIntegrationService.publishGameResult(accountId, payload),
      ]);

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const target = ['discord', 'twitter', 'bluesky', 'facebook'][index] ?? 'social';
          console.error(`[${target}] Failed to sync game result`, {
            accountId: accountId.toString(),
            gameId: game.id.toString(),
            error: result.reason,
          });
        }
      });
    } catch (error) {
      console.error('[social] Failed to sync game result', {
        accountId: accountId.toString(),
        gameId: game.id.toString(),
        error,
      });
    }
  }

  private async syncGameResultToEmail(
    accountId: bigint,
    game: dbScheduleGameWithDetails,
    userId: string,
  ): Promise<void> {
    try {
      const isEnabled = await this.isSettingEnabled(accountId, 'EmailGameResultsToTeams');
      if (!isEnabled) {
        return;
      }

      const seasonId = game.leagueseason?.season?.id;
      if (!seasonId) {
        return;
      }

      const teamIds: bigint[] = [];
      if (game.hteamid !== undefined && game.hteamid !== null) {
        teamIds.push(game.hteamid);
      }
      if (game.vteamid !== undefined && game.vteamid !== null) {
        teamIds.push(game.vteamid);
      }

      if (!teamIds.length) {
        return;
      }

      const teamNames = await this.scheduleRepository.getTeamNames(teamIds);
      const recipients = await this.resolveActiveRosterRecipients(teamIds, seasonId, accountId);

      if (!recipients.length) {
        return;
      }

      const accountHeader = await this.accountsService.getAccountHeader(accountId);
      const baseUrl = getFrontendBaseUrlOrFallback();
      const homeTeamName = (game.hteamid && teamNames.get(game.hteamid.toString())) || 'Home Team';
      const visitorTeamName =
        (game.vteamid && teamNames.get(game.vteamid.toString())) || 'Visitor Team';
      const scoreLine = `${homeTeamName} ${game.hscore ?? '-'} - ${game.vscore ?? '-'} ${visitorTeamName}`;
      const statusLine = getGameStatusText(Number(game.gamestatus ?? GameStatus.Scheduled));
      const gameDate = game.gamedate
        ? (DateUtils.formatMonthDayWithOrdinal(game.gamedate, 'UTC') ?? undefined)
        : undefined;
      const scheduleUrl = `${baseUrl}/account/${accountHeader.id}/schedule`;

      const subject = `${accountHeader.name} - ${scoreLine} (${statusLine})`;
      const body = this.buildGameResultEmailHtml({
        accountName: accountHeader.name,
        headerLine: `${homeTeamName} vs ${visitorTeamName}`,
        statusLine,
        scoreLine,
        gameDate,
        scheduleUrl,
      });

      const emailRequest: EmailSendType = {
        subject,
        body,
        recipients: {
          contacts: recipients.map((recipient) => recipient.contactId.toString()),
        },
      };

      await this.emailService.composeAndSendEmailFromUser(accountId, userId, emailRequest, {
        isSystemEmail: true,
      });
    } catch (error) {
      console.error('[email] Failed to send game result email', {
        accountId: accountId.toString(),
        gameId: game.id.toString(),
        error,
      });
    }
  }

  private buildGameResultEmailHtml(options: {
    accountName: string;
    headerLine: string;
    statusLine: string;
    scoreLine: string;
    gameDate?: string;
    scheduleUrl: string;
  }): string {
    const { accountName, headerLine, statusLine, scoreLine, gameDate, scheduleUrl } = options;

    const safeAccountName = sanitizePlainText(accountName);
    const safeHeaderLine = sanitizePlainText(headerLine);
    const safeStatusLine = sanitizePlainText(statusLine);
    const safeScoreLine = sanitizePlainText(scoreLine);
    const safeGameDate = gameDate ? sanitizePlainText(gameDate) : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Game Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${safeAccountName}</h1>
          </div>
          <div class="content">
            <h2>Game Status Update</h2>
            <p>${safeHeaderLine}</p>
            <h3>${safeStatusLine}</h3>
            <p><strong>${safeScoreLine}</strong></p>
            ${safeGameDate ? `<p>${safeGameDate}</p>` : ''}
            <p>Use the button below to view the full schedule.</p>
            <a href="${scheduleUrl}" class="button">View Schedule</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${scheduleUrl}</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ezRecSports.com. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async resolveActiveRosterRecipients(
    teamIds: bigint[],
    seasonId: bigint,
    accountId: bigint,
  ): Promise<
    Array<{
      contactId: bigint;
      emailAddress: string;
      contactName: string;
    }>
  > {
    const recipients = new Map<
      string,
      { contactId: bigint; emailAddress: string; contactName: string }
    >();

    for (const teamId of teamIds) {
      const roster = await this.rosterService.getTeamRosterMembers(teamId, seasonId, accountId);
      roster.rosterMembers
        .filter((member) => !member.inactive)
        .forEach((member) => {
          const contactId = member.player.contact.id;
          const email = member.player.contact.email;
          if (!email || !contactId) {
            return;
          }

          const contactName =
            [member.player.contact.firstName, member.player.contact.lastName]
              .filter(Boolean)
              .join(' ')
              .trim() || 'Team member';

          const contactKey = contactId.toString();
          if (!recipients.has(contactKey)) {
            recipients.set(contactKey, {
              contactId: BigInt(contactId),
              emailAddress: email,
              contactName,
            });
          }
        });
    }

    return Array.from(recipients.values());
  }

  private async isSettingEnabled(accountId: bigint, key: AccountSettingKey): Promise<boolean> {
    try {
      const settings = await this.accountSettingsService.getAccountSettings(accountId);
      const match = settings.find((setting) => setting.definition.key === key);
      return Boolean(match?.value);
    } catch (error) {
      console.error('[settings] Failed to resolve account setting', {
        accountId: accountId.toString(),
        key,
        error,
      });
      return false;
    }
  }

  async listSeasonGames(
    seasonId: bigint,
    pagination: PagingType,
    filters: GameListFilters,
  ): Promise<GamesWithRecapsType> {
    const scheduleFilters: ScheduleListFilters = {};

    if (filters.startDate || filters.endDate) {
      const dateRange: ScheduleListFilters['dateRange'] = {};

      if (filters.startDate) {
        dateRange.start = filters.startDate;
      }

      if (filters.endDate) {
        dateRange.end = filters.endDate;
      }

      if (dateRange.start || dateRange.end) {
        scheduleFilters.dateRange = dateRange;
      }
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
      return '';
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
}
