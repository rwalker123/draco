// Player Classifieds Service
// Handles all API interactions for Player Classifieds feature

import { axiosInstance, api } from '../utils/axiosConfig';
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
import { handleAxiosError } from '../utils/errorHandling';

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
  ): Promise<IPlayersWantedResponse> {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.playersWanted}/${accountId}/player-classifieds/players-wanted`,
        data,
      );
      return response.data.data;
    } catch (error) {
      await handleAxiosError(error, 'Failed to create Players Wanted');
      throw error;
    }
  },

  // Get all Players Wanted for an account
  async getPlayersWanted(
    accountId: string,
    params?: Partial<IClassifiedSearchParams>,
  ): Promise<IServiceResponse<IClassifiedListResponse<IPlayersWantedResponse>>> {
    const searchParams = this.buildSearchParams(params);

    const url = `${API_ENDPOINTS.playersWanted}/${accountId}/player-classifieds/players-wanted?${searchParams.toString()}`;

    try {
      const response = await axiosInstance.get(url);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: unknown) {
      // Handle axios errors
      const err = error as {
        response?: { data?: { message?: string }; statusText?: string; status?: number };
        message?: string;
      };
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Failed to fetch Players Wanted',
        errorCode: err.response?.statusText || 'NETWORK_ERROR',
        statusCode: err.response?.status || 0,
      };
    }
  },

  // Get a specific Players Wanted by ID
  async getPlayersWantedById(
    accountId: string,
    classifiedId: string,
  ): Promise<IPlayersWantedResponse> {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.playersWanted}/${accountId}/player-classifieds/players-wanted/${classifiedId}`,
      );
      return response.data;
    } catch (error) {
      await handleAxiosError(error, 'Failed to fetch Players Wanted');
      throw error;
    }
  },

  // Update a Players Wanted classified
  async updatePlayersWanted(
    accountId: string,
    classifiedId: string,
    data: IPlayersWantedUpdateRequest,
  ): Promise<IPlayersWantedResponse> {
    try {
      const response = await axiosInstance.put(
        `${API_ENDPOINTS.playersWanted}/${accountId}/player-classifieds/players-wanted/${classifiedId}`,
        data,
      );
      return response.data.data;
    } catch (error) {
      await handleAxiosError(error, 'Failed to update Players Wanted');
      throw error;
    }
  },

  // Delete a Players Wanted classified
  async deletePlayersWanted(accountId: string, classifiedId: string): Promise<void> {
    try {
      await axiosInstance.delete(
        `${API_ENDPOINTS.playersWanted}/${accountId}/player-classifieds/players-wanted/${classifiedId}`,
      );
    } catch (error) {
      await handleAxiosError(error, 'Failed to delete Players Wanted');
      throw error;
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
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted`,
        data,
      );
      return response.data.data;
    } catch (error) {
      await handleAxiosError(error, 'Failed to create Teams Wanted');
      throw error;
    }
  },

  // Get all Teams Wanted for an account
  async getTeamsWanted(
    accountId: string,
    params: Partial<IClassifiedSearchParams> | undefined,
  ): Promise<ITeamsWantedServiceResponse> {
    const searchParams = this.buildSearchParams(params);

    const url = `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted?${searchParams.toString()}`;

    try {
      const response = await axiosInstance.get(url);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: unknown) {
      // Handle axios errors
      const err = error as {
        response?: { data?: { message?: string }; statusText?: string; status?: number };
        message?: string;
      };
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Failed to fetch Teams Wanted',
        errorCode: err.response?.statusText || 'NETWORK_ERROR',
        statusCode: err.response?.status || 0,
      };
    }
  },

  // Get a specific Teams Wanted by ID
  async getTeamsWantedById(accountId: string, classifiedId: string): Promise<ITeamsWantedResponse> {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/${classifiedId}`,
      );
      return response.data;
    } catch (error) {
      await handleAxiosError(error, 'Failed to fetch Teams Wanted');
      throw error;
    }
  },

  // Update a Teams Wanted classified (supports both authenticated users and access codes)
  async updateTeamsWanted(
    accountId: string,
    classifiedId: string,
    data: ITeamsWantedUpdateRequest,
    token?: string,
    accessCode?: string,
  ): Promise<ITeamsWantedResponse> {
    // Include access code in request body if provided
    const requestBody = {
      ...data,
      ...(accessCode && { accessCode }),
    };

    let response;
    try {
      if (token) {
        // Regular authenticated update
        response = await axiosInstance.put(
          `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/${classifiedId}`,
          requestBody,
        );
      } else {
        // Access code update (no auth needed)
        response = await axiosInstance.put(
          `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/${classifiedId}`,
          requestBody,
        );
      }
    } catch (error) {
      await handleAxiosError(error, 'Failed to update Teams Wanted');
      throw error;
    }

    const result = response.data;

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

    try {
      if (token) {
        // Regular authenticated delete
        await axiosInstance.delete(
          `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/${classifiedId}`,
          accessCode ? { data: requestBody } : undefined,
        );
      } else {
        // Access code delete (no auth needed)
        await axiosInstance.delete(
          `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/${classifiedId}`,
          {
            data: requestBody,
          },
        );
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to delete Teams Wanted';
      throw new Error(errorMessage);
    }
  },

  // Get contact information for edit purposes (supports both JWT and access code auth)
  async getTeamsWantedContactForEdit(
    accountId: string,
    classifiedId: string,
    accessCode: string,
    token?: string,
  ): Promise<IServiceResponse<{ email: string; phone: string }>> {
    // Build URL with optional access code query parameter
    const url = `/api/accounts/${accountId}/player-classifieds/teams-wanted/${classifiedId}/contact${
      !token && accessCode ? `?accessCode=${encodeURIComponent(accessCode)}` : ''
    }`;

    if (token) {
      return api.get<{ email: string; phone: string }>(url);
    } else {
      return api.get<{ email: string; phone: string }>(url, { skipAuth: true });
    }
  },

  // ============================================================================
  // SEARCH AND MATCHING OPERATIONS
  // ============================================================================

  // Search across all classifieds
  async searchClassifieds(
    accountId: string,
    params: IClassifiedSearchParams,
  ): Promise<IClassifiedSearchResult> {
    const searchParams = this.buildSearchParams(params);

    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.search}/${accountId}/player-classifieds/search?${searchParams.toString()}`,
      );
      return response.data;
    } catch (error) {
      await handleAxiosError(error, 'Failed to search classifieds');
      throw error;
    }
  },

  // Get matches for a specific classified
  async getMatches(
    accountId: string,
    classifiedId: string,
    type: 'players-wanted' | 'teams-wanted',
  ): Promise<IClassifiedMatch[]> {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.matches}/${accountId}/player-classifieds/${type}/${classifiedId}/matches`,
      );
      return response.data;
    } catch (error) {
      await handleAxiosError(error, 'Failed to fetch matches');
      throw error;
    }
  },

  // ============================================================================
  // ACCESS CODE OPERATIONS
  // ============================================================================

  // Verify Teams Wanted access code and retrieve the classified ad (public, no auth required)
  async verifyTeamsWantedAccessCode(
    accountId: string,
    accessCode: string,
  ): Promise<IAccessCodeVerificationResponse> {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/access-code`,
        { accessCode }, // Public endpoint, no auth needed
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err.response?.data?.message || 'Failed to verify access code';
      throw new Error(errorMessage);
    }
  },

  // Get Teams Wanted classified by access code (for verified users, public, no auth required)
  async getTeamsWantedByAccessCode(
    accountId: string,
    accessCode: string,
  ): Promise<ITeamsWantedResponse> {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/access-code`,
        { accessCode }, // Public endpoint, no auth needed
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err.response?.data?.message || 'Failed to retrieve Teams Wanted';
      throw new Error(errorMessage);
    }
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
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.teamsWanted}/${accountId}/player-classifieds/teams-wanted/${classifiedId}/verify`,
        { accessCode }, // Public endpoint, no auth needed
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err.response?.data?.message || 'Failed to verify access code';
      throw new Error(errorMessage);
    }
  },

  // Verify email for Teams Wanted access (public, no auth required)
  async verifyEmail(request: IEmailVerificationRequest): Promise<IEmailVerificationResult> {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.teamsWanted}/verify-email`,
        request, // Public endpoint, no auth needed
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err.response?.data?.message || 'Failed to verify email';
      throw new Error(errorMessage);
    }
  },

  // ============================================================================
  // ADMIN OPERATIONS
  // ============================================================================

  // Get admin view of all classifieds
  async getAdminClassifieds(accountId: string): Promise<IAdminClassifiedsResponse> {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.admin}/accounts/${accountId}/player-classifieds`,
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err.response?.data?.message || 'Failed to fetch admin classifieds';
      throw new Error(errorMessage);
    }
  },

  // ============================================================================
  // ANALYTICS OPERATIONS
  // ============================================================================

  // Get analytics for classifieds
  async getAnalytics(
    accountId: string,
    _params?: Partial<IClassifiedAnalytics>,
  ): Promise<IClassifiedAnalytics> {
    try {
      // Analytics endpoint doesn't use search parameters
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.analytics}/${accountId}/player-classifieds/analytics`,
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err.response?.data?.message || 'Failed to fetch analytics';
      throw new Error(errorMessage);
    }
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
    try {
      await axiosInstance.post(
        `${API_ENDPOINTS.playersWanted}/${accountId}/player-classifieds/players-wanted/${classifiedId}/contact`,
        data, // Public endpoint, no auth needed
      );
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err.response?.data?.message || 'Failed to send contact message';
      throw new Error(errorMessage);
    }
  },
};
