/**
 * Context Data Service
 * Centralized API service functions for fetching context data (leagues, teams) for role assignment
 */

export interface League {
  id: string;
  leagueId: string;
  leagueName: string;
  accountId: string;
}

export interface Team {
  id: string;
  teamId: string;
  name: string;
  webAddress: string | null;
  youtubeUserId: string | null;
  defaultVideo: string | null;
  autoPlayVideo: boolean;
}

export interface Division {
  id: string;
  divisionId: string;
  divisionName: string;
  priority: number;
  teams: Team[];
}

export interface LeagueSeason {
  id: string;
  leagueId: string;
  leagueName: string;
  accountId: string;
  divisions?: Division[];
  unassignedTeams?: Team[];
}

export interface ContextDataResponse {
  leagueSeasons: LeagueSeason[];
  season: {
    id: string;
    name: string;
    accountId: string;
  } | null;
}

/**
 * Context Data Service
 * Centralized API service functions for context data operations
 */
export class ContextDataService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * Fetch leagues and teams for a specific season
   * This single call provides all the data needed for both league and team selection
   */
  async fetchLeaguesAndTeams(accountId: string, seasonId: string): Promise<ContextDataResponse> {
    const response = await fetch(
      `/api/accounts/${accountId}/seasons/${seasonId}/leagues?includeTeams=true`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to load leagues and teams');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to load leagues and teams');
    }

    return data.data;
  }

  /**
   * Get all leagues for a season (without teams data)
   */
  async fetchLeagues(accountId: string, seasonId: string): Promise<League[]> {
    const response = await fetch(`/api/accounts/${accountId}/seasons/${seasonId}/leagues`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to load leagues');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to load leagues');
    }

    return data.data.leagueSeasons.map((ls: LeagueSeason) => ({
      id: ls.id,
      leagueId: ls.leagueId,
      leagueName: ls.leagueName,
      accountId: ls.accountId,
    }));
  }

  /**
   * Get all teams for a season (flattened from all leagues and divisions)
   */
  async fetchTeams(accountId: string, seasonId: string): Promise<Team[]> {
    const contextData = await this.fetchLeaguesAndTeams(accountId, seasonId);

    const allTeams: Team[] = [];

    // Add teams from divisions
    contextData.leagueSeasons.forEach((leagueSeason) => {
      if (leagueSeason.divisions) {
        leagueSeason.divisions.forEach((division) => {
          allTeams.push(...division.teams);
        });
      }
    });

    // Add unassigned teams
    contextData.leagueSeasons.forEach((leagueSeason) => {
      if (leagueSeason.unassignedTeams) {
        allTeams.push(...leagueSeason.unassignedTeams);
      }
    });

    return allTeams;
  }
}

/**
 * Create a ContextDataService instance
 */
export const createContextDataService = (token: string): ContextDataService => {
  return new ContextDataService(token);
};
