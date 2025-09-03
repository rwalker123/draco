import axios from 'axios';
import { SeasonWideGroup, RecipientGroup, RecipientContact } from '../types/emails/recipients';

// Base group interface for common properties
interface BaseGroup {
  id: string;
  name: string;
  description?: string;
  members: RecipientContact[];
  memberCount: number;
}

// Backend API response types for data transformation
interface BackendLeagueResponse {
  id: string;
  name: string;
  totalMembers?: number;
  members?: RecipientContact[];
}

interface BackendTeamManagementGroupResponse {
  id: string;
  name: string;
  description?: string;
  members?: RecipientContact[];
}

interface BackendSystemRoleResponse {
  id: string;
  name: string;
  members?: RecipientContact[];
}

interface BackendIndividualTeamResponse {
  id: string;
  name: string;
  members?: RecipientContact[];
}

// Simple group interfaces for API responses that don't match the complex selection interfaces
interface SimpleLeagueGroup extends BaseGroup {
  type: 'league-specific';
  leagueId: string;
  seasonId: string;
}

interface SimpleTeamManagementGroup extends BaseGroup {
  type: 'team-management';
  groupId: string;
  seasonId: string;
}

interface SimpleSystemRoleGroup extends BaseGroup {
  type: 'system-role';
  roleId: string;
  roleName: string;
}

interface SimpleIndividualTeamGroup extends BaseGroup {
  type: 'individual-team';
  teamId: string;
  seasonId: string;
}

export interface RecipientGroupServiceConfig {
  timeout: number;
}

export interface RecipientGroupsData {
  seasonWideGroup?: SeasonWideGroup;
  leagueSpecificGroups: SimpleLeagueGroup[];
  teamManagementGroups: SimpleTeamManagementGroup[];
  systemRoleGroups: SimpleSystemRoleGroup[];
  individualTeamGroups: SimpleIndividualTeamGroup[];
}

/**
 * Service for managing recipient group data
 */
export class RecipientGroupService {
  private timeout: number;

  constructor(timeout: number = 10000) {
    this.timeout = timeout;
  }

  /**
   * Fetch season-wide group data
   */
  private async fetchSeasonWideGroup(
    accountId: string,
    seasonId?: string,
    includeMembers = true,
  ): Promise<SeasonWideGroup | undefined> {
    if (!seasonId) return undefined;

    try {
      const response = await axios.get(
        `/api/accounts/${accountId}/seasons/${seasonId}/participants`,
        {
          timeout: this.timeout,
          params: { includeMembers },
        },
      );

      if (response.data.success) {
        const data = response.data.data;
        return {
          id: `season-wide-${seasonId}`,
          name: 'Season-wide Broadcast',
          description: 'All current participants in the season',
          type: 'season-wide',
          memberCount: data.participants?.length || 0,
          members: data.participants || [],
          seasonId,
          seasonName: data.seasonName || 'Current Season',
          isExclusive: true,
        };
      }
      return undefined;
    } catch (error) {
      console.error('Error fetching season-wide group:', error);
      return undefined;
    }
  }

  /**
   * Fetch league-specific groups
   */
  private async fetchLeagueSpecificGroups(
    accountId: string,
    seasonId?: string,
  ): Promise<SimpleLeagueGroup[]> {
    if (!seasonId) return [];

    try {
      const response = await axios.get(`/api/accounts/${accountId}/seasons/${seasonId}/leagues`, {
        timeout: this.timeout,
        params: { includeTeams: true, includeMembers: true },
      });

      if (response.data.success) {
        const leagues = (response.data.data.leagues || []) as BackendLeagueResponse[];
        return leagues.map((league: BackendLeagueResponse) => ({
          id: `league-${league.id}`,
          name: league.name,
          description: `All teams and players in ${league.name}`,
          type: 'league-specific',
          memberCount: league.totalMembers || 0,
          members: league.members || [],
          leagueId: league.id,
          seasonId,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching league-specific groups:', error);
      return [];
    }
  }

  /**
   * Fetch team management groups
   */
  private async fetchTeamManagementGroups(
    accountId: string,
    seasonId?: string,
  ): Promise<SimpleTeamManagementGroup[]> {
    if (!seasonId) return [];

    try {
      const response = await axios.get(
        `/api/accounts/${accountId}/seasons/${seasonId}/team-management`,
        {
          timeout: this.timeout,
          params: { includeMembers: true },
        },
      );

      if (response.data.success) {
        const groups = (response.data.data.groups || []) as BackendTeamManagementGroupResponse[];
        return groups.map((group: BackendTeamManagementGroupResponse) => ({
          id: `team-management-${group.id}`,
          name: group.name,
          description: group.description || 'Team managers and administrators',
          type: 'team-management',
          memberCount: group.members?.length || 0,
          members: group.members || [],
          groupId: group.id,
          seasonId,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching team management groups:', error);
      return [];
    }
  }

  /**
   * Fetch system role groups
   */
  private async fetchSystemRoleGroups(accountId: string): Promise<SimpleSystemRoleGroup[]> {
    try {
      const response = await axios.get(`/api/accounts/${accountId}/system-roles`, {
        timeout: this.timeout,
        params: { includeMembers: true },
      });

      if (response.data.success) {
        const roles = (response.data.data.roles || []) as BackendSystemRoleResponse[];
        return roles.map((role: BackendSystemRoleResponse) => ({
          id: `system-role-${role.id}`,
          name: role.name,
          description: `Users with ${role.name} role`,
          type: 'system-role',
          memberCount: role.members?.length || 0,
          members: role.members || [],
          roleId: role.id,
          roleName: role.name,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching system role groups:', error);
      return [];
    }
  }

  /**
   * Fetch individual team groups
   */
  private async fetchIndividualTeamGroups(
    accountId: string,
    seasonId?: string,
  ): Promise<SimpleIndividualTeamGroup[]> {
    if (!seasonId) return [];

    try {
      const response = await axios.get(`/api/accounts/${accountId}/seasons/${seasonId}/teams`, {
        timeout: this.timeout,
        params: { includeMembers: true },
      });

      if (response.data.success) {
        const teams = (response.data.data.teams || []) as BackendIndividualTeamResponse[];
        return teams.map((team: BackendIndividualTeamResponse) => ({
          id: `team-${team.id}`,
          name: team.name,
          description: `Team: ${team.name}`,
          type: 'individual-team',
          memberCount: team.members?.length || 0,
          members: team.members || [],
          teamId: team.id,
          seasonId,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching individual team groups:', error);
      return [];
    }
  }

  /**
   * Fetch all recipient groups data
   */
  async fetchRecipientGroups(accountId: string, seasonId?: string): Promise<RecipientGroupsData> {
    try {
      const [
        seasonWideGroup,
        leagueSpecificGroups,
        teamManagementGroups,
        systemRoleGroups,
        individualTeamGroups,
      ] = await Promise.all([
        this.fetchSeasonWideGroup(accountId, seasonId),
        this.fetchLeagueSpecificGroups(accountId, seasonId),
        this.fetchTeamManagementGroups(accountId, seasonId),
        this.fetchSystemRoleGroups(accountId),
        this.fetchIndividualTeamGroups(accountId, seasonId),
      ]);

      return {
        seasonWideGroup,
        leagueSpecificGroups,
        teamManagementGroups,
        systemRoleGroups,
        individualTeamGroups,
      };
    } catch (error) {
      console.error('Error fetching recipient groups:', error);
      return {
        seasonWideGroup: undefined,
        leagueSpecificGroups: [],
        teamManagementGroups: [],
        systemRoleGroups: [],
        individualTeamGroups: [],
      };
    }
  }

  /**
   * Search groups by query
   */
  async searchGroups(
    accountId: string,
    seasonId: string,
    query: string,
    groupTypes?: string[],
  ): Promise<RecipientGroup[]> {
    try {
      const response = await axios.get(
        `/api/accounts/${accountId}/seasons/${seasonId}/search-groups`,
        {
          timeout: this.timeout,
          params: { query, groupTypes },
        },
      );

      if (response.data.success) {
        return response.data.data.groups || [];
      }
      return [];
    } catch (error) {
      console.error('Error searching groups:', error);
      return [];
    }
  }

  /**
   * Get group details by ID
   */
  async getGroupDetails(
    accountId: string,
    groupId: string,
    groupType: string,
  ): Promise<RecipientGroup | null> {
    try {
      const response = await axios.get(`/api/accounts/${accountId}/groups/${groupId}`, {
        timeout: this.timeout,
        params: { type: groupType, includeMembers: true },
      });

      if (response.data.success) {
        return response.data.data.group;
      }
      return null;
    } catch (error) {
      console.error('Error fetching group details:', error);
      return null;
    }
  }
}

/**
 * Factory function to create a RecipientGroupService instance
 */
export const createRecipientGroupService = (timeout?: number): RecipientGroupService => {
  return new RecipientGroupService(timeout);
};

/**
 * Default service instance
 */
export const recipientGroupService = createRecipientGroupService(10000);
