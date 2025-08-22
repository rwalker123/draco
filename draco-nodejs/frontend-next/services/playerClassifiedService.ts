// Player Classifieds Service
// Handles all API interactions for Player Classifieds feature

import {
  IPlayersWantedCreateRequest,
  IPlayersWantedResponse,
  IPlayersWantedUpdateRequest,
  ITeamsWantedCreateRequest,
  ITeamsWantedResponse,
  ITeamsWantedUpdateRequest,
  IClassifiedSearchParams,
  IClassifiedListResponse,
  IClassifiedSearchResult,
  IClassifiedMatch,
  IEmailVerificationRequest,
  IEmailVerificationResult,
  IAdminClassifiedsResponse,
  IClassifiedAnalytics,
  IVerifyAccessResponse,
  ITeamsWantedServiceResponse,
  IServiceResponse,
} from '../types/playerClassifieds';

import { IAccessCodeVerificationResponse } from '../types/accessCode';

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

// Remove the API_BASE_URL constant and use relative URLs like other services
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
    token: string,
  ): Promise<IPlayersWantedResponse> {
    const response = await fetch(
      `${API_ENDPOINTS.playersWanted}/${accountId}/player-classifieds/players-wanted`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
  ): Promise<IServiceResponse<IClassifiedListResponse<IPlayersWantedResponse>>> {
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

    const url = `${API_ENDPOINTS.playersWanted}/${accountId}/player-classifieds/players-wanted?${searchParams.toString()}`;

    try {
      const response = await fetch(url, {
        // No Authorization header - this is a public endpoint
      });

      if (!response.ok) {
        // Return error response instead of throwing
        return {
          success: false,
          error: `Failed to fetch Players Wanted: ${response.statusText}`,
          errorCode: response.statusText,
          statusCode: response.status,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      // Handle network errors
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
        errorCode: 'NETWORK_ERROR',
        statusCode: 0,
      };
    }
  },

  // Get a specific Players Wanted by ID
  async getPlayersWantedById(
    accountId: string,
    classifiedId: string,
    token: string,
  ): Promise<IPlayersWantedResponse> {
    const response = await fetch(
      `${API_ENDPOINTS.playersWanted}/${accountId}/player-classifieds/players-wanted/${classifiedId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
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
    token: string,
  ): Promise<IPlayersWantedResponse> {
    const response = await fetch(
      `${API_ENDPOINTS.playersWanted}/${accountId}/player-classifieds/players-wanted/${classifiedId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
  async deletePlayersWanted(accountId: string, classifiedId: string, token: string): Promise<void> {
    const response = await fetch(
      `${API_ENDPOINTS.playersWanted}/${accountId}/player-classifieds/players-wanted/${classifiedId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
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

  // Create a new Teams Wanted classified (public, no auth required)
  async createTeamsWanted(
    accountId: string,
    data: ITeamsWantedCreateRequest,
  ): Promise<ITeamsWantedResponse> {
    const response = await fetch(
      `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted`,
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
    params: Partial<IClassifiedSearchParams> | undefined,
    token: string,
  ): Promise<ITeamsWantedServiceResponse> {
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

    const url = `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted?${searchParams.toString()}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Return error response instead of throwing
        return {
          success: false,
          error: `Failed to fetch Teams Wanted: ${response.statusText}`,
          errorCode: response.statusText,
          statusCode: response.status,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      // Handle network errors
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
        errorCode: 'NETWORK_ERROR',
        statusCode: 0,
      };
    }
  },

  // Get a specific Teams Wanted by ID
  async getTeamsWantedById(
    accountId: string,
    classifiedId: string,
    token: string,
  ): Promise<ITeamsWantedResponse> {
    const response = await fetch(
      `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/${classifiedId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Teams Wanted: ${response.statusText}`);
    }

    return response.json();
  },

  // Update a Teams Wanted classified (uses access code, no auth required)
  async updateTeamsWanted(
    accountId: string,
    classifiedId: string,
    data: ITeamsWantedUpdateRequest,
  ): Promise<ITeamsWantedResponse> {
    const response = await fetch(
      `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/${classifiedId}`,
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

  // Delete a Teams Wanted classified (uses access code, no auth required)
  async deleteTeamsWanted(accountId: string, classifiedId: string): Promise<void> {
    const response = await fetch(
      `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/${classifiedId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to delete Teams Wanted: ${response.statusText}`);
    }
  },

  // ============================================================================
  // SEARCH AND MATCHING OPERATIONS
  // ============================================================================

  // Search across all classifieds
  async searchClassifieds(
    accountId: string,
    params: IClassifiedSearchParams,
    token: string,
  ): Promise<IClassifiedSearchResult> {
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
      `${API_ENDPOINTS.search}/${accountId}/player-classifieds/search?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to search classifieds: ${response.statusText}`);
    }

    return response.json();
  },

  // Get matches for a specific classified
  async getMatches(
    accountId: string,
    classifiedId: string,
    type: 'players-wanted' | 'teams-wanted',
    token: string,
  ): Promise<IClassifiedMatch[]> {
    const response = await fetch(
      `${API_ENDPOINTS.matches}/${accountId}/player-classifieds/${type}/${classifiedId}/matches`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch matches: ${response.statusText}`);
    }

    return response.json();
  },

  // ============================================================================
  // ACCESS CODE OPERATIONS
  // ============================================================================

  // Verify Teams Wanted access code and retrieve the classified ad (public, no auth required)
  async verifyTeamsWantedAccessCode(
    accountId: string,
    accessCode: string,
  ): Promise<IAccessCodeVerificationResponse> {
    const response = await fetch(
      `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/access-code`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to verify access code: ${response.statusText}`);
    }

    return response.json();
  },

  // Get Teams Wanted classified by access code (for verified users, public, no auth required)
  async getTeamsWantedByAccessCode(
    accountId: string,
    accessCode: string,
  ): Promise<ITeamsWantedResponse> {
    const response = await fetch(
      `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/access-code`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to retrieve Teams Wanted: ${response.statusText}`,
      );
    }

    return response.json();
  },

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  // Verify Teams Wanted access code (public, no auth required)
  async verifyTeamsWantedAccess(
    accountId: string,
    classifiedId: string,
    accessCode: string,
  ): Promise<IVerifyAccessResponse> {
    const response = await fetch(
      `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/${classifiedId}/verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to verify access code: ${response.statusText}`);
    }

    return response.json();
  },

  // Verify email for Teams Wanted access (public, no auth required)
  async verifyEmail(request: IEmailVerificationRequest): Promise<IEmailVerificationResult> {
    const response = await fetch(`${API_ENDPOINTS.teamsWanted}/verify-email`, {
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
  async getAdminClassifieds(accountId: string, token: string): Promise<IAdminClassifiedsResponse> {
    const response = await fetch(
      `${API_ENDPOINTS.admin}/accounts/${accountId}/player-classifieds`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch admin classifieds: ${response.statusText}`);
    }

    return response.json();
  },

  // ============================================================================
  // ANALYTICS OPERATIONS
  // ============================================================================

  // Get analytics for classifieds
  async getAnalytics(
    accountId: string,
    params: Partial<IClassifiedAnalytics> | undefined,
    token: string,
  ): Promise<IClassifiedAnalytics> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, v.toString()));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }

    const response = await fetch(
      `${API_ENDPOINTS.analytics}/${accountId}/player-classifieds/analytics?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`);
    }

    return response.json();
  },
};
