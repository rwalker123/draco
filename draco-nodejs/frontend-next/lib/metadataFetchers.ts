// Utility functions for fetching metadata for page titles and icons

interface AccountBranding {
  name: string;
  iconUrl: string | null;
}

async function fetchAccountName(apiUrl: string, accountId: string): Promise<string> {
  try {
    const res = await fetch(`${apiUrl}/api/accounts/${accountId}/name`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.data?.name) {
        return data.data.name;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch account name:', error);
  }
  return 'Account';
}

export async function getAccountBranding(accountId: string): Promise<AccountBranding> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL environment variable is required for SSR');
  }

  try {
    // NOTE: Metadata fetchers run on the server and sit outside Next.js rewrites,
    // so we call the backend directly via the configured API URL instead of the shared client.
    const res = await fetch(`${apiUrl}/api/accounts/${accountId}/header`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.data?.name) {
        return {
          name: data.data.name,
          iconUrl: data.data.accountLogoUrl ?? null,
        };
      }
    }
  } catch (error) {
    console.warn('Failed to fetch account branding:', error);
  }

  const fallbackName = await fetchAccountName(apiUrl, accountId);
  return {
    name: fallbackName,
    iconUrl: null,
  };
}

export async function getAccountName(accountId: string): Promise<string> {
  const { name } = await getAccountBranding(accountId);
  return name;
}

export async function getTeamInfo(
  accountId: string,
  seasonId: string,
  teamSeasonId: string,
): Promise<{ account: string; league: string; team: string; iconUrl: string | null }> {
  const { name: account, iconUrl } = await getAccountBranding(accountId);
  let league = 'League';
  let team = 'Team';
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL environment variable is required for SSR');
    }

    // NOTE: See comment above about calling the backend directly from server utilities.
    const res = await fetch(
      `${apiUrl}/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}`,
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.data?.teamSeason) {
        team = data.data.teamSeason.name || team;
        league = data.data.teamSeason.leagueName || league;
      }
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
): Promise<string> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL environment variable is required for SSR');
  }

  try {
    // NOTE: Server-side fetch avoids Next rewrites for the same reason as other helpers here.
    const res = await fetch(
      `${apiUrl}/api/accounts/${accountId}/seasons/${seasonId}/league-seasons/${leagueSeasonId}`,
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
