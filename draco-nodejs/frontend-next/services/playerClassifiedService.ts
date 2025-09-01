// Player Classifieds Service
// Handles all API interactions for Player Classifieds feature

import { apiRequest } from '../utils/apiClient';
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
import { handleApiErrorResponse } from '../utils/errorHandling';

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
  /**
   * Private method to build URLSearchParams from IClassifiedSearchParams
   */
  buildSearchParams(params?: Partial<IClassifiedSearchParams>): URLSearchParams {
    const searchParams = new URLSearchParams();

    if (!params) {
      return searchParams;
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Handle arrays by appending each value separately
          value.forEach((v) => searchParams.append(key, v.toString()));
        } else if (value instanceof Date) {
          // Handle Date objects by converting to ISO string
          searchParams.append(key, value.toISOString());
        } else {
          // Handle all other types by converting to string
          searchParams.append(key, value.toString());
        }
      }
    });

    return searchParams;
  },
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
      await handleApiErrorResponse(response, 'Failed to create Players Wanted');
    }

    const result = await response.json();
    return result.data;
  },

  // Get all Players Wanted for an account
  async getPlayersWanted(
    accountId: string,
    params?: Partial<IClassifiedSearchParams>,
  ): Promise<IServiceResponse<IClassifiedListResponse<IPlayersWantedResponse>>> {
    const searchParams = this.buildSearchParams(params);

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
      await handleApiErrorResponse(response, 'Failed to fetch Players Wanted');
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
      await handleApiErrorResponse(response, 'Failed to update Players Wanted');
    }

    const result = await response.json();
    return result.data;
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
      await handleApiErrorResponse(response, 'Failed to delete Players Wanted');
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
      await handleApiErrorResponse(response, 'Failed to create Teams Wanted');
    }

    const result = await response.json();
    return result.data;
  },

  // Get all Teams Wanted for an account
  async getTeamsWanted(
    accountId: string,
    params: Partial<IClassifiedSearchParams> | undefined,
    token: string,
  ): Promise<ITeamsWantedServiceResponse> {
    const searchParams = this.buildSearchParams(params);

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
      await handleApiErrorResponse(response, 'Failed to fetch Teams Wanted');
    }

    return response.json();
  },

  // Update a Teams Wanted classified (supports both authenticated users and access codes)
  async updateTeamsWanted(
    accountId: string,
    classifiedId: string,
    data: ITeamsWantedUpdateRequest,
    token?: string,
    accessCode?: string,
  ): Promise<ITeamsWantedResponse> {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    // Include access code in request body if provided
    const requestBody = {
      ...data,
      ...(accessCode && { accessCode }),
    };

    const response = await fetch(
      `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/${classifiedId}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      await handleApiErrorResponse(response, 'Failed to update Teams Wanted');
    }

    const result = await response.json();

    // Handle both direct classified objects and wrapped responses
    if (result && typeof result === 'object' && 'success' in result && result.data) {
      return result.data;
    }

    return result;
  },

  // Delete a Teams Wanted classified (supports both authenticated users and access codes)
  async deleteTeamsWanted(
    accountId: string,
    classifiedId: string,
    token?: string,
    accessCode?: string,
  ): Promise<void> {
    const requestBody: { accessCode?: string } = {};

    // Add access code to request body if provided (for anonymous users)
    if (accessCode) {
      requestBody.accessCode = accessCode;
    }

    const response = await fetch(
      `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/${classifiedId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        // Only send body if we have an access code
        ...(accessCode && { body: JSON.stringify(requestBody) }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete Teams Wanted: ${response.statusText}`);
    }
  },

  // Get contact information for edit purposes (supports both JWT and access code auth)
  async getTeamsWantedContactForEdit(
    accountId: string,
    classifiedId: string,
    accessCode: string,
    token?: string,
  ): Promise<IServiceResponse<{ email: string; phone: string }>> {
    const headers: Record<string, string> = {};

    // Add JWT token if provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Build URL with optional access code query parameter
    const url = `/api/accounts/${accountId}/player-classifieds/teams-wanted/${classifiedId}/contact${
      !token && accessCode ? `?accessCode=${encodeURIComponent(accessCode)}` : ''
    }`;

    return apiRequest<{ email: string; phone: string }>(url, {
      method: 'GET',
      headers,
    });
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
    const searchParams = this.buildSearchParams(params);

    const response = await fetch(
      `${API_ENDPOINTS.search}/${accountId}/player-classifieds/search?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      await handleApiErrorResponse(response, 'Failed to search classifieds');
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
      await handleApiErrorResponse(response, 'Failed to fetch matches');
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
    // Analytics endpoint doesn't use search parameters
    const response = await fetch(
      `${API_ENDPOINTS.analytics}/${accountId}/player-classifieds/analytics`,
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

  // ============================================================================
  // CONTACT OPERATIONS
  // ============================================================================

  // Send contact message to Players Wanted creator
  async contactPlayersWantedCreator(
    accountId: string,
    classifiedId: string,
    data: {
      senderName: string;
      senderEmail: string;
      message: string;
    },
  ): Promise<void> {
    const response = await fetch(
      `${API_ENDPOINTS.playersWanted}/${accountId}/player-classifieds/players-wanted/${classifiedId}/contact`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to send contact message: ${response.statusText}`,
      );
    }
  },
};
