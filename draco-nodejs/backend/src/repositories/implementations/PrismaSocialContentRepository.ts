import { PrismaClient } from '@prisma/client';
import {
  CommunityMessageQuery,
  CreateSocialFeedItemInput,
  ISocialContentRepository,
  SocialFeedQuery,
  SocialVideoQuery,
  UpsertCommunityMessageInput,
  UpsertSocialVideoInput,
} from '../interfaces/ISocialContentRepository.js';
import { dbDiscordMessagePreview, dbSocialFeedItem, dbSocialVideo } from '../types/dbTypes.js';

export class PrismaSocialContentRepository implements ISocialContentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listFeedItems(query: SocialFeedQuery): Promise<dbSocialFeedItem[]> {
    const { accountId, seasonId, teamId, teamSeasonId, sources, before, limit = 25 } = query;

    return this.prisma.socialfeeditems.findMany({
      where: {
        accountid: accountId,
        seasonid: seasonId,
        ...(teamSeasonId ? { teamseasonid: teamSeasonId } : {}),
        ...(teamId ? { teamid: teamId } : {}),
        ...(sources?.length ? { source: { in: sources } } : {}),
        ...(before ? { postedat: { lt: before } } : {}),
      },
      include: this.feedInclude,
      orderBy: [{ postedat: 'desc' }, { id: 'desc' }],
      take: limit,
    });
  }

  async createFeedItems(items: CreateSocialFeedItemInput[]): Promise<void> {
    if (!items.length) {
      return;
    }

    await this.prisma.socialfeeditems.createMany({
      data: items,
      skipDuplicates: true,
    });
  }

  async listVideos(query: SocialVideoQuery): Promise<dbSocialVideo[]> {
    const { accountId, seasonId, teamId, teamSeasonId, liveOnly, limit = 20 } = query;

    return this.prisma.socialvideos.findMany({
      where: {
        accountid: accountId,
        seasonid: seasonId,
        ...(teamSeasonId ? { teamseasonid: teamSeasonId } : {}),
        ...(teamId ? { teamid: teamId } : {}),
        ...(liveOnly ? { islive: true } : {}),
      },
      include: this.videoInclude,
      orderBy: [{ publishedat: 'desc' }, { id: 'desc' }],
      take: limit,
    });
  }

  async upsertVideo(data: UpsertSocialVideoInput): Promise<dbSocialVideo> {
    if (data.id) {
      const { id, ...updateData } = data;
      return this.prisma.socialvideos.upsert({
        where: { id },
        create: data,
        update: updateData,
        include: this.videoInclude,
      });
    }

    return this.prisma.socialvideos.create({ data, include: this.videoInclude });
  }

  async listCommunityMessages(query: CommunityMessageQuery): Promise<dbDiscordMessagePreview[]> {
    const { accountId, seasonId, teamSeasonId, channelIds, limit = 50 } = query;

    return this.prisma.discordmessages.findMany({
      where: {
        accountid: accountId,
        seasonid: seasonId,
        ...(teamSeasonId ? { teamseasonid: teamSeasonId } : {}),
        ...(channelIds?.length ? { channelid: { in: channelIds } } : {}),
      },
      include: this.discordInclude,
      orderBy: [{ postedat: 'desc' }, { id: 'desc' }],
      take: limit,
    });
  }

  async upsertCommunityMessage(data: UpsertCommunityMessageInput): Promise<void> {
    const { id, ...rest } = data;
    await this.prisma.discordmessages.upsert({
      where: { id },
      create: data,
      update: rest,
    });
  }

  private readonly feedInclude = {
    teams: {
      select: {
        id: true,
        accountid: true,
        webaddress: true,
      },
    },
    teamsseason: {
      select: {
        id: true,
        name: true,
        leagueseasonid: true,
      },
    },
  } as const;

  private readonly videoInclude = this.feedInclude;

  private readonly discordInclude = this.feedInclude;
}
