import { UpsertWelcomeMessageType, WelcomeMessageType } from '@draco/shared-schemas';
import {
  RepositoryFactory,
  IWelcomeMessageRepository,
  ITeamRepository,
} from '../repositories/index.js';
import { WelcomeMessageResponseFormatter } from '../responseFormatters/index.js';
import { dbTeamSeasonAccount } from '../repositories/types/dbTypes.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { sanitizeRichHtml } from '../utils/htmlSanitizer.js';

interface NormalizedWelcomeMessagePayload {
  caption: string;
  order: number;
  bodyHtml: string;
}

interface TeamContext {
  teamId: bigint;
  seasonId: bigint;
}

export class WelcomeMessageService {
  private readonly welcomeMessageRepository: IWelcomeMessageRepository;
  private readonly teamRepository: ITeamRepository;

  constructor(
    welcomeMessageRepository?: IWelcomeMessageRepository,
    teamRepository?: ITeamRepository,
  ) {
    this.welcomeMessageRepository =
      welcomeMessageRepository ?? RepositoryFactory.getWelcomeMessageRepository();
    this.teamRepository = teamRepository ?? RepositoryFactory.getTeamRepository();
  }

  async listAccountMessages(accountId: bigint): Promise<WelcomeMessageType[]> {
    const records = await this.welcomeMessageRepository.listAccountMessages(accountId);
    return WelcomeMessageResponseFormatter.formatMany(records);
  }

  async getAccountMessage(accountId: bigint, messageId: bigint): Promise<WelcomeMessageType> {
    const record = await this.welcomeMessageRepository.findAccountMessage(accountId, messageId);
    if (!record) {
      throw new NotFoundError('Welcome message not found');
    }

    return WelcomeMessageResponseFormatter.format(record);
  }

  async createAccountMessage(
    accountId: bigint,
    payload: UpsertWelcomeMessageType,
  ): Promise<WelcomeMessageType> {
    const normalized = this.normalizePayload(payload);
    const created = await this.welcomeMessageRepository.createMessage({
      accountid: accountId,
      teamid: null,
      captionmenu: normalized.caption,
      orderno: normalized.order,
      welcometext: normalized.bodyHtml,
    });

    return WelcomeMessageResponseFormatter.format(created);
  }

  async updateAccountMessage(
    accountId: bigint,
    messageId: bigint,
    payload: UpsertWelcomeMessageType,
  ): Promise<WelcomeMessageType> {
    await this.getAccountMessage(accountId, messageId);
    const normalized = this.normalizePayload(payload);
    const updated = await this.welcomeMessageRepository.updateMessage(messageId, {
      captionmenu: normalized.caption,
      orderno: normalized.order,
      welcometext: normalized.bodyHtml,
    });

    return WelcomeMessageResponseFormatter.format(updated);
  }

  async deleteAccountMessage(accountId: bigint, messageId: bigint): Promise<void> {
    await this.getAccountMessage(accountId, messageId);
    await this.welcomeMessageRepository.deleteMessage(messageId);
  }

  async listTeamMessages(
    accountId: bigint,
    teamSeasonId: bigint,
    context?: TeamContext,
  ): Promise<WelcomeMessageType[]> {
    const resolved = context ?? (await this.resolveTeamContext(accountId, teamSeasonId));
    const records = await this.welcomeMessageRepository.listTeamMessages(resolved.teamId);
    return WelcomeMessageResponseFormatter.formatMany(records);
  }

  async getTeamMessage(
    accountId: bigint,
    teamSeasonId: bigint,
    messageId: bigint,
    context?: TeamContext,
  ): Promise<WelcomeMessageType> {
    const resolved = context ?? (await this.resolveTeamContext(accountId, teamSeasonId));
    const record = await this.welcomeMessageRepository.findTeamMessage(resolved.teamId, messageId);
    if (!record) {
      throw new NotFoundError('Welcome message not found');
    }

    return WelcomeMessageResponseFormatter.format(record);
  }

  async createTeamMessage(
    accountId: bigint,
    teamSeasonId: bigint,
    payload: UpsertWelcomeMessageType,
    context?: TeamContext,
  ): Promise<WelcomeMessageType> {
    const resolved = context ?? (await this.resolveTeamContext(accountId, teamSeasonId));
    const normalized = this.normalizePayload(payload);
    const created = await this.welcomeMessageRepository.createMessage({
      accountid: accountId,
      teamid: resolved.teamId,
      captionmenu: normalized.caption,
      orderno: normalized.order,
      welcometext: normalized.bodyHtml,
    });

    return WelcomeMessageResponseFormatter.format(created);
  }

  async updateTeamMessage(
    accountId: bigint,
    teamSeasonId: bigint,
    messageId: bigint,
    payload: UpsertWelcomeMessageType,
    context?: TeamContext,
  ): Promise<WelcomeMessageType> {
    const resolved = context ?? (await this.resolveTeamContext(accountId, teamSeasonId));
    await this.ensureTeamMessage(resolved.teamId, messageId);
    const normalized = this.normalizePayload(payload);
    const updated = await this.welcomeMessageRepository.updateMessage(messageId, {
      captionmenu: normalized.caption,
      orderno: normalized.order,
      welcometext: normalized.bodyHtml,
    });

    return WelcomeMessageResponseFormatter.format(updated);
  }

  async deleteTeamMessage(
    accountId: bigint,
    teamSeasonId: bigint,
    messageId: bigint,
    context?: TeamContext,
  ): Promise<void> {
    const resolved = context ?? (await this.resolveTeamContext(accountId, teamSeasonId));
    await this.ensureTeamMessage(resolved.teamId, messageId);
    await this.welcomeMessageRepository.deleteMessage(messageId);
  }

  async resolveTeamContext(accountId: bigint, teamSeasonId: bigint): Promise<TeamContext> {
    const teamSeason = await this.teamRepository.findTeamSeasonWithAccount(teamSeasonId);
    if (!teamSeason) {
      throw new NotFoundError('Team not found');
    }

    if (!this.teamBelongsToAccount(teamSeason, accountId)) {
      throw new NotFoundError('Team not found');
    }

    const seasonId = teamSeason.leagueseason?.seasonid;
    if (!seasonId) {
      throw new NotFoundError('Season not found for team');
    }

    return {
      teamId: teamSeason.teamid,
      seasonId,
    };
  }

  private async ensureTeamMessage(teamId: bigint, messageId: bigint): Promise<void> {
    const record = await this.welcomeMessageRepository.findTeamMessage(teamId, messageId);
    if (!record) {
      throw new NotFoundError('Welcome message not found');
    }
  }

  private normalizePayload(payload: UpsertWelcomeMessageType): NormalizedWelcomeMessagePayload {
    const caption = payload.caption.trim();
    const order = payload.order;
    const bodyHtml = sanitizeRichHtml(payload.bodyHtml);

    if (!bodyHtml) {
      throw new ValidationError('Body content is required');
    }

    return { caption, order, bodyHtml };
  }

  private teamBelongsToAccount(teamSeason: dbTeamSeasonAccount, accountId: bigint): boolean {
    const teamAccountId = teamSeason.teams?.accountid;
    if (teamAccountId && teamAccountId !== accountId) {
      return false;
    }

    const leagueAccountId = teamSeason.leagueseason?.league?.accountid;
    return leagueAccountId === accountId;
  }
}
