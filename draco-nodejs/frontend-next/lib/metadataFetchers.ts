import type { AccountHeaderType } from '@draco/shared-schemas';
import { getTeamSeasonDetails as apiGetTeamSeasonDetails } from '@draco/shared-api-client';
import type { TeamSeasonRecordType } from '@draco/shared-schemas';
import { unwrapApiResult } from '../utils/apiResult';
import { createApiClient } from './apiClientFactory';
import { getServerFrontendBaseUrl } from './server/frontendBaseUrl';

type IncomingHeaders = { get(name: string): string | null } | null | undefined;

// Utility functions for fetching metadata for page titles and icons

interface AccountBranding {
  name: string;
  iconUrl: string | null;
}

export const DEFAULT_ACCOUNT_FAVICON_PATH = '/branding/default-sports-favicon.svg' as const;

function resolveAccountFavicon(header?: Partial<AccountHeaderType> | null): string {
  if (!header) {
    return DEFAULT_ACCOUNT_FAVICON_PATH;
  }

  if (header.accountLogoUrl) {
    return header.accountLogoUrl;
  }

  return DEFAULT_ACCOUNT_FAVICON_PATH;
}

async function fetchAccountName(
  apiUrl: string,
  accountId: string,
  frontendBaseUrl: string | null,
): Promise<string> {
  try {
    const headers = frontendBaseUrl ? { 'x-frontend-base-url': frontendBaseUrl } : undefined;
    const res = await fetch(`${apiUrl}/api/accounts/${accountId}/name`, {
      next: { revalidate: 60 },
      headers,
    });
    if (res.ok) {
      const payload = (await res.json()) as { name?: string };
      if (payload && typeof payload.name === 'string') {
        return payload.name;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch account name:', error);
  }
  return 'Account';
}

export async function getAccountBranding(
  accountId: string,
  incomingHeaders?: IncomingHeaders,
): Promise<AccountBranding> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL environment variable is required for SSR');
  }
  const frontendBaseUrl = getServerFrontendBaseUrl(incomingHeaders);
  const forwardedHeaders = frontendBaseUrl ? { 'x-frontend-base-url': frontendBaseUrl } : undefined;

  try {
    // NOTE: Metadata fetchers run on the server and sit outside Next.js rewrites,
    // so we call the backend directly via the configured API URL instead of the shared client.
    const res = await fetch(`${apiUrl}/api/accounts/${accountId}/header`, {
      next: { revalidate: 60 },
      headers: forwardedHeaders,
    });
    if (res.ok) {
      const headerData = (await res.json()) as AccountHeaderType;

      if (headerData && typeof headerData.name === 'string') {
        return {
          name: headerData.name,
          iconUrl: resolveAccountFavicon(headerData),
        };
      }
    }
  } catch (error) {
    console.warn('Failed to fetch account branding:', error);
  }

  const fallbackName = await fetchAccountName(apiUrl, accountId, frontendBaseUrl);
  return {
    name: fallbackName,
    iconUrl: DEFAULT_ACCOUNT_FAVICON_PATH,
  };
}

export async function getAccountName(
  accountId: string,
  incomingHeaders?: IncomingHeaders,
): Promise<string> {
  const { name } = await getAccountBranding(accountId, incomingHeaders);
  return name;
}

export async function getTeamInfo(
  accountId: string,
  seasonId: string,
  teamSeasonId: string,
  incomingHeaders?: IncomingHeaders,
): Promise<{ account: string; league: string; team: string; iconUrl: string | null }> {
  const frontendBaseUrl = getServerFrontendBaseUrl(incomingHeaders);
  const { name: account, iconUrl } = await getAccountBranding(accountId, incomingHeaders);
  let league = 'League';
  let team = 'Team';
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL environment variable is required for SSR');
    }

    // NOTE: See comment above about calling the backend directly from server utilities.
    const client = createApiClient({
      baseUrl: apiUrl,
      frontendBaseUrl: frontendBaseUrl ?? undefined,
    });
    const result = await apiGetTeamSeasonDetails({
      client,
      path: { accountId, seasonId, teamSeasonId },
      throwOnError: false,
    });

    const data = unwrapApiResult<TeamSeasonRecordType>(result, 'Failed to fetch team info');

    if (data) {
      team = data.name ?? team;
      league = data.league?.name ?? league;
    }
  } catch (error) {
    console.warn('Failed to fetch team info:', error);
  }
  return { account, league, team, iconUrl };
}

export async function getLeagueName(
  accountId: string,
  seasonId: string,
  leagueSeasonId: string,
  incomingHeaders?: IncomingHeaders,
): Promise<string> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL environment variable is required for SSR');
  }
  const frontendBaseUrl = getServerFrontendBaseUrl(incomingHeaders);
  const forwardedHeaders = frontendBaseUrl ? { 'x-frontend-base-url': frontendBaseUrl } : undefined;

  try {
    // NOTE: Server-side fetch avoids Next rewrites for the same reason as other helpers here.
    const res = await fetch(
      `${apiUrl}/api/accounts/${accountId}/seasons/${seasonId}/league-seasons/${leagueSeasonId}`,
      { headers: forwardedHeaders },
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.data?.leagueSeason?.league?.name) {
        return data.data.leagueSeason.league.name;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch league name:', error);
  }
  return 'League';
}
