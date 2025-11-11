import { Prisma } from '@prisma/client';
import { BaseSocialIngestionConnector } from './baseConnector.js';
import { SocialVideoIngestionRecord, YouTubeConnectorOptions } from '../ingestionTypes.js';
import { deterministicUuid } from '../../../utils/deterministicUuid.js';
import { httpsJsonRequest } from '../../../utils/httpClient.js';
import { ISocialContentRepository } from '../../../repositories/interfaces/ISocialContentRepository.js';

interface YouTubeSearchResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      channelTitle?: string;
      liveBroadcastContent?: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
}

export class YouTubeConnector extends BaseSocialIngestionConnector {
  constructor(
    private readonly repository: ISocialContentRepository,
    private readonly options: YouTubeConnectorOptions,
  ) {
    super('youtube', options.enabled && options.targets.length > 0, options.intervalMs);
  }

  protected async runIngestion(): Promise<void> {
    if (!this.options.apiKey) {
      console.warn('[youtube] Skipping ingestion because API key is not configured.');
      return;
    }

    for (const target of this.options.targets) {
      const videos = await this.fetchChannelVideos(target.channelId);
      if (!videos.length) {
        continue;
      }

      for (const video of videos) {
        await this.repository.upsertVideo({
          id: deterministicUuid(`youtube:${target.accountId.toString()}:${video.externalId}`),
          accountid: target.accountId,
          seasonid: target.seasonId,
          teamid: target.teamId ?? null,
          teamseasonid: target.teamSeasonId ?? null,
          source: 'youtube',
          title: video.title,
          description: video.description ?? null,
          thumbnailurl:
            video.thumbnailUrl ??
            'https://img.youtube.com/vi/' + video.externalId + '/hqdefault.jpg',
          videourl: video.videoUrl,
          islive: video.isLive ?? false,
          durationseconds: video.durationSeconds ?? null,
          publishedat: video.publishedAt,
          metadata: video.metadata
            ? (JSON.parse(JSON.stringify(video.metadata)) as Prisma.InputJsonValue)
            : undefined,
        });
      }

      console.info(`[youtube] Ingested ${videos.length} videos for channel ${target.channelId}`);
    }
  }

  private async fetchChannelVideos(channelId: string): Promise<SocialVideoIngestionRecord[]> {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('channelId', channelId);
    url.searchParams.set('order', 'date');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', '10');
    url.searchParams.set('key', this.options.apiKey ?? '');

    try {
      const response = await httpsJsonRequest<YouTubeSearchResponse>(url, { timeoutMs: 8000 });
      if (!response.items?.length) {
        return [];
      }

      const records: SocialVideoIngestionRecord[] = [];

      for (const item of response.items) {
        const videoId = item.id?.videoId;
        const snippet = item.snippet;

        if (!videoId || !snippet) {
          continue;
        }

        const thumbnail =
          snippet.thumbnails?.high?.url ??
          snippet.thumbnails?.medium?.url ??
          snippet.thumbnails?.default?.url ??
          null;

        records.push({
          externalId: videoId,
          title: snippet.title ?? 'Untitled',
          description: snippet.description ?? null,
          thumbnailUrl: thumbnail,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          publishedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : new Date(),
          isLive: snippet.liveBroadcastContent === 'live',
          metadata: {
            channelTitle: snippet.channelTitle,
            channelId,
          },
        });
      }

      return records;
    } catch (error) {
      console.error(`[youtube] Failed to fetch videos for channel ${channelId}`, error);
      return [];
    }
  }
}
