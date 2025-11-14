import { Prisma } from '@prisma/client';
import { BaseSocialIngestionConnector } from './baseConnector.js';
import { SocialVideoIngestionRecord, YouTubeConnectorOptions } from '../ingestionTypes.js';
import { deterministicUuid } from '../../../utils/deterministicUuid.js';
import { fetchJson } from '../../../utils/fetchJson.js';
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

const RECENT_VIDEO_CACHE_LIMIT = 50;

export class YouTubeConnector extends BaseSocialIngestionConnector {
  private readonly recentVideoCache = new Map<string, string[]>();

  constructor(
    private readonly repository: ISocialContentRepository,
    private readonly options: YouTubeConnectorOptions,
  ) {
    super('youtube', options.enabled, options.intervalMs);
  }

  protected async runIngestion(): Promise<void> {
    if (!this.options.apiKey) {
      console.warn('[youtube] Skipping ingestion because API key is not configured.');
      return;
    }

    const targets = await this.resolveTargets();

    if (!targets.length) {
      console.info('[youtube] No ingestion targets configured.');
      return;
    }

    for (const target of targets) {
      const videos = await this.fetchChannelVideos(target.channelId);
      if (!videos.length) {
        continue;
      }

      const { newVideos, updatedCache } = this.filterNewVideos(target.channelId, videos);

      if (!newVideos.length) {
        if (updatedCache && !this.recentVideoCache.has(target.channelId)) {
          this.recentVideoCache.set(target.channelId, updatedCache);
        }
        continue;
      }

      for (const video of newVideos) {
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
      console.info(`[youtube] Ingested ${newVideos.length} videos for channel ${target.channelId}`);

      if (updatedCache) {
        this.recentVideoCache.set(target.channelId, updatedCache);
      }
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
      const response = await fetchJson<YouTubeSearchResponse>(url, { timeoutMs: 8000 });
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

  private async resolveTargets(): Promise<YouTubeConnectorOptions['targets']> {
    const staticTargets = this.options.targets ?? [];
    let dynamicTargets: YouTubeConnectorOptions['targets'] = [];

    if (this.options.targetsProvider) {
      try {
        dynamicTargets = await this.options.targetsProvider();
      } catch (error) {
        console.error('[youtube] Failed to load dynamic ingestion targets', error);
      }
    }

    const combined = [...staticTargets, ...dynamicTargets];
    const deduped: YouTubeConnectorOptions['targets'] = [];
    const seen = new Set<string>();

    for (const target of combined) {
      const channelId = target.channelId?.trim();
      if (!channelId) {
        continue;
      }

      if (target.teamId && !target.teamSeasonId) {
        console.warn('[youtube] Skipping team ingestion target without team season id', {
          accountId: target.accountId.toString(),
          teamId: target.teamId.toString(),
        });
        continue;
      }

      const key = [
        target.accountId.toString(),
        target.seasonId.toString(),
        target.teamId ? target.teamId.toString() : '',
        target.teamSeasonId ? target.teamSeasonId.toString() : '',
        channelId,
      ].join(':');

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      deduped.push({ ...target, channelId });
    }

    return deduped;
  }

  private filterNewVideos(
    channelId: string,
    videos: SocialVideoIngestionRecord[],
  ): { newVideos: SocialVideoIngestionRecord[]; updatedCache: string[] | null } {
    if (!videos.length) {
      return { newVideos: [], updatedCache: null };
    }

    const cached = this.recentVideoCache.get(channelId);

    if (!cached) {
      const videoIds = videos.map((video) => video.externalId);
      return {
        newVideos: videos,
        updatedCache: videoIds.slice(0, RECENT_VIDEO_CACHE_LIMIT),
      };
    }

    const knownIds = new Set(cached);
    const newVideos = videos.filter((video) => !knownIds.has(video.externalId));

    if (!newVideos.length) {
      return { newVideos, updatedCache: cached };
    }

    const updatedCache = [...newVideos.map((video) => video.externalId), ...cached].slice(
      0,
      RECENT_VIDEO_CACHE_LIMIT,
    );

    return { newVideos, updatedCache };
  }
}
