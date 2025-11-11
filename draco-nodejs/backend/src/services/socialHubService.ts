import { Prisma } from '@prisma/client';
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
import {
  CommunityMessageFilters,
  LiveEventFilters,
  LiveEventResponse,
  LiveEventUpsertInput,
  SocialFeedFilters,
  SocialFeedItemResponse,
  SocialVideoFilters,
  SocialVideoResponse,
  CommunityMessagePreviewResponse,
} from '../types/social.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';

export class SocialHubService {
  private readonly socialContentRepository: ISocialContentRepository;
  private readonly liveEventRepository: ILiveEventRepository;

  constructor(
    socialContentRepository?: ISocialContentRepository,
    liveEventRepository?: ILiveEventRepository,
  ) {
    this.socialContentRepository =
      socialContentRepository ?? RepositoryFactory.getSocialContentRepository();
    this.liveEventRepository = liveEventRepository ?? RepositoryFactory.getLiveEventRepository();
  }

  async listFeedItems(
    accountId: bigint,
    seasonId: bigint,
    filters?: SocialFeedFilters,
  ): Promise<SocialFeedItemResponse[]> {
    const query: SocialFeedQuery = {
      accountId,
      seasonId,
      teamId: filters?.teamId,
      teamSeasonId: filters?.teamSeasonId,
      sources: filters?.sources,
      before: filters?.before,
      limit: filters?.limit,
    };

    const records = await this.socialContentRepository.listFeedItems(query);
    return SocialFeedResponseFormatter.formatFeedItems(records);
  }

  async listVideos(
    accountId: bigint,
    seasonId: bigint,
    filters?: SocialVideoFilters,
  ): Promise<SocialVideoResponse[]> {
    const query: SocialVideoQuery = {
      accountId,
      seasonId,
      teamId: filters?.teamId,
      teamSeasonId: filters?.teamSeasonId,
      liveOnly: filters?.liveOnly,
      limit: filters?.limit,
    };

    const records = await this.socialContentRepository.listVideos(query);
    return SocialFeedResponseFormatter.formatVideos(records);
  }

  async listCommunityMessages(
    accountId: bigint,
    seasonId: bigint,
    filters?: CommunityMessageFilters,
  ): Promise<CommunityMessagePreviewResponse[]> {
    const query: CommunityMessageQuery = {
      accountId,
      seasonId,
      teamSeasonId: filters?.teamSeasonId,
      channelIds: filters?.channelIds,
      limit: filters?.limit,
    };

    const records = await this.socialContentRepository.listCommunityMessages(query);
    return SocialFeedResponseFormatter.formatCommunityMessages(records);
  }

  async listLiveEvents(
    accountId: bigint,
    seasonId: bigint,
    filters?: LiveEventFilters,
  ): Promise<LiveEventResponse[]> {
    const records = await this.liveEventRepository.listLiveEvents({
      accountId,
      seasonId,
      teamSeasonId: filters?.teamSeasonId,
      status: filters?.status,
      featuredOnly: filters?.featuredOnly,
    });

    return LiveEventResponseFormatter.format(records);
  }

  async getLiveEvent(
    accountId: bigint,
    seasonId: bigint,
    liveEventId: bigint,
  ): Promise<LiveEventResponse> {
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
    payload: LiveEventUpsertInput,
  ): Promise<LiveEventResponse> {
    const leagueEventId = await this.resolveLeagueEventId(accountId, seasonId, payload);

    if (payload.teamSeasonId) {
      await this.liveEventRepository.ensureTeamSeasonAccess(
        accountId,
        seasonId,
        payload.teamSeasonId,
      );
    }

    const created = await this.liveEventRepository.createLiveEventDetails({
      leagueeventid: leagueEventId,
      teamseasonid: payload.teamSeasonId ?? null,
      title: payload.title,
      description: payload.description ?? null,
      streamplatform: payload.streamPlatform ?? null,
      streamurl: payload.streamUrl ?? null,
      discordchannelid: payload.discordChannelId ?? null,
      location: payload.location ?? null,
      status: payload.status ?? 'upcoming',
      featured: payload.featured ?? false,
    });

    return this.getLiveEvent(accountId, seasonId, created.id);
  }

  async updateLiveEvent(
    accountId: bigint,
    seasonId: bigint,
    liveEventId: bigint,
    payload: LiveEventUpsertInput,
  ): Promise<LiveEventResponse> {
    const existing = await this.requireLiveEvent(accountId, seasonId, liveEventId);

    if (payload.leagueSeasonId) {
      await this.liveEventRepository.ensureLeagueSeasonAccess(
        accountId,
        seasonId,
        payload.leagueSeasonId,
      );
    }

    if ('teamSeasonId' in payload) {
      if (payload.teamSeasonId) {
        await this.liveEventRepository.ensureTeamSeasonAccess(
          accountId,
          seasonId,
          payload.teamSeasonId,
        );
      }
    }

    const updatedLeagueEventData: Prisma.leagueeventsUncheckedUpdateInput = {};
    if (payload.leagueSeasonId) {
      updatedLeagueEventData.leagueseasonid = payload.leagueSeasonId;
    }
    if (payload.startsAt) {
      updatedLeagueEventData.eventdate = payload.startsAt;
    }
    if (payload.title) {
      updatedLeagueEventData.description = SocialHubService.formatLeagueEventDescription(
        payload.title,
      );
    }

    if (Object.keys(updatedLeagueEventData).length > 0) {
      await this.liveEventRepository.updateLeagueEvent(
        existing.leagueevents.id,
        updatedLeagueEventData,
      );
    }

    const detailUpdates: Prisma.socialliveeventsUncheckedUpdateInput = {};

    if ('teamSeasonId' in payload) {
      detailUpdates.teamseasonid = payload.teamSeasonId ?? null;
    }

    if (payload.title) {
      detailUpdates.title = payload.title;
    }

    if ('description' in payload) {
      detailUpdates.description = payload.description ?? null;
    }

    if ('streamPlatform' in payload) {
      detailUpdates.streamplatform = payload.streamPlatform ?? null;
    }

    if ('streamUrl' in payload) {
      detailUpdates.streamurl = payload.streamUrl ?? null;
    }

    if ('discordChannelId' in payload) {
      detailUpdates.discordchannelid = payload.discordChannelId ?? null;
    }

    if ('location' in payload) {
      detailUpdates.location = payload.location ?? null;
    }

    if ('status' in payload && payload.status) {
      detailUpdates.status = payload.status;
    }

    if ('featured' in payload && typeof payload.featured === 'boolean') {
      detailUpdates.featured = payload.featured;
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
    payload: LiveEventUpsertInput,
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

      updateData.description = SocialHubService.formatLeagueEventDescription(payload.title);

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
      description: SocialHubService.formatLeagueEventDescription(payload.title),
    });

    return createdLeagueEvent.id;
  }

  private static formatLeagueEventDescription(title: string): string {
    const trimmed = title.trim();
    return trimmed.length > 25 ? `${trimmed.slice(0, 22)}...` : trimmed;
  }
}
