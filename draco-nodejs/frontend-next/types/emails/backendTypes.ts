/**
 * Backend API Types
 * These types represent the actual structure of data returned from the backend API
 */

/**
 * Backend manager data structure
 */
export interface BackendManager {
  id: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone1?: string | null;
  phone2?: string | null;
  phone3?: string | null;
  hasValidEmail: boolean;
  allTeams: BackendLeagueTeam[];
}

/**
 * Backend league team data structure
 */
export interface BackendLeagueTeam {
  leagueSeasonId: string;
  teamSeasonId: string;
  teamName: string;
  leagueName: string;
}

/**
 * Backend managers response structure
 */
export interface BackendManagersResponse {
  managers: BackendManager[];
  leagueNames: Record<string, string>;
  teamNames: Record<string, string>;
}

/**
 * Backend API error response
 */
export interface BackendErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

/**
 * Backend search response structure
 */
export interface BackendSearchResponse {
  managers: BackendManager[];
  leagueNames: Record<string, string>;
  teamNames: Record<string, string>;
  totalCount: number;
  hasMore: boolean;
}

/**
 * Backend pagination parameters
 */
export interface BackendPaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Backend search parameters
 */
export interface BackendSearchParams {
  q?: string;
  leagueId?: string;
  teamId?: string;
  sortBy?: 'name' | 'email' | 'teamCount';
  sortOrder?: 'asc' | 'desc';
}
