/**
 * Email Recipient Service
 * API service for fetching recipient data for email composition
 * Enhanced with comprehensive error handling and retry logic
 */

import {
  ContactType,
  ContactSearchParamsType,
  ContactSearchParamsSchema,
  PagedContactType,
  BaseContactType,
  PaginationType,
} from '@draco/shared-schemas';
import { RecipientContact, League } from '../types/emails/recipients';
import { EmailRecipientErrorCode, AsyncResult, Result } from '../types/errors';
import {
  handleApiError,
  withRetry,
  safeAsync,
  logError,
  createEmailRecipientError,
  normalizeError,
} from '../utils/errorHandling';
import {
  getCurrentSeason,
  getSeasonParticipantCount,
  listSeasonLeagueSeasons,
  searchContacts as apiSearchContacts,
} from '@draco/shared-api-client';
import { createApiClient } from '../lib/apiClientFactory';
import { unwrapApiResult } from '../utils/apiResult';
import { mapLeagueSetup } from '../utils/leagueSeasonMapper';

// Season interface matching backend response
export interface Season {
  id: string;
  name: string;
  accountId: string;
}

// Team interface for recipient selection
export interface BackendTeam {
  id: string;
  teamId: string;
  name: string;
  webAddress: string | null;
  youtubeUserId: string | null;
  defaultVideo: string | null;
  autoPlayVideo: boolean;
  leagueId?: string;
  leagueName?: string;
  divisionId?: string;
  divisionName?: string;
}

// Options for fetching contacts
export interface ContactFetchOptions {
  seasonId?: string;
  roles?: boolean;
  contactDetails?: boolean;
  teamId?: string;
  roleFilter?: string;
  page?: number;
  limit?: number;
}

// Search options
export interface ContactSearchOptions {
  seasonId?: string;
  roles?: boolean;
  contactDetails?: boolean;
  page?: number;
  limit?: number;
}

// Service response interfaces with proper error handling
export interface ContactsResponse {
  success: boolean;
  data: {
    contacts: ContactType[];
  };
  pagination?: {
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface TeamsResponse {
  success: boolean;
  data: {
    teams: BackendTeam[];
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Interface matching actual backend response structure
interface BaseContact {
  id: string;
  firstname: string;
  lastname: string;
  middlename?: string;
  email: string | null;
}

interface TeamManagerWithTeams extends BaseContact {
  teams: Array<{
    teamSeasonId: string;
    teamName: string;
  }>;
}

export interface AutomaticRoleHoldersResponse {
  success: boolean;
  data: {
    accountOwner: BaseContact;
    teamManagers: TeamManagerWithTeams[];
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Enhanced service configuration
interface ServiceConfig {
  enableRetries: boolean;
  maxRetries: number;
  timeoutMs: number;
  enableCaching: boolean;
  cacheExpiryMs: number;
}

const defaultServiceConfig: ServiceConfig = {
  enableRetries: true,
  maxRetries: 3,
  timeoutMs: 30000,
  enableCaching: false,
  cacheExpiryMs: 300000, // 5 minutes
};

/**
 * Enhanced Email Recipient Service
 * Provides API access for fetching contacts, teams, and roles for email recipient selection
 * with comprehensive error handling, retry logic, and type safety
 */
export class EmailRecipientService {
  private config: ServiceConfig;
  private abortController?: AbortController;

  constructor(config: Partial<ServiceConfig> = {}) {
    this.config = { ...defaultServiceConfig, ...config };
  }

  /**
   * Get request headers with authentication and validation
   */
  private getHeaders(token: string | null): Result<HeadersInit> {
    if (!token || token.trim() === '') {
      return {
        success: false,
        error: createEmailRecipientError(
          EmailRecipientErrorCode.AUTHENTICATION_REQUIRED,
          'Authentication token is required',
          { context: { operation: 'get_headers' } },
        ),
      };
    }

    return {
      success: true,
      data: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  /**
   * Enhanced API response handler with comprehensive error handling
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle non-ok responses with detailed error handling
    if (!response.ok) {
      let responseData: unknown;
      try {
        responseData = await response.json();
      } catch {
        // Response is not JSON, use status text
        responseData = { message: response.statusText };
      }

      throw handleApiError(response, responseData);
    }

    let data: T;
    try {
      data = await response.json();
    } catch (error) {
      throw createEmailRecipientError(
        EmailRecipientErrorCode.INVALID_DATA,
        'Failed to parse API response',
        {
          details: { parseError: error, status: response.status },
          context: {
            operation: 'parse_response',
            additionalData: { endpoint: response.url },
          },
        },
      );
    }

    // Validate response structure
    if (typeof data === 'object' && data !== null && 'success' in data) {
      const responseObj = data as { success: boolean; message?: string; data?: unknown };
      if (!responseObj.success) {
        throw createEmailRecipientError(
          EmailRecipientErrorCode.API_UNAVAILABLE,
          responseObj.message || 'API request failed',
          {
            details: responseObj.data || responseObj,
            context: {
              operation: 'api_response_validation',
              additionalData: { endpoint: response.url },
            },
          },
        );
      }
    }

    return data;
  }

  /**
   * Create fetch request with timeout and abort signal
   */
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    // Create new abort controller for this request
    this.abortController = new AbortController();

    // Set up timeout
    const timeoutId = setTimeout(() => {
      this.abortController?.abort();
    }, this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw createEmailRecipientError(EmailRecipientErrorCode.API_TIMEOUT, 'Request timeout', {
            details: { timeoutMs: this.config.timeoutMs, url },
            context: {
              operation: 'fetch_request',
              additionalData: { endpoint: url },
            },
          });
        }

        if (error.message.includes('fetch')) {
          throw createEmailRecipientError(
            EmailRecipientErrorCode.NETWORK_ERROR,
            'Network request failed',
            {
              details: { originalError: error.message, url },
              context: {
                operation: 'fetch_request',
                additionalData: { endpoint: url },
              },
            },
          );
        }
      }

      throw normalizeError(error, {
        operation: 'fetch_request',
        additionalData: { endpoint: url },
      });
    }
  }

  /**
   * Execute API request with retry logic and error handling
   */
  private async executeRequest<T>(
    operation: () => Promise<T>,
    context: { operation: string; additionalData?: Record<string, unknown> },
  ): AsyncResult<T> {
    if (this.config.enableRetries) {
      return safeAsync(
        () =>
          withRetry(operation, {
            maxRetries: this.config.maxRetries,
            retryCondition: (error) => error.retryable && !error.code.includes('AUTHENTICATION'),
          }),
        context,
      );
    } else {
      return safeAsync(operation, context);
    }
  }

  /**
   * Fetch all contacts for an account with optional filters
   */
  async fetchContacts(
    accountId: string,
    token: string | null,
    options: ContactFetchOptions = {},
  ): Promise<{ contacts: BaseContactType[]; pagination?: PaginationType }> {
    if (!accountId || accountId.trim() === '') {
      throw createEmailRecipientError(
        EmailRecipientErrorCode.INVALID_DATA,
        'Account ID is required',
        { context: { operation: 'fetch_contacts' } },
      );
    }

    const params: ContactSearchParamsType = ContactSearchParamsSchema.parse({
      seasonId: options.seasonId,
      roles: options.roles,
      contactDetails: options.contactDetails,
      includeInactive: false,
      includeRoles: false,
      onlyWithRoles: false,
      ...(options.page !== undefined || options.limit !== undefined
        ? {
            paging: {
              ...(options.page !== undefined ? { page: options.page } : {}),
              ...(options.limit !== undefined ? { limit: options.limit } : {}),
            },
          }
        : {}),
    });

    const apiClient = createApiClient({ token: token || undefined });
    const searchedContactsResult = await apiSearchContacts({
      client: apiClient,
      path: { accountId },
      query: params,
      throwOnError: false,
    });

    const searchedContacts = unwrapApiResult(
      searchedContactsResult,
      'Failed to load contacts',
    ) as PagedContactType;
    return {
      contacts: searchedContacts.contacts,
      pagination: searchedContacts.pagination,
    };
  }

  /**
   * Search contacts by query string
   */
  async searchContacts(
    accountId: string,
    token: string | null,
    query: string,
    options: ContactSearchOptions = {},
  ): AsyncResult<{ contacts: ContactType[]; pagination?: ContactsResponse['pagination'] }> {
    if (!accountId || accountId.trim() === '') {
      return {
        success: false,
        error: createEmailRecipientError(
          EmailRecipientErrorCode.INVALID_DATA,
          'Account ID is required',
          { context: { operation: 'search_contacts' } },
        ),
      };
    }

    if (!query || query.trim() === '') {
      return {
        success: false,
        error: createEmailRecipientError(
          EmailRecipientErrorCode.VALIDATION_FAILED,
          'Search query is required',
          { context: { operation: 'search_contacts', accountId, query } },
        ),
      };
    }

    const headersResult = this.getHeaders(token);
    if (!headersResult.success) {
      return { success: false, error: headersResult.error };
    }

    const params = new URLSearchParams();
    params.append('q', query.trim());
    if (options.seasonId) params.append('seasonId', options.seasonId);
    if (options.roles) params.append('roles', 'true');
    if (options.contactDetails) params.append('contactDetails', 'true');
    if (options.page !== undefined) params.append('page', options.page.toString());
    if (options.limit !== undefined) params.append('limit', options.limit.toString());

    const url = `/api/accounts/${accountId}/contacts?${params.toString()}`;

    return this.executeRequest(
      async () => {
        const response = await this.fetchWithTimeout(url, {
          headers: headersResult.data,
        });

        const data = await this.handleResponse<ContactsResponse>(response);

        if (!data.data?.contacts || !Array.isArray(data.data.contacts)) {
          throw createEmailRecipientError(
            EmailRecipientErrorCode.SEARCH_FAILED,
            'Invalid search response format',
            {
              details: { responseData: data, query },
              context: { operation: 'search_contacts', accountId, query },
            },
          );
        }

        return {
          contacts: data.data.contacts,
          pagination: data.pagination,
        };
      },
      {
        operation: 'search_contacts',
        additionalData: { endpoint: url },
      },
    );
  }

  /**
   * Get the current active season for an account
   */
  async fetchCurrentSeason(accountId: string, token: string | null): AsyncResult<Season | null> {
    if (!accountId || accountId.trim() === '') {
      return {
        success: false,
        error: createEmailRecipientError(
          EmailRecipientErrorCode.INVALID_DATA,
          'Account ID is required',
          { context: { operation: 'fetch_current_season' } },
        ),
      };
    }

    return this.executeRequest(
      async () => {
        const apiClient = createApiClient({ token: token || undefined });
        const result = await getCurrentSeason({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });

        const season = unwrapApiResult(result, 'Failed to fetch current season');

        return {
          id: season.id,
          name: season.name,
          accountId: season.accountId,
        } satisfies Season;
      },
      {
        operation: 'fetch_current_season',
        additionalData: { endpoint: 'openapi:getCurrentSeason' },
      },
    );
  }

  /**
   * Fetch all teams for a specific season
   */
  async fetchTeams(
    accountId: string,
    token: string | null,
    seasonId: string,
  ): AsyncResult<BackendTeam[]> {
    if (!accountId || accountId.trim() === '') {
      return {
        success: false,
        error: createEmailRecipientError(
          EmailRecipientErrorCode.INVALID_DATA,
          'Account ID is required',
          { context: { operation: 'fetch_teams' } },
        ),
      };
    }

    if (!seasonId || seasonId.trim() === '') {
      return {
        success: false,
        error: createEmailRecipientError(
          EmailRecipientErrorCode.INVALID_DATA,
          'Season ID is required',
          { context: { operation: 'fetch_teams', accountId } },
        ),
      };
    }

    const headersResult = this.getHeaders(token);
    if (!headersResult.success) {
      return { success: false, error: headersResult.error };
    }

    const url = `/api/accounts/${accountId}/seasons/${seasonId}/teams`;

    return this.executeRequest(
      async () => {
        const response = await this.fetchWithTimeout(url, {
          headers: headersResult.data,
        });

        const data = await this.handleResponse<TeamsResponse>(response);

        if (!data.data?.teams || !Array.isArray(data.data.teams)) {
          throw createEmailRecipientError(
            EmailRecipientErrorCode.INVALID_DATA,
            'Invalid teams response format',
            {
              details: { responseData: data },
              context: { operation: 'fetch_teams', accountId, seasonId },
            },
          );
        }

        return data.data.teams;
      },
      {
        operation: 'fetch_teams',
        additionalData: { endpoint: url },
      },
    );
  }

  /**
   * Fetch roster (players) for a specific team in a season
   */
  async fetchTeamRoster(
    accountId: string,
    token: string | null,
    seasonId: string,
    teamSeasonId: string,
  ): AsyncResult<ContactType[]> {
    const headersResult = this.getHeaders(token);
    if (!headersResult.success) {
      return { success: false, error: headersResult.error };
    }

    const url = `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster`;

    return this.executeRequest(
      async () => {
        const response = await this.fetchWithTimeout(url, {
          headers: headersResult.data,
        });

        const data = await this.handleResponse<ContactsResponse>(response);
        return data.data.contacts;
      },
      {
        operation: 'fetch_team_roster',
        additionalData: { endpoint: url },
      },
    );
  }

  /**
   * Fetch managers for a specific team in a season
   */
  async fetchTeamManagers(
    accountId: string,
    token: string | null,
    seasonId: string,
    teamSeasonId: string,
  ): AsyncResult<ContactType[]> {
    const headersResult = this.getHeaders(token);
    if (!headersResult.success) {
      return { success: false, error: headersResult.error };
    }

    const url = `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/managers`;

    return this.executeRequest(
      async () => {
        const response = await this.fetchWithTimeout(url, {
          headers: headersResult.data,
        });

        const data = await this.handleResponse<ContactsResponse>(response);
        return data.data.contacts;
      },
      {
        operation: 'fetch_team_managers',
        additionalData: { endpoint: url },
      },
    );
  }

  /**
   * Fetch leagues for a specific season
   */
  async fetchLeagues(
    accountId: string,
    token: string | null,
    seasonId: string,
    includePlayerCounts: boolean = false,
    includeManagerCounts: boolean = false,
  ): AsyncResult<League[]> {
    if (!accountId || accountId.trim() === '') {
      return {
        success: false,
        error: createEmailRecipientError(
          EmailRecipientErrorCode.INVALID_DATA,
          'Account ID is required',
          { context: { operation: 'fetch_leagues' } },
        ),
      };
    }

    if (!seasonId || seasonId.trim() === '') {
      return {
        success: false,
        error: createEmailRecipientError(
          EmailRecipientErrorCode.INVALID_DATA,
          'Season ID is required',
          { context: { operation: 'fetch_leagues', accountId } },
        ),
      };
    }

    const headersResult = this.getHeaders(token);
    if (!headersResult.success) {
      return { success: false, error: headersResult.error };
    }

    const apiClient = createApiClient({ token: token || undefined });

    return this.executeRequest(
      async () => {
        const result = await listSeasonLeagueSeasons({
          client: apiClient,
          path: { accountId, seasonId },
          query: {
            includeTeams: true,
            includeUnassignedTeams: true,
            includePlayerCounts: includePlayerCounts || includeManagerCounts ? true : undefined,
            includeManagerCounts: includeManagerCounts || undefined,
          },
          throwOnError: false,
        });

        const data = unwrapApiResult(result, 'Failed to load leagues');
        const mapped = mapLeagueSetup(data, accountId);

        if (!mapped.leagueSeasons || !Array.isArray(mapped.leagueSeasons)) {
          throw createEmailRecipientError(
            EmailRecipientErrorCode.INVALID_DATA,
            'Invalid leagues response format',
            {
              context: { operation: 'fetch_leagues', accountId, seasonId },
            },
          );
        }

        const seasonInfo = mapped.season ?? {
          id: seasonId,
          name: '',
          accountId,
        };

        const leagues: League[] = mapped.leagueSeasons.map((ls) => ({
          id: ls.leagueId,
          name: ls.leagueName,
          divisions: ls.divisions.map((division) => ({
            id: division.divisionId,
            name: division.divisionName,
            teams: division.teams.map((team) => ({
              id: team.id,
              name: team.name,
              playerCount: team.playerCount ?? 0,
              leagueId: ls.leagueId,
              leagueName: ls.leagueName,
              divisionId: division.divisionId,
              divisionName: division.divisionName,
            })),
            teamCount: division.teamCount,
            totalPlayers: division.totalPlayers,
          })),
          teamCount: ls.totalTeams,
          totalPlayers: ls.totalPlayers,
          seasonId: seasonInfo.id,
          seasonName: seasonInfo.name,
        }));

        return leagues;
      },
      {
        operation: 'fetch_leagues',
        additionalData: { endpoint: 'openapi:listSeasonLeagueSeasons' },
      },
    );
  }

  /**
   * Fetch season participants count for a specific season
   */
  async fetchSeasonParticipantsCount(
    accountId: string,
    token: string | null,
    seasonId: string,
  ): AsyncResult<number> {
    if (!accountId || accountId.trim() === '') {
      return {
        success: false,
        error: createEmailRecipientError(
          EmailRecipientErrorCode.INVALID_DATA,
          'Account ID is required',
          { context: { operation: 'fetch_season_participants_count' } },
        ),
      };
    }

    if (!seasonId || seasonId.trim() === '') {
      return {
        success: false,
        error: createEmailRecipientError(
          EmailRecipientErrorCode.INVALID_DATA,
          'Season ID is required',
          { context: { operation: 'fetch_season_participants_count', accountId } },
        ),
      };
    }

    return this.executeRequest(
      async () => {
        const apiClient = createApiClient({ token: token || undefined });
        const result = await getSeasonParticipantCount({
          client: apiClient,
          path: { accountId, seasonId },
          throwOnError: false,
        });

        const data = unwrapApiResult(result, 'Failed to load season participant count');

        if (typeof data.participantCount !== 'number') {
          throw createEmailRecipientError(
            EmailRecipientErrorCode.INVALID_DATA,
            'Invalid season participants count response format',
            {
              details: { responseData: data },
              context: { operation: 'fetch_season_participants_count', accountId, seasonId },
            },
          );
        }

        return data.participantCount;
      },
      {
        operation: 'fetch_season_participants_count',
        additionalData: { endpoint: 'openapi:getSeasonParticipantCount' },
      },
    );
  }

  /**
   * Get comprehensive recipient data for an account
   * This is the main method that fetches all data needed for recipient selection
   * Enhanced with proper error handling and data validation
   *
   * NOTE: This method now only fetches essential data by default.
   * Use getTeamDataOnDemand() to fetch team rosters/managers when needed.
   */
  async getRecipientData(
    accountId: string,
    token: string | null,
    seasonId?: string,
    _options?: {
      includeTeamManagers?: boolean; // Only fetch team managers when needed
      includeTeamRosters?: boolean; // Only fetch team rosters when needed
    },
  ): AsyncResult<{
    contacts: RecipientContact[];
    currentSeason: Season | null;
    pagination?: ContactsResponse['pagination'];
  }> {
    if (!accountId || accountId.trim() === '') {
      return {
        success: false,
        error: createEmailRecipientError(
          EmailRecipientErrorCode.INVALID_DATA,
          'Account ID is required',
          { context: { operation: 'get_recipient_data' } },
        ),
      };
    }

    if (!token || token.trim() === '') {
      return {
        success: false,
        error: createEmailRecipientError(
          EmailRecipientErrorCode.AUTHENTICATION_REQUIRED,
          'Authentication token is required',
          { context: { operation: 'get_recipient_data', accountId } },
        ),
      };
    }

    return this.executeRequest(
      async () => {
        // Get current season if not provided
        let currentSeason: Season | null = null;
        if (seasonId) {
          currentSeason = { id: seasonId, name: '', accountId };
        } else {
          const seasonResult = await this.fetchCurrentSeason(accountId, token);
          if (!seasonResult.success) {
            // Log warning but continue - season is optional
            logError(
              seasonResult.error,
              'Failed to fetch current season, continuing without season data',
            );
          } else {
            currentSeason = seasonResult.data;
          }
        }

        const effectiveSeasonId = seasonId || currentSeason?.id;

        // Fetch data with proper error handling - only fetch first 50 contacts for initial load
        const contactsResult = await this.fetchContacts(accountId, token, {
          seasonId: effectiveSeasonId,
          roles: true,
          contactDetails: true,
          limit: 50, // Only fetch first page for initial load
          page: 1,
        });

        // Handle contacts result
        const contacts = contactsResult.contacts;
        const contactsPagination = contactsResult.pagination;

        const recipientContacts: RecipientContact[] = contacts.map((contact) => ({
          ...contact,
          displayName: contact.firstName + ' ' + contact.lastName,
          hasValidEmail: !!contact.email,
        }));

        return {
          contacts: recipientContacts,
          currentSeason,
          pagination: contactsPagination,
        };
      },
      {
        operation: 'get_recipient_data',
        additionalData: { accountId },
      },
    );
  }
}

/**
 * Create an EmailRecipientService instance
 */
export const createEmailRecipientService = (): EmailRecipientService => {
  return new EmailRecipientService();
};
