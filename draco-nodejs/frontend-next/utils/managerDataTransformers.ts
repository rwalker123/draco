import { ManagerInfo, LeagueTeam, LeagueNames, TeamNames } from '../types/emails/recipients';
import {
  BackendManager,
  BackendLeagueTeam,
  BackendManagersResponse,
} from '../types/emails/backendTypes';

/**
 * Manager Data Transformers
 * Handles data transformation between backend and frontend formats
 */

/**
 * Transform backend manager data to frontend ManagerInfo format
 */
export const transformBackendManager = (backendManager: BackendManager): ManagerInfo => {
  return {
    id: backendManager.id,
    name: `${backendManager.firstName} ${backendManager.lastName}`,
    email: backendManager.email,
    phone1: backendManager.phone1 || '',
    phone2: backendManager.phone2 || '',
    phone3: backendManager.phone3 || '',
    allTeams: transformBackendTeams(backendManager.allTeams),
    hasValidEmail: backendManager.hasValidEmail,
  };
};

/**
 * Transform backend teams array to LeagueTeam format
 */
export const transformBackendTeams = (backendTeams: BackendLeagueTeam[]): LeagueTeam[] => {
  return backendTeams.map((team) => ({
    leagueSeasonId: team.leagueSeasonId,
    teamSeasonId: team.teamSeasonId,
  }));
};

/**
 * Transform backend league names to LeagueNames format
 */
export const transformBackendLeagueNames = (
  backendLeagueNames: Record<string, string>,
): LeagueNames => {
  return { ...backendLeagueNames };
};

/**
 * Transform backend team names to TeamNames format
 */
export const transformBackendTeamNames = (backendTeamNames: Record<string, string>): TeamNames => {
  return { ...backendTeamNames };
};

/**
 * Transform backend managers response to frontend format
 */
export const transformBackendManagersResponse = (
  backendResponse: BackendManagersResponse,
): {
  managers: ManagerInfo[];
  leagueNames: LeagueNames;
  teamNames: TeamNames;
} => {
  return {
    managers: backendResponse.managers.map(transformBackendManager),
    leagueNames: transformBackendLeagueNames(backendResponse.leagueNames),
    teamNames: transformBackendTeamNames(backendResponse.teamNames),
  };
};

/**
 * Get manager display name with team context
 */
export const getManagerDisplayName = (
  manager: ManagerInfo,
  leagueNames: LeagueNames,
  teamNames: TeamNames,
): string => {
  if (manager.allTeams.length === 0) {
    return manager.name;
  }

  const teamContexts = manager.allTeams.map((team) => {
    const leagueName = leagueNames[team.leagueSeasonId] || 'Unknown League';
    const teamName = teamNames[team.teamSeasonId] || 'Unknown Team';
    return `${teamName} (${leagueName})`;
  });

  if (teamContexts.length === 1) {
    return `${manager.name} - ${teamContexts[0]}`;
  }

  // For multiple teams, list them all separated by commas
  return `${manager.name} - ${teamContexts.join(', ')}`;
};

/**
 * Get manager teams summary
 */
export const getManagerTeamsSummary = (
  manager: ManagerInfo,
  leagueNames: LeagueNames,
  teamNames: TeamNames,
): string => {
  if (manager.allTeams.length === 0) {
    return 'No teams assigned';
  }

  const teamList = manager.allTeams.map((team) => {
    const leagueName = leagueNames[team.leagueSeasonId] || 'Unknown League';
    const teamName = teamNames[team.teamSeasonId] || 'Unknown Team';
    return `${teamName} (${leagueName})`;
  });

  return teamList.join(', ');
};

/**
 * Filter managers by search query
 */
export const filterManagersByQuery = (
  managers: ManagerInfo[],
  query: string,
  leagueNames: LeagueNames,
  teamNames: TeamNames,
): ManagerInfo[] => {
  if (!query.trim()) {
    return managers;
  }

  const lowerQuery = query.toLowerCase();

  return managers.filter((manager) => {
    // Search by name
    if (manager.name.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search by email
    if (manager.email && manager.email.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search by team names
    const teamSummary = getManagerTeamsSummary(manager, leagueNames, teamNames);
    if (teamSummary.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search by league names
    const leagueNamesList = manager.allTeams
      .map((team) => leagueNames[team.leagueSeasonId])
      .filter(Boolean);

    if (leagueNamesList.some((leagueName) => leagueName.toLowerCase().includes(lowerQuery))) {
      return true;
    }

    return false;
  });
};

/**
 * Sort managers by various criteria
 */
export const sortManagers = (
  managers: ManagerInfo[],
  sortBy: 'name' | 'email' | 'teamCount' = 'name',
  sortOrder: 'asc' | 'desc' = 'asc',
): ManagerInfo[] => {
  const sortedManagers = [...managers];

  sortedManagers.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'email':
        // Handle null emails by treating them as empty strings for sorting
        const emailA = a.email || '';
        const emailB = b.email || '';
        comparison = emailA.localeCompare(emailB);
        break;
      case 'teamCount':
        comparison = a.allTeams.length - b.allTeams.length;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sortedManagers;
};

/**
 * Group managers by league
 */
export const groupManagersByLeague = (
  managers: ManagerInfo[],
  leagueNames: LeagueNames,
): Record<string, ManagerInfo[]> => {
  const grouped: Record<string, ManagerInfo[]> = {};

  managers.forEach((manager) => {
    manager.allTeams.forEach((team) => {
      const leagueName = leagueNames[team.leagueSeasonId] || 'Unknown League';
      if (!grouped[leagueName]) {
        grouped[leagueName] = [];
      }

      // Avoid duplicates
      if (!grouped[leagueName].find((m) => m.id === manager.id)) {
        grouped[leagueName].push(manager);
      }
    });
  });

  return grouped;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get unique leagues from manager teams
 */
export const getUniqueLeaguesFromManagers = (
  managers: ManagerInfo[],
  leagueNames: LeagueNames,
): Array<{ id: string; name: string }> => {
  const leagueMap = new Map<string, string>();

  managers.forEach((manager) => {
    manager.allTeams.forEach((team) => {
      const leagueName = leagueNames[team.leagueSeasonId] || 'Unknown League';
      leagueMap.set(team.leagueSeasonId, leagueName);
    });
  });

  return Array.from(leagueMap.entries()).map(([id, name]) => ({ id, name }));
};

/**
 * Get unique teams from manager teams
 */
export const getUniqueTeamsFromManagers = (
  managers: ManagerInfo[],
  teamNames: TeamNames,
): Array<{ id: string; name: string }> => {
  const teamMap = new Map<string, string>();

  managers.forEach((manager) => {
    manager.allTeams.forEach((team) => {
      const teamName = teamNames[team.teamSeasonId] || 'Unknown Team';
      teamMap.set(team.teamSeasonId, teamName);
    });
  });

  return Array.from(teamMap.entries()).map(([id, name]) => ({ id, name }));
};
