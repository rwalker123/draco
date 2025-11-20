import { Prisma } from '#prisma/client';
import { BaseSocialIngestionConnector } from './baseConnector.js';
import { SocialVideoIngestionRecord, YouTubeConnectorOptions } from '../ingestionTypes.js';
import { deterministicUuid } from '../../../utils/deterministicUuid.js';
import { fetchJson } from '../../../utils/fetchJson.js';
import { ISocialContentRepository } from '../../../repositories/interfaces/ISocialContentRepository.js';

interface YouTubeChannelDetailsResponse {
  items?: Array<{
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }>;
}

interface YouTubePlaylistItemsResponse {
  items?: Array<{
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      channelTitle?: string;
      videoOwnerChannelTitle?: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
    contentDetails?: {
      videoId?: string;
      videoPublishedAt?: string;
    };
  }>;
}

const RECENT_VIDEO_CACHE_LIMIT = 50;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DAILY_YOUTUBE_QUOTA_LIMIT = 10000;
const QUOTA_SAFETY_FACTOR = 1.5;
const COST_PER_CHANNEL_POLL = 2; // playlistItems + video metadata batch
const QUOTA_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export class YouTubeConnector extends BaseSocialIngestionConnector {
  private readonly recentVideoCache = new Map<string, string[]>();
  private readonly uploadsPlaylistCache = new Map<string, string | null>();
  private nextAllowedRun = 0;

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

    if (Date.now() < this.nextAllowedRun) {
      return;
    }

    const targets = await this.resolveTargets();

    this.scheduleNextRun(targets.length);

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
    const playlistId = await this.getUploadsPlaylistId(channelId);
    if (!playlistId) {
      console.warn('[youtube] Unable to resolve uploads playlist for channel', { channelId });
      return [];
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('maxResults', '10');
    url.searchParams.set('key', this.options.apiKey ?? '');

    try {
      const response = await fetchJson<YouTubePlaylistItemsResponse>(url, { timeoutMs: 8000 });
      if (!response.items?.length) {
        return [];
      }

      const records: SocialVideoIngestionRecord[] = [];

      for (const item of response.items) {
        const snippet = item.snippet;
        const details = item.contentDetails;
        const videoId = details?.videoId;

        if (!snippet || !videoId) {
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
          publishedAt: details?.videoPublishedAt
            ? new Date(details.videoPublishedAt)
            : snippet.publishedAt
              ? new Date(snippet.publishedAt)
              : new Date(),
          isLive: false,
          metadata: {
            channelTitle: snippet.videoOwnerChannelTitle ?? snippet.channelTitle,
            channelId,
            playlistId,
          },
        });
      }

      return records;
    } catch (error: unknown) {
      if (this.isQuotaError(error)) {
        console.error('[youtube] Quota exceeded while fetching playlist items. Pausing ingestion.');
        this.nextAllowedRun = Date.now() + QUOTA_COOLDOWN_MS;
        return [];
      }
      console.error(`[youtube] Failed to fetch videos for playlist ${playlistId}`, error);
      return [];
    }
  }

  private async getUploadsPlaylistId(channelId: string): Promise<string | null> {
    if (this.uploadsPlaylistCache.has(channelId)) {
      return this.uploadsPlaylistCache.get(channelId) ?? null;
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/channels');
    url.searchParams.set('part', 'contentDetails');
    url.searchParams.set('id', channelId);
    url.searchParams.set('key', this.options.apiKey ?? '');

    try {
      const response = await fetchJson<YouTubeChannelDetailsResponse>(url, { timeoutMs: 8000 });
      const uploadsPlaylist =
        response.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
      this.uploadsPlaylistCache.set(channelId, uploadsPlaylist);
      return uploadsPlaylist;
    } catch (error: unknown) {
      if (this.isQuotaError(error)) {
        console.error(
          '[youtube] Quota exceeded while resolving uploads playlist. Pausing ingestion.',
        );
        this.nextAllowedRun = Date.now() + QUOTA_COOLDOWN_MS;
        this.uploadsPlaylistCache.set(channelId, null);
        return null;
      }
      console.error(`[youtube] Failed to resolve uploads playlist for channel ${channelId}`, error);
      this.uploadsPlaylistCache.set(channelId, null);
      return null;
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

  private scheduleNextRun(targetCount: number): void {
    const perPollCost = Math.max(1, targetCount * COST_PER_CHANNEL_POLL);
    const maxPollsPerDay = Math.max(
      1,
      Math.floor(DAILY_YOUTUBE_QUOTA_LIMIT / QUOTA_SAFETY_FACTOR / perPollCost),
    );
    const dynamicInterval = Math.ceil(DAY_IN_MS / maxPollsPerDay);
    const enforcedInterval = Math.max(this.options.intervalMs, dynamicInterval);
    this.nextAllowedRun = Date.now() + enforcedInterval;
  }

  private isQuotaError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const message = (error as { message?: string }).message ?? '';
    if (message.includes('quota')) {
      return true;
    }
    const response = (error as { body?: string }).body;
    if (!response) {
      return false;
    }
    try {
      const parsed = JSON.parse(response);
      const errors = parsed?.error?.errors;
      return Array.isArray(errors) && errors.some((entry) => entry.reason === 'quotaExceeded');
    } catch (_err) {
      return false;
    }
  }
}
