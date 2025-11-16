export interface SocialIngestionTargetBase {
  accountId: bigint;
  seasonId: bigint;
  teamId?: bigint;
  teamSeasonId?: bigint;
}

export interface TwitterIngestionTarget extends SocialIngestionTargetBase {
  handle: string;
}

export interface YouTubeIngestionTarget extends SocialIngestionTargetBase {
  channelId: string;
}

export interface DiscordIngestionTarget extends SocialIngestionTargetBase {
  channelId: string;
  label?: string;
  guildId?: string;
}

function parseBoolean(value: string | undefined, fallback = false): boolean {
  if (value === undefined) {
    return fallback;
  }
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

function parseInterval(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseTwitterTargets(raw: string | undefined): TwitterIngestionTarget[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [accountId, seasonId, handle, teamId, teamSeasonId] = entry.split(':');
      if (!accountId || !seasonId || !handle) {
        throw new Error(
          `Invalid SOCIAL_INGESTION_TWITTER_TARGETS entry "${entry}". Expected format accountId:seasonId:handle[:teamId][:teamSeasonId]`,
        );
      }

      return {
        accountId: BigInt(accountId),
        seasonId: BigInt(seasonId),
        handle: handle.replace(/^@/, ''),
        teamId: teamId ? BigInt(teamId) : undefined,
        teamSeasonId: teamSeasonId ? BigInt(teamSeasonId) : undefined,
      };
    });
}

function parseYouTubeTargets(raw: string | undefined): YouTubeIngestionTarget[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [accountId, seasonId, channelId, teamId, teamSeasonId] = entry.split(':');
      if (!accountId || !seasonId || !channelId) {
        throw new Error(
          `Invalid SOCIAL_INGESTION_YOUTUBE_TARGETS entry "${entry}". Expected format accountId:seasonId:channelId[:teamId][:teamSeasonId]`,
        );
      }

      return {
        accountId: BigInt(accountId),
        seasonId: BigInt(seasonId),
        channelId,
        teamId: teamId ? BigInt(teamId) : undefined,
        teamSeasonId: teamSeasonId ? BigInt(teamSeasonId) : undefined,
      };
    });
}

function parseDiscordTargets(raw: string | undefined): DiscordIngestionTarget[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [accountId, seasonId, channelId, teamSeasonId, teamId, label, guildId] =
        entry.split(':');
      if (!accountId || !seasonId || !channelId) {
        throw new Error(
          `Invalid SOCIAL_INGESTION_DISCORD_CHANNELS entry "${entry}". Expected format accountId:seasonId:channelId[:teamSeasonId][:teamId][:label]`,
        );
      }

      return {
        accountId: BigInt(accountId),
        seasonId: BigInt(seasonId),
        channelId,
        teamSeasonId: teamSeasonId ? BigInt(teamSeasonId) : undefined,
        teamId: teamId ? BigInt(teamId) : undefined,
        label,
        guildId: guildId || undefined,
      };
    });
}

const twitterTargets = parseTwitterTargets(process.env.SOCIAL_INGESTION_TWITTER_TARGETS);
const youtubeTargets = parseYouTubeTargets(process.env.SOCIAL_INGESTION_YOUTUBE_TARGETS);
const discordTargets = parseDiscordTargets(process.env.SOCIAL_INGESTION_DISCORD_CHANNELS);

const twitterEnabled = parseBoolean(
  process.env.SOCIAL_INGESTION_TWITTER_ENABLED,
  twitterTargets.length > 0,
);
const youtubeEnabled = parseBoolean(
  process.env.SOCIAL_INGESTION_YOUTUBE_ENABLED,
  youtubeTargets.length > 0 || Boolean(process.env.SOCIAL_INGESTION_YOUTUBE_API_KEY),
);
const discordEnabled = parseBoolean(
  process.env.SOCIAL_INGESTION_DISCORD_ENABLED,
  discordTargets.length > 0,
);

const connectorsEnabledByDefault = twitterEnabled || youtubeEnabled || discordEnabled;

export const socialIngestionConfig = {
  enabled: parseBoolean(process.env.SOCIAL_INGESTION_ENABLED, connectorsEnabledByDefault),
  twitter: {
    enabled: twitterEnabled,
    bearerToken: process.env.SOCIAL_INGESTION_TWITTER_BEARER_TOKEN,
    intervalMs: parseInterval(process.env.SOCIAL_INGESTION_TWITTER_INTERVAL_MS, 5 * 60 * 1000),
    maxResults: parseInterval(process.env.SOCIAL_INGESTION_TWITTER_MAX_RESULTS, 20),
    targets: twitterTargets,
  },
  youtube: {
    enabled: youtubeEnabled,
    apiKey: process.env.SOCIAL_INGESTION_YOUTUBE_API_KEY,
    intervalMs: parseInterval(process.env.SOCIAL_INGESTION_YOUTUBE_INTERVAL_MS, 10 * 60 * 1000),
    targets: youtubeTargets,
  },
  discord: {
    enabled: discordEnabled,
    botToken: process.env.SOCIAL_INGESTION_DISCORD_BOT_TOKEN,
    intervalMs: parseInterval(process.env.SOCIAL_INGESTION_DISCORD_INTERVAL_MS, 60 * 1000),
    limit: parseInterval(process.env.SOCIAL_INGESTION_DISCORD_LIMIT, 25),
    targets: discordTargets,
  },
} as const;
