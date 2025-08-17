// Player Classifieds Service
// Handles all API interactions for Player Classifieds feature

import {
  IPlayersWantedCreateRequest,
  IPlayersWantedResponse,
  IPlayersWantedUpdateRequest,
  ITeamsWantedCreateRequest,
  ITeamsWantedResponse,
  ITeamsWantedUpdateRequest,
  ITeamsWantedOwnerResponse,
  IClassifiedSearchParams,
  IClassifiedListResponse,
  IClassifiedSearchResult,
  IClassifiedMatch,
  IEmailVerificationRequest,
  IEmailVerificationResult,
  IAdminClassifiedsResponse,
  IClassifiedAnalytics,
} from '../types/playerClassifieds';

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:3001';
const API_ENDPOINTS = {
  playersWanted: '/api/accounts',
  teamsWanted: '/api/accounts',
  search: '/api/accounts',
  matches: '/api/accounts',
  admin: '/api/admin',
  analytics: '/api/accounts',
} as const;

// ============================================================================
// CORE CRUD OPERATIONS
// ============================================================================

// Players Wanted CRUD operations
export const playerClassifiedService = {
  // Create a new Players Wanted classified
  async createPlayersWanted(
    accountId: string,
    data: IPlayersWantedCreateRequest,
  ): Promise<IPlayersWantedResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.playersWanted}/${accountId}/player-classifieds/players-wanted`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to create Players Wanted: ${response.statusText}`);
    }

    return response.json();
  },

  // Get all Players Wanted for an account
  async getPlayersWanted(
    accountId: string,
    params?: Partial<IClassifiedSearchParams>,
  ): Promise<IClassifiedListResponse<IPlayersWantedResponse>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, v.toString()));
          } else if (value instanceof Date) {
            searchParams.append(key, value.toISOString());
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.playersWanted}/${accountId}/player-classifieds/players-wanted?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Players Wanted: ${response.statusText}`);
    }

    return response.json();
  },

  // Get a specific Players Wanted by ID
  async getPlayersWantedById(
    accountId: string,
    classifiedId: string,
  ): Promise<IPlayersWantedResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.playersWanted}/${accountId}/player-classifieds/players-wanted/${classifiedId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Players Wanted: ${response.statusText}`);
    }

    return response.json();
  },

  // Update a Players Wanted classified
  async updatePlayersWanted(
    accountId: string,
    classifiedId: string,
    data: IPlayersWantedUpdateRequest,
  ): Promise<IPlayersWantedResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.playersWanted}/${accountId}/player-classifieds/players-wanted/${classifiedId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to update Players Wanted: ${response.statusText}`);
    }

    return response.json();
  },

  // Delete a Players Wanted classified
  async deletePlayersWanted(accountId: string, classifiedId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.playersWanted}/${accountId}/player-classifieds/players-wanted/${classifiedId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to delete Players Wanted: ${response.statusText}`);
    }
  },

  // ============================================================================
  // TEAMS WANTED CRUD OPERATIONS
  // ============================================================================

  // Create a new Teams Wanted classified
  async createTeamsWanted(
    accountId: string,
    data: ITeamsWantedCreateRequest,
  ): Promise<ITeamsWantedResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to create Teams Wanted: ${response.statusText}`);
    }

    return response.json();
  },

  // Get all Teams Wanted for an account
  async getTeamsWanted(
    accountId: string,
    params?: Partial<IClassifiedSearchParams>,
  ): Promise<IClassifiedListResponse<ITeamsWantedResponse>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, v.toString()));
          } else if (value instanceof Date) {
            searchParams.append(key, value.toISOString());
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted?${searchParams.toString()}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Teams Wanted: ${response.statusText}`);
    }

    return response.json();
  },

  // Get a specific Teams Wanted by ID (public view)
  async getTeamsWantedById(accountId: string, classifiedId: string): Promise<ITeamsWantedResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/${classifiedId}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Teams Wanted: ${response.statusText}`);
    }

    return response.json();
  },

  // Get Teams Wanted by ID with owner access (requires access code)
  async getTeamsWantedOwnerById(
    accountId: string,
    classifiedId: string,
    accessCode: string,
  ): Promise<ITeamsWantedOwnerResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/${classifiedId}/owner`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Teams Wanted owner view: ${response.statusText}`);
    }

    return response.json();
  },

  // Update a Teams Wanted classified
  async updateTeamsWanted(
    accountId: string,
    classifiedId: string,
    data: ITeamsWantedUpdateRequest,
  ): Promise<ITeamsWantedResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/${classifiedId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to update Teams Wanted: ${response.statusText}`);
    }

    return response.json();
  },

  // Delete a Teams Wanted classified
  async deleteTeamsWanted(
    accountId: string,
    classifiedId: string,
    accessCode: string,
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/${classifiedId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to delete Teams Wanted: ${response.statusText}`);
    }
  },

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================

  // Search classifieds across both types
  async searchClassifieds(
    accountId: string,
    params: IClassifiedSearchParams,
  ): Promise<IClassifiedListResponse<IClassifiedSearchResult>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, v.toString()));
        } else if (value instanceof Date) {
          searchParams.append(key, value.toISOString());
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.search}/${accountId}/player-classifieds/search?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to search classifieds: ${response.statusText}`);
    }

    return response.json();
  },

  // Get search suggestions
  async getSearchSuggestions(accountId: string, query: string): Promise<string[]> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.search}/${accountId}/player-classifieds/search/suggestions?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get search suggestions: ${response.statusText}`);
    }

    return response.json();
  },

  // ============================================================================
  // MATCHING AND NOTIFICATIONS
  // ============================================================================

  // Get match suggestions for a classified
  async getMatchSuggestions(
    accountId: string,
    classifiedId: string,
    type: 'players' | 'teams',
  ): Promise<IClassifiedMatch[]> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.matches}/${accountId}/player-classifieds/${type}/${classifiedId}/matches`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get match suggestions: ${response.statusText}`);
    }

    return response.json();
  },

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  // Verify email for Teams Wanted access
  async verifyEmail(request: IEmailVerificationRequest): Promise<IEmailVerificationResult> {
    const response = await fetch(`${API_BASE_URL}/api/player-classifieds/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to verify email: ${response.statusText}`);
    }

    return response.json();
  },

  // ============================================================================
  // ADMIN OPERATIONS
  // ============================================================================

  // Get admin view of all classifieds
  async getAdminClassifieds(accountId: string): Promise<IAdminClassifiedsResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.admin}/accounts/${accountId}/player-classifieds`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch admin classifieds: ${response.statusText}`);
    }

    return response.json();
  },

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  // Get analytics for an account
  async getClassifiedsAnalytics(accountId: string): Promise<IClassifiedAnalytics> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.analytics}/${accountId}/player-classifieds/analytics`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`);
    }

    return response.json();
  },
};
