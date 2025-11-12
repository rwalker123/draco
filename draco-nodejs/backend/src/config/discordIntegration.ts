export interface DiscordOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  authorizeUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
  stateTtlMs: number;
}

const DEFAULT_SCOPE = 'identify email guilds.join guilds.members.read';
const DEFAULT_AUTHORIZE_URL = 'https://discord.com/oauth2/authorize';
const DEFAULT_TOKEN_URL = 'https://discord.com/api/oauth2/token';
const DEFAULT_API_BASE_URL = 'https://discord.com/api';
const DEFAULT_STATE_TTL_MS = 10 * 60 * 1000;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

let cachedConfig: DiscordOAuthConfig | null = null;

export function getDiscordOAuthConfig(): DiscordOAuthConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const clientId = process.env.DISCORD_OAUTH_CLIENT_ID;
  const clientSecret = process.env.DISCORD_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Discord OAuth environment variables (DISCORD_OAUTH_CLIENT_ID, DISCORD_OAUTH_CLIENT_SECRET, DISCORD_OAUTH_REDIRECT_URI) are required.',
    );
  }

  cachedConfig = {
    clientId,
    clientSecret,
    redirectUri,
    scope: process.env.DISCORD_OAUTH_SCOPE ?? DEFAULT_SCOPE,
    authorizeUrl: process.env.DISCORD_OAUTH_AUTHORIZE_URL ?? DEFAULT_AUTHORIZE_URL,
    tokenUrl: process.env.DISCORD_OAUTH_TOKEN_URL ?? DEFAULT_TOKEN_URL,
    apiBaseUrl: process.env.DISCORD_API_BASE_URL ?? DEFAULT_API_BASE_URL,
    stateTtlMs: parsePositiveInt(process.env.DISCORD_OAUTH_STATE_TTL_MS, DEFAULT_STATE_TTL_MS),
  };

  return cachedConfig;
}
