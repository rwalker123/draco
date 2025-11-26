import { Prisma } from '#prisma/client';
import { BaseSocialIngestionConnector } from './baseConnector.js';
import { BlueskyConnectorOptions } from '../ingestionTypes.js';
import { ISocialContentRepository } from '../../../repositories/interfaces/ISocialContentRepository.js';
import { BlueskyIntegrationService } from '../../blueskyIntegrationService.js';
import { SocialFeedCache } from './feedCache.js';

export class BlueskyConnector extends BaseSocialIngestionConnector {
  private readonly feedCache: SocialFeedCache;

  constructor(
    private readonly repository: ISocialContentRepository,
    private readonly integrationService: BlueskyIntegrationService,
    private readonly options: BlueskyConnectorOptions,
  ) {
    super('bluesky', options.enabled, options.intervalMs);
    this.feedCache = new SocialFeedCache(this.repository);
  }

  protected async runIngestion(): Promise<void> {
    const targets = await this.options.targetsProvider();
    if (!targets.length) {
      return;
    }

    const shouldLogVerbose = this.isDevelopmentEnvironment();
    for (const target of targets) {
      const posts = await this.integrationService.fetchRecentPostsForTarget(
        target,
        this.options.maxResults,
      );

      if (!posts.length) {
        continue;
      }

      const payload = posts.map((post) => ({
        id: post.id,
        accountid: target.accountId,
        seasonid: target.seasonId,
        teamid: target.teamId ?? null,
        teamseasonid: target.teamSeasonId ?? null,
        source: 'bluesky' as const,
        channelname: post.channelName,
        authorname: post.authorName ?? null,
        authorhandle: post.authorHandle ?? null,
        content: post.content,
        media: post.media
          ? (JSON.parse(JSON.stringify(post.media)) as Prisma.InputJsonValue)
          : undefined,
        metadata: post.metadata
          ? (JSON.parse(JSON.stringify(post.metadata)) as Prisma.InputJsonValue)
          : undefined,
        postedat: new Date(post.postedAt),
        permalink: post.permalink ?? null,
      }));

      const freshPayload = await this.feedCache.filterNewItems(
        {
          source: 'bluesky',
          accountId: target.accountId,
          seasonId: target.seasonId,
          teamId: target.teamId,
          teamSeasonId: target.teamSeasonId,
        },
        payload,
      );

      if (!freshPayload.length) {
        continue;
      }

      await this.repository.createFeedItems(freshPayload);
      if (shouldLogVerbose) {
        console.info(`[bluesky] Ingested ${freshPayload.length} posts for @${target.handle}`);
      }
    }
  }
}
