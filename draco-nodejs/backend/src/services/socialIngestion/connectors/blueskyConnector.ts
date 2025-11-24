import { Prisma } from '#prisma/client';
import { BaseSocialIngestionConnector } from './baseConnector.js';
import { BlueskyConnectorOptions } from '../ingestionTypes.js';
import { ISocialContentRepository } from '../../../repositories/interfaces/ISocialContentRepository.js';
import { BlueskyIntegrationService } from '../../blueskyIntegrationService.js';

export class BlueskyConnector extends BaseSocialIngestionConnector {
  constructor(
    private readonly repository: ISocialContentRepository,
    private readonly integrationService: BlueskyIntegrationService,
    private readonly options: BlueskyConnectorOptions,
  ) {
    super('bluesky', options.enabled, options.intervalMs);
  }

  protected async runIngestion(): Promise<void> {
    const targets = await this.options.targetsProvider();
    if (!targets.length) {
      return;
    }

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
        media: post.media ? (JSON.parse(JSON.stringify(post.media)) as Prisma.InputJsonValue) : undefined,
        metadata: post.metadata
          ? (JSON.parse(JSON.stringify(post.metadata)) as Prisma.InputJsonValue)
          : undefined,
        postedat: new Date(post.postedAt),
        permalink: post.permalink ?? null,
      }));

      await this.repository.createFeedItems(payload);
      console.info(`[bluesky] Ingested ${payload.length} posts for @${target.handle}`);
    }
  }
}
