import { Prisma } from '#prisma/client';
import {
  ISocialContentRepository,
  ILiveEventRepository,
  RepositoryFactory,
  SocialFeedQuery,
  SocialVideoQuery,
  CommunityMessageQuery,
} from '../repositories/index.js';
import type { dbLiveEvent } from '../repositories/types/dbTypes.js';
import {
  SocialFeedResponseFormatter,
  LiveEventResponseFormatter,
} from '../responseFormatters/index.js';
import type {
  SocialFeedItemType,
  SocialVideoType,
  CommunityMessagePreviewType,
  CommunityChannelType,
  CommunityChannelQueryType,
  LiveEventType,
  LiveEventStatusType,
  LiveEventCreateType,
  LiveEventUpdateType,
  SocialFeedQueryType,
  SocialVideoQueryType,
  CommunityMessageQueryType,
  LiveEventQueryType,
} from '@draco/shared-schemas';
import { DiscordIntegrationService } from './discordIntegrationService.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { ServiceFactory } from './serviceFactory.js';

type LiveEventMutationPayload = LiveEventCreateType | LiveEventUpdateType;
type LiveEventIdField = 'leagueEventId' | 'leagueSeasonId' | 'teamSeasonId';
type HydratedLiveEventPayload = Partial<{
  [K in keyof LiveEventMutationPayload]: K extends LiveEventIdField
    ? bigint
    : K extends 'startsAt'
      ? Date
      : LiveEventMutationPayload[K];
}>;

export class SocialHubService {
  private readonly socialContentRepository: ISocialContentRepository;
  private readonly liveEventRepository: ILiveEventRepository;
  private readonly discordIntegrationService: DiscordIntegrationService;

  constructor() {
    this.socialContentRepository = RepositoryFactory.getSocialContentRepository();
    this.liveEventRepository = RepositoryFactory.getLiveEventRepository();
    this.discordIntegrationService = ServiceFactory.getDiscordIntegrationService();
  }

  async listFeedItems(
    accountId: bigint,
    seasonId: bigint,
    query?: SocialFeedQueryType,
  ): Promise<SocialFeedItemType[]> {
    const repositoryQuery: SocialFeedQuery = {
      accountId,
      seasonId,
      teamId: toOptionalBigInt(query?.teamId),
      teamSeasonId: toOptionalBigInt(query?.teamSeasonId),
      sources: query?.sources,
      before: toOptionalDate(query?.before),
      limit: query?.limit,
    };

    const records = await this.socialContentRepository.listFeedItems({
      ...repositoryQuery,
      includeDeleted: query?.includeDeleted ?? false,
    });
    return SocialFeedResponseFormatter.formatFeedItems(records);
  }

  async deleteFeedItem(accountId: bigint, seasonId: bigint, feedItemId: string): Promise<void> {
    const deletedCount = await this.socialContentRepository.deleteFeedItem({
      id: feedItemId,
      accountId,
      seasonId,
    });

    if (deletedCount === 0) {
      throw new NotFoundError('Social feed item not found');
    }
  }

  async restoreFeedItem(accountId: bigint, seasonId: bigint, feedItemId: string): Promise<void> {
    const restored = await this.socialContentRepository.restoreFeedItem({
      id: feedItemId,
      accountId,
      seasonId,
    });

    if (restored === 0) {
      throw new NotFoundError('Social feed item not found');
    }
  }

  async listVideos(accountId: bigint, query?: SocialVideoQueryType): Promise<SocialVideoType[]> {
    const repositoryQuery: SocialVideoQuery = {
      accountId,
      teamId: toOptionalBigInt(query?.teamId),
      liveOnly: query?.liveOnly,
      accountOnly: query?.accountOnly,
      limit: query?.limit,
    };

    const records = await this.socialContentRepository.listVideos(repositoryQuery);
    return SocialFeedResponseFormatter.formatVideos(records);
  }

  async listCommunityMessages(
    accountId: bigint,
    seasonId: bigint,
    query?: CommunityMessageQueryType,
    options?: { userId?: string | null },
  ): Promise<CommunityMessagePreviewType[]> {
    const allowedChannels = await this.discordIntegrationService.listCommunityChannels(
      accountId,
      seasonId,
      query?.teamSeasonId ? { teamSeasonId: query.teamSeasonId } : undefined,
      { userId: options?.userId },
    );

    if (!allowedChannels.length) {
      return [];
    }

    const allowedChannelIds = new Set(
      allowedChannels.map((channel) => channel.discordChannelId).filter(Boolean),
    );
    const requestedChannelIds = query?.channelIds?.length
      ? query.channelIds.filter((channelId) => allowedChannelIds.has(channelId))
      : undefined;

    if (requestedChannelIds && requestedChannelIds.length === 0) {
      return [];
    }

    const resolvedChannelIds = requestedChannelIds
      ? requestedChannelIds
      : Array.from(allowedChannelIds);

    if (!resolvedChannelIds.length) {
      return [];
    }

    const perChannelLimit = query?.limit;
    const aggregated: CommunityMessagePreviewType[] = [];

    for (const channel of allowedChannels) {
      if (!resolvedChannelIds.includes(channel.discordChannelId)) {
        continue;
      }
      const targetTeamSeasonId =
        toOptionalBigInt(query?.teamSeasonId) ??
        (channel.teamSeasonId ? BigInt(channel.teamSeasonId) : undefined);
      const repositoryQuery: CommunityMessageQuery = {
        accountId,
        seasonId,
        teamSeasonId: targetTeamSeasonId,
        channelIds: [channel.discordChannelId],
        limit: perChannelLimit,
      };

      let records = await this.socialContentRepository.listCommunityMessages(repositoryQuery);

      if (records.length) {
        aggregated.push(...SocialFeedResponseFormatter.formatCommunityMessages(records));
      }
    }

    // Preserve per-channel order (already desc per channel); overall order not guaranteed.
    return aggregated;
  }

  async listCommunityChannels(
    accountId: bigint,
    seasonId: bigint,
    query?: CommunityChannelQueryType,
    options?: { userId?: string | null },
  ): Promise<CommunityChannelType[]> {
    return this.discordIntegrationService.listCommunityChannels(
      accountId,
      seasonId,
      query,
      options,
    );
  }

  async listLiveEvents(
    accountId: bigint,
    seasonId: bigint,
    query?: LiveEventQueryType,
  ): Promise<LiveEventType[]> {
    const records = await this.liveEventRepository.listLiveEvents({
      accountId,
      seasonId,
      teamSeasonId: toOptionalBigInt(query?.teamSeasonId),
      status: query?.status as LiveEventStatusType[] | undefined,
      featuredOnly: query?.featuredOnly,
    });

    return LiveEventResponseFormatter.format(records);
  }

  async getLiveEvent(
    accountId: bigint,
    seasonId: bigint,
    liveEventId: bigint,
  ): Promise<LiveEventType> {
    const record = await this.liveEventRepository.findLiveEventById(
      accountId,
      seasonId,
      liveEventId,
    );

    if (!record) {
      throw new NotFoundError('Live event not found');
    }

    return LiveEventResponseFormatter.formatOne(record);
  }

  async createLiveEvent(
    accountId: bigint,
    seasonId: bigint,
    payload: LiveEventCreateType,
  ): Promise<LiveEventType> {
    const mappedPayload = mapLiveEventPayload(payload);
    const title = SocialHubService.requireTitle(mappedPayload);
    const leagueEventId = await this.resolveLeagueEventId(accountId, seasonId, mappedPayload);

    if (mappedPayload.teamSeasonId) {
      await this.liveEventRepository.ensureTeamSeasonAccess(
        accountId,
        seasonId,
        mappedPayload.teamSeasonId,
      );
    }

    const created = await this.liveEventRepository.createLiveEventDetails({
      leagueeventid: leagueEventId,
      teamseasonid: mappedPayload.teamSeasonId ?? null,
      title,
      description: mappedPayload.description ?? null,
      streamplatform: mappedPayload.streamPlatform ?? null,
      streamurl: mappedPayload.streamUrl ?? null,
      discordchannelid: mappedPayload.discordChannelId ?? null,
      location: mappedPayload.location ?? null,
      status: mappedPayload.status ?? 'upcoming',
      featured: mappedPayload.featured ?? false,
    });

    return this.getLiveEvent(accountId, seasonId, created.id);
  }

  async updateLiveEvent(
    accountId: bigint,
    seasonId: bigint,
    liveEventId: bigint,
    payload: LiveEventUpdateType,
  ): Promise<LiveEventType> {
    const mappedPayload = mapLiveEventPayload(payload);
    const existing = await this.requireLiveEvent(accountId, seasonId, liveEventId);

    if (mappedPayload.leagueSeasonId) {
      await this.liveEventRepository.ensureLeagueSeasonAccess(
        accountId,
        seasonId,
        mappedPayload.leagueSeasonId,
      );
    }

    if (mappedPayload.teamSeasonId) {
      await this.liveEventRepository.ensureTeamSeasonAccess(
        accountId,
        seasonId,
        mappedPayload.teamSeasonId,
      );
    }

    const updatedLeagueEventData: Prisma.leagueeventsUncheckedUpdateInput = {};
    if (mappedPayload.leagueSeasonId) {
      updatedLeagueEventData.leagueseasonid = mappedPayload.leagueSeasonId;
    }
    if (mappedPayload.startsAt) {
      updatedLeagueEventData.eventdate = mappedPayload.startsAt;
    }
    const normalizedTitle = SocialHubService.normalizeOptionalTitle(mappedPayload.title);
    if (normalizedTitle) {
      updatedLeagueEventData.description =
        SocialHubService.formatLeagueEventDescription(normalizedTitle);
    }

    if (Object.keys(updatedLeagueEventData).length > 0) {
      await this.liveEventRepository.updateLeagueEvent(
        existing.leagueevents.id,
        updatedLeagueEventData,
      );
    }

    const detailUpdates: Prisma.socialliveeventsUncheckedUpdateInput = {};

    if ('teamSeasonId' in mappedPayload) {
      detailUpdates.teamseasonid = mappedPayload.teamSeasonId ?? null;
    }

    if (normalizedTitle) {
      detailUpdates.title = normalizedTitle;
    }

    if ('description' in mappedPayload) {
      detailUpdates.description = mappedPayload.description ?? null;
    }

    if ('streamPlatform' in mappedPayload) {
      detailUpdates.streamplatform = mappedPayload.streamPlatform ?? null;
    }

    if ('streamUrl' in mappedPayload) {
      detailUpdates.streamurl = mappedPayload.streamUrl ?? null;
    }

    if ('discordChannelId' in mappedPayload) {
      detailUpdates.discordchannelid = mappedPayload.discordChannelId ?? null;
    }

    if ('location' in mappedPayload) {
      detailUpdates.location = mappedPayload.location ?? null;
    }

    if (mappedPayload.status) {
      detailUpdates.status = mappedPayload.status;
    }

    if (mappedPayload.featured !== undefined) {
      detailUpdates.featured = mappedPayload.featured;
    }

    if (Object.keys(detailUpdates).length > 0) {
      await this.liveEventRepository.updateLiveEventDetails(liveEventId, detailUpdates);
    }

    return this.getLiveEvent(accountId, seasonId, liveEventId);
  }

  async deleteLiveEvent(accountId: bigint, seasonId: bigint, liveEventId: bigint): Promise<void> {
    await this.requireLiveEvent(accountId, seasonId, liveEventId);
    await this.liveEventRepository.deleteLiveEventDetails(liveEventId);
  }

  private async requireLiveEvent(
    accountId: bigint,
    seasonId: bigint,
    liveEventId: bigint,
  ): Promise<dbLiveEvent> {
    const record = await this.liveEventRepository.findLiveEventById(
      accountId,
      seasonId,
      liveEventId,
    );

    if (!record) {
      throw new NotFoundError('Live event not found');
    }

    return record;
  }

  private async resolveLeagueEventId(
    accountId: bigint,
    seasonId: bigint,
    payload: HydratedLiveEventPayload,
  ): Promise<bigint> {
    if (payload.leagueEventId) {
      const leagueEvent = await this.liveEventRepository.ensureLeagueEventAccess(
        accountId,
        seasonId,
        payload.leagueEventId,
      );

      const existing = await this.liveEventRepository.findLiveEventByLeagueEventId(
        accountId,
        seasonId,
        payload.leagueEventId,
      );

      if (existing) {
        throw new ValidationError('This league event already has live stream metadata');
      }

      const updateData: Prisma.leagueeventsUncheckedUpdateInput = {};

      if (payload.startsAt) {
        updateData.eventdate = payload.startsAt;
      }

      const existingTitle = SocialHubService.normalizeOptionalTitle(payload.title);
      if (existingTitle) {
        updateData.description = SocialHubService.formatLeagueEventDescription(existingTitle);
      }

      await this.liveEventRepository.updateLeagueEvent(leagueEvent.id, updateData);

      return leagueEvent.id;
    }

    if (!payload.leagueSeasonId) {
      throw new ValidationError('leagueSeasonId is required when creating a new event');
    }

    if (!payload.startsAt) {
      throw new ValidationError('startsAt is required when creating a new event');
    }

    await this.liveEventRepository.ensureLeagueSeasonAccess(
      accountId,
      seasonId,
      payload.leagueSeasonId,
    );

    const createdLeagueEvent = await this.liveEventRepository.createLeagueEvent({
      leagueseasonid: payload.leagueSeasonId,
      eventdate: payload.startsAt,
      description: SocialHubService.formatLeagueEventDescription(
        SocialHubService.requireTitle(payload),
      ),
    });

    return createdLeagueEvent.id;
  }

  private static formatLeagueEventDescription(title: string): string {
    const trimmed = title.trim();
    return trimmed.length > 25 ? `${trimmed.slice(0, 22)}...` : trimmed;
  }

  private static requireTitle(payload: HydratedLiveEventPayload): string {
    const title = payload.title?.trim();
    if (!title) {
      throw new ValidationError('title is required');
    }
    return title;
  }

  private static normalizeOptionalTitle(title?: string): string | undefined {
    if (!title) {
      return undefined;
    }
    const trimmed = title.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}

const LIVE_EVENT_ID_FIELDS: ReadonlySet<LiveEventIdField> = new Set([
  'leagueEventId',
  'leagueSeasonId',
  'teamSeasonId',
]);

function mapLiveEventPayload(payload: LiveEventMutationPayload): HydratedLiveEventPayload {
  const mapped: HydratedLiveEventPayload = {};
  const payloadKeys = Object.keys(payload) as Array<keyof LiveEventMutationPayload>;

  payloadKeys.forEach((key) => {
    const value = payload[key];

    if (LIVE_EVENT_ID_FIELDS.has(key as LiveEventIdField)) {
      mapped[key as LiveEventIdField] = toOptionalBigInt(value as string | null | undefined);
      return;
    }

    if (key === 'startsAt') {
      mapped.startsAt = toOptionalDate(value as string | undefined);
      return;
    }

    (mapped as Record<string, unknown>)[key as string] =
      value as LiveEventMutationPayload[typeof key];
  });

  return mapped;
}

function toOptionalBigInt(value?: string | null): bigint | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const trimmed = String(value).trim();
  return trimmed ? BigInt(trimmed) : undefined;
}

function toOptionalDate(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }
  return new Date(value);
}
