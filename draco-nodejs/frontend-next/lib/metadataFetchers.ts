// Utility functions for fetching metadata for page titles

export async function getAccountName(accountId: string): Promise<string> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL environment variable is required for SSR');
  }

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

export async function getTeamInfo(
  accountId: string,
  seasonId: string,
  teamSeasonId: string,
): Promise<{ account: string; league: string; team: string }> {
  let account = 'Account';
  let league = 'League';
  let team = 'Team';
  try {
    // Fetch account name
    account = await getAccountName(accountId);
    // Fetch team info
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL environment variable is required for SSR');
    }

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
  return { account, league, team };
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
