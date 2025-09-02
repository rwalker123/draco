import axios, { AxiosResponse } from 'axios';
import { ManagerInfo, LeagueNames, TeamNames } from '../types/emails/recipients';
import { BackendManager, BackendManagersResponse } from '../types/emails/backendTypes';
import { isBackendManagersResponse } from '../utils/emailTypeGuards';

/**
 * Manager Service - Handles manager data fetching and transformation
 * Follows the same patterns as other services in the project
 */
export interface ManagerService {
  /**
   * Fetch all managers for the current season
   */
  fetchManagers(
    accountId: string,
    seasonId: string,
    signal?: AbortSignal,
  ): Promise<{
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  }>;

  /**
   * Fetch managers filtered by league
   */
  fetchManagersByLeague(
    accountId: string,
    seasonId: string,
    leagueId: string,
    signal?: AbortSignal,
  ): Promise<{
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  }>;

  /**
   * Fetch managers filtered by team
   */
  fetchManagersByTeam(
    accountId: string,
    seasonId: string,
    teamId: string,
    signal?: AbortSignal,
  ): Promise<{
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  }>;

  /**
   * Search managers by name or email
   */
  searchManagers(
    accountId: string,
    seasonId: string,
    query: string,
    signal?: AbortSignal,
  ): Promise<{
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  }>;
}

/**
 * Manager service implementation
 */
class ManagerServiceImpl implements ManagerService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * Fetch all managers for the current season
   */
  async fetchManagers(
    accountId: string,
    seasonId: string,
    signal?: AbortSignal,
  ): Promise<{
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  }> {
    try {
      const url = `/api/accounts/${accountId}/seasons/${seasonId}/managers`;
      console.log('🔍 ManagerService: Making request to:', url);
      console.log('🔍 ManagerService: Token available:', this.token ? 'Yes' : 'No');
      console.log('🔍 ManagerService: Token length:', this.token?.length || 0);
      const response: AxiosResponse<BackendManagersResponse> = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        signal,
      });
      console.log('🔍 ManagerService: Request headers:', {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token ? this.token.substring(0, 20) + '...' : 'No token'}`,
      });
      console.log(
        '🔍 ManagerService: Full token (first 50 chars):',
        this.token ? this.token.substring(0, 50) + '...' : 'No token',
      );

      const data = response.data;

      if (!isBackendManagersResponse(data)) {
        console.error('ManagerService: Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      const result = {
        managers: this.transformManagers(data.managers),
        leagueNames: data.leagueNames,
        teamNames: data.teamNames,
      };

      return result;
    } catch (error) {
      console.log('🔍 ManagerService: Error fetching managers:', error);
      console.log('🔍 ManagerService: Token used:', this.token ? 'Present' : 'Missing');
      console.log(
        '🔍 ManagerService: Request URL:',
        `/api/accounts/${accountId}/seasons/${seasonId}/managers`,
      );

      // For development, return mock data if API is not available
      if (error instanceof Error && error.message.includes('404')) {
        console.log('ManagerService: API endpoint not found, returning mock data');
        return this.getMockData();
      }

      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch managers');
    }
  }

  /**
   * Fetch managers filtered by league
   */
  async fetchManagersByLeague(
    accountId: string,
    seasonId: string,
    leagueId: string,
    signal?: AbortSignal,
  ): Promise<{
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  }> {
    try {
      const response = await axios.get(
        `/api/accounts/${accountId}/seasons/${seasonId}/leagues/${leagueId}/managers`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          signal,
        },
      );

      const data = response.data;

      return {
        managers: this.transformManagers(data.managers),
        leagueNames: data.leagueNames || {},
        teamNames: data.teamNames || {},
      };
    } catch (error) {
      console.error('Error fetching managers by league:', error);
      throw new Error('Failed to fetch managers by league');
    }
  }

  /**
   * Fetch managers filtered by team
   */
  async fetchManagersByTeam(
    accountId: string,
    seasonId: string,
    teamId: string,
    signal?: AbortSignal,
  ): Promise<{
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  }> {
    try {
      const response = await axios.get(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamId}/managers`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          signal,
        },
      );

      const data = response.data;

      return {
        managers: this.transformManagers(data.managers),
        leagueNames: data.leagueNames || {},
        teamNames: data.teamNames || {},
      };
    } catch (error) {
      console.error('Error fetching managers by team:', error);
      throw new Error('Failed to fetch managers by team');
    }
  }

  /**
   * Search managers by name or email
   */
  async searchManagers(
    accountId: string,
    seasonId: string,
    query: string,
    signal?: AbortSignal,
  ): Promise<{
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  }> {
    try {
      const response = await axios.get(
        `/api/accounts/${accountId}/seasons/${seasonId}/managers/search`,
        {
          params: { q: query },
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          signal,
        },
      );

      const data = response.data;

      return {
        managers: this.transformManagers(data.managers),
        leagueNames: data.leagueNames || {},
        teamNames: data.teamNames || {},
      };
    } catch (error) {
      console.error('Error searching managers:', error);
      throw new Error('Failed to search managers');
    }
  }

  /**
   * Transform backend manager data to frontend format
   */
  private transformManagers(backendManagers: BackendManager[]): ManagerInfo[] {
    return backendManagers.map((manager) => ({
      id: manager.id,
      name: `${manager.firstName} ${manager.lastName}`,
      email: manager.email,
      phone1: manager.phone1 || '',
      phone2: manager.phone2 || '',
      phone3: manager.phone3 || '',
      allTeams: manager.allTeams,
      hasValidEmail: manager.hasValidEmail,
    }));
  }

  /**
   * Get mock data for development/testing
   */
  private getMockData(): {
    managers: ManagerInfo[];
    leagueNames: LeagueNames;
    teamNames: TeamNames;
  } {
    const mockManagers: ManagerInfo[] = [
      {
        id: 'manager1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone1: '555-0101',
        phone2: '555-0102',
        phone3: '555-0103',
        allTeams: [
          { leagueSeasonId: 'league1', teamSeasonId: 'team1' },
          { leagueSeasonId: 'league1', teamSeasonId: 'team2' },
        ],
        hasValidEmail: true,
      },
      {
        id: 'manager2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone1: '555-0201',
        phone2: '',
        phone3: '',
        allTeams: [{ leagueSeasonId: 'league2', teamSeasonId: 'team3' }],
        hasValidEmail: true,
      },
      {
        id: 'manager3',
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        phone1: '555-0301',
        phone2: '555-0302',
        phone3: '',
        allTeams: [{ leagueSeasonId: 'league1', teamSeasonId: 'team1' }],
        hasValidEmail: true,
      },
    ];

    const mockLeagueNames: LeagueNames = {
      league1: 'Baseball League A',
      league2: 'Baseball League B',
    };

    const mockTeamNames: TeamNames = {
      team1: 'Red Sox',
      team2: 'Blue Jays',
      team3: 'Yankees',
    };

    return {
      managers: mockManagers,
      leagueNames: mockLeagueNames,
      teamNames: mockTeamNames,
    };
  }
}

/**
 * Factory function to create manager service instance
 */
export const createManagerService = (token: string): ManagerService => {
  return new ManagerServiceImpl(token);
};
