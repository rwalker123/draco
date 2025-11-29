import { AnnouncementType, UpsertAnnouncementType } from '@draco/shared-schemas';
import {
  IAnnouncementRepository,
  ITeamRepository,
  RepositoryFactory,
  dbAccountAnnouncement,
  dbTeamAnnouncement,
} from '../repositories/index.js';
import {
  AnnouncementResponseFormatter,
  type AnnouncementSummaryResponse,
} from '../responseFormatters/index.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { DateUtils } from '../utils/dateUtils.js';
import { DiscordIntegrationService } from './discordIntegrationService.js';
import { BlueskyIntegrationService } from './blueskyIntegrationService.js';
import { sanitizeRichHtml } from '../utils/htmlSanitizer.js';

interface NormalizedAnnouncementPayload {
  title: string;
  body: string;
  publishedAt: Date;
  isSpecial: boolean;
}

interface AnnouncementSummaryOptions {
  includeSpecialOnly?: boolean;
  limit?: number;
}

export class AnnouncementService {
  private readonly announcementRepository: IAnnouncementRepository;
  private readonly teamRepository: ITeamRepository;
  private readonly discordIntegrationService: DiscordIntegrationService;
  private readonly blueskyIntegrationService: BlueskyIntegrationService;

  constructor(announcementRepository?: IAnnouncementRepository, teamRepository?: ITeamRepository) {
    this.announcementRepository =
      announcementRepository ?? RepositoryFactory.getAnnouncementRepository();
    this.teamRepository = teamRepository ?? RepositoryFactory.getTeamRepository();
    this.discordIntegrationService = new DiscordIntegrationService();
    this.blueskyIntegrationService = new BlueskyIntegrationService();
  }

  async listAccountAnnouncements(accountId: bigint): Promise<AnnouncementType[]> {
    const records = await this.announcementRepository.listAccountAnnouncements(accountId);
    return AnnouncementResponseFormatter.formatAccountAnnouncements(records);
  }

  async listAccountAnnouncementSummaries(
    accountId: bigint,
    options?: AnnouncementSummaryOptions,
  ): Promise<AnnouncementSummaryResponse[]> {
    const records = await this.announcementRepository.listAccountAnnouncements(accountId);
    const summaries = AnnouncementResponseFormatter.formatAccountAnnouncementSummaries(records);
    return this.filterSummaries(summaries, options);
  }

  async getAccountAnnouncement(
    accountId: bigint,
    announcementId: bigint,
  ): Promise<AnnouncementType> {
    const record = await this.requireAccountAnnouncement(accountId, announcementId);
    return AnnouncementResponseFormatter.formatAccountAnnouncement(record);
  }

  async createAccountAnnouncement(
    accountId: bigint,
    payload: UpsertAnnouncementType,
  ): Promise<AnnouncementType> {
    const normalized = this.normalizePayload(payload);

    const created = await this.announcementRepository.createAccountAnnouncement({
      accountid: accountId,
      title: normalized.title,
      text: normalized.body,
      date: normalized.publishedAt,
      specialannounce: normalized.isSpecial,
    });

    const record = await this.requireAccountAnnouncement(accountId, created.id);
    const announcement = AnnouncementResponseFormatter.formatAccountAnnouncement(record);
    void this.syncAnnouncementToDiscord(accountId, announcement);
    void this.syncAnnouncementToBluesky(accountId, announcement);
    return announcement;
  }

  async updateAccountAnnouncement(
    accountId: bigint,
    announcementId: bigint,
    payload: UpsertAnnouncementType,
  ): Promise<AnnouncementType> {
    await this.requireAccountAnnouncement(accountId, announcementId);
    const normalized = this.normalizePayload(payload);

    await this.announcementRepository.updateAccountAnnouncement(announcementId, {
      title: normalized.title,
      text: normalized.body,
      date: normalized.publishedAt,
      specialannounce: normalized.isSpecial,
    });

    const updated = await this.requireAccountAnnouncement(accountId, announcementId);
    return AnnouncementResponseFormatter.formatAccountAnnouncement(updated);
  }

  async deleteAccountAnnouncement(accountId: bigint, announcementId: bigint): Promise<void> {
    await this.requireAccountAnnouncement(accountId, announcementId);
    await this.announcementRepository.deleteAccountAnnouncement(announcementId);
  }

  async listTeamAnnouncements(accountId: bigint, teamId: bigint): Promise<AnnouncementType[]> {
    await this.ensureTeamBelongsToAccount(accountId, teamId);
    const records = await this.announcementRepository.listTeamAnnouncements(teamId);
    return AnnouncementResponseFormatter.formatTeamAnnouncements(records, accountId);
  }

  async listTeamAnnouncementSummaries(
    accountId: bigint,
    teamId: bigint,
    options?: AnnouncementSummaryOptions,
  ): Promise<AnnouncementSummaryResponse[]> {
    await this.ensureTeamBelongsToAccount(accountId, teamId);
    const records = await this.announcementRepository.listTeamAnnouncements(teamId);
    const summaries = AnnouncementResponseFormatter.formatTeamAnnouncementSummaries(
      records,
      accountId,
    );
    return this.filterSummaries(summaries, options);
  }

  async getTeamAnnouncement(
    accountId: bigint,
    teamId: bigint,
    announcementId: bigint,
  ): Promise<AnnouncementType> {
    const record = await this.requireTeamAnnouncement(accountId, teamId, announcementId);
    return AnnouncementResponseFormatter.formatTeamAnnouncement(record, accountId);
  }

  async createTeamAnnouncement(
    accountId: bigint,
    teamId: bigint,
    payload: UpsertAnnouncementType,
  ): Promise<AnnouncementType> {
    await this.ensureTeamBelongsToAccount(accountId, teamId);
    const normalized = this.normalizePayload(payload);

    const created = await this.announcementRepository.createTeamAnnouncement({
      teamid: teamId,
      title: normalized.title,
      text: normalized.body,
      date: normalized.publishedAt,
      specialannounce: normalized.isSpecial,
    });

    const record = await this.requireTeamAnnouncement(accountId, teamId, created.id);
    return AnnouncementResponseFormatter.formatTeamAnnouncement(record, accountId);
  }

  async updateTeamAnnouncement(
    accountId: bigint,
    teamId: bigint,
    announcementId: bigint,
    payload: UpsertAnnouncementType,
  ): Promise<AnnouncementType> {
    await this.requireTeamAnnouncement(accountId, teamId, announcementId);
    const normalized = this.normalizePayload(payload);

    await this.announcementRepository.updateTeamAnnouncement(announcementId, {
      title: normalized.title,
      text: normalized.body,
      date: normalized.publishedAt,
      specialannounce: normalized.isSpecial,
    });

    const updated = await this.requireTeamAnnouncement(accountId, teamId, announcementId);
    return AnnouncementResponseFormatter.formatTeamAnnouncement(updated, accountId);
  }

  async deleteTeamAnnouncement(
    accountId: bigint,
    teamId: bigint,
    announcementId: bigint,
  ): Promise<void> {
    await this.requireTeamAnnouncement(accountId, teamId, announcementId);
    await this.announcementRepository.deleteTeamAnnouncement(announcementId);
  }

  private normalizePayload(payload: UpsertAnnouncementType): NormalizedAnnouncementPayload {
    const title = payload.title.trim();
    const body = sanitizeRichHtml(payload.body).trim();

    const publishedAt = DateUtils.parseDateTimeForDatabase(payload.publishedAt);
    if (!publishedAt) {
      throw new ValidationError('publishedAt must be a valid ISO-8601 string');
    }

    return {
      title,
      body,
      publishedAt,
      isSpecial: payload.isSpecial ?? false,
    };
  }

  private async requireAccountAnnouncement(
    accountId: bigint,
    announcementId: bigint,
  ): Promise<dbAccountAnnouncement> {
    const record = await this.announcementRepository.findAccountAnnouncementById(
      announcementId,
      accountId,
    );

    if (!record) {
      throw new NotFoundError('Announcement not found');
    }

    return record;
  }

  private async requireTeamAnnouncement(
    accountId: bigint,
    teamId: bigint,
    announcementId: bigint,
  ): Promise<dbTeamAnnouncement> {
    await this.ensureTeamBelongsToAccount(accountId, teamId);
    const record = await this.announcementRepository.findTeamAnnouncementById(
      announcementId,
      teamId,
    );

    if (!record || !record.teams || record.teams.accountid !== accountId) {
      throw new NotFoundError('Team announcement not found');
    }

    return record;
  }

  private async ensureTeamBelongsToAccount(accountId: bigint, teamId: bigint) {
    const team = await this.teamRepository.findTeamDefinition(teamId);
    if (!team || team.accountid !== accountId) {
      throw new NotFoundError('Team not found');
    }
  }

  private filterSummaries<T extends { isSpecial: boolean }>(
    summaries: T[],
    options?: AnnouncementSummaryOptions,
  ): T[] {
    const includeSpecialOnly = options?.includeSpecialOnly ?? false;
    const rawLimit = options?.limit;

    const filtered = includeSpecialOnly ? summaries.filter((item) => item.isSpecial) : summaries;

    if (rawLimit === undefined) {
      return filtered;
    }

    const limit = Number.isFinite(rawLimit) ? Math.max(Math.floor(rawLimit), 0) : 0;
    if (limit <= 0 || filtered.length <= limit) {
      return filtered;
    }

    return filtered.slice(0, limit);
  }

  private async syncAnnouncementToDiscord(accountId: bigint, announcement: AnnouncementType) {
    try {
      await this.discordIntegrationService.publishAnnouncement(accountId, announcement);
    } catch (error) {
      console.error('[discord] Failed to sync announcement to Discord', {
        accountId: accountId.toString(),
        announcementId: announcement.id,
        error,
      });
    }
  }

  private async syncAnnouncementToBluesky(accountId: bigint, announcement: AnnouncementType) {
    try {
      await this.blueskyIntegrationService.publishAnnouncement(accountId, announcement);
    } catch (error) {
      console.error('[bluesky] Failed to sync announcement', {
        accountId: accountId.toString(),
        announcementId: announcement.id,
        error,
      });
    }
  }
}
