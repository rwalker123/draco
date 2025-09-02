import {
  BackendManager,
  BackendLeagueTeam,
  BackendManagersResponse,
  BackendSearchResponse,
  BackendErrorResponse,
} from '../types/emails/backendTypes';

/**
 * Type Guards for Backend Data Validation
 * These functions ensure type safety when working with backend data
 */

/**
 * Type guard for BackendManager
 */
export function isBackendManager(obj: unknown): obj is BackendManager {
  if (!obj || typeof obj !== 'object') return false;

  const manager = obj as Record<string, unknown>;

  return (
    typeof manager.contactId === 'string' &&
    typeof manager.firstName === 'string' &&
    typeof manager.lastName === 'string' &&
    (manager.email === null || typeof manager.email === 'string') &&
    Array.isArray(manager.allTeams) &&
    manager.allTeams.every(isBackendLeagueTeam) &&
    (manager.phone1 === undefined ||
      manager.phone1 === null ||
      typeof manager.phone1 === 'string') &&
    (manager.phone2 === undefined ||
      manager.phone2 === null ||
      typeof manager.phone2 === 'string') &&
    (manager.phone3 === undefined ||
      manager.phone3 === null ||
      typeof manager.phone3 === 'string') &&
    typeof manager.hasValidEmail === 'boolean'
  );
}

/**
 * Type guard for BackendLeagueTeam
 */
export function isBackendLeagueTeam(obj: unknown): obj is BackendLeagueTeam {
  if (!obj || typeof obj !== 'object') return false;

  const team = obj as Record<string, unknown>;

  return (
    typeof team.leagueSeasonId === 'string' &&
    typeof team.teamSeasonId === 'string' &&
    typeof team.teamName === 'string' &&
    typeof team.leagueName === 'string'
  );
}

/**
 * Type guard for BackendManagersResponse
 */
export function isBackendManagersResponse(obj: unknown): obj is BackendManagersResponse {
  if (!obj || typeof obj !== 'object') return false;

  const response = obj as Record<string, unknown>;

  return (
    Array.isArray(response.managers) &&
    response.managers.every(isBackendManager) &&
    typeof response.leagueNames === 'object' &&
    response.leagueNames !== null &&
    typeof response.teamNames === 'object' &&
    response.teamNames !== null
  );
}

/**
 * Type guard for BackendSearchResponse
 */
export function isBackendSearchResponse(obj: unknown): obj is BackendSearchResponse {
  if (!obj || typeof obj !== 'object') return false;

  const response = obj as Record<string, unknown>;

  return (
    Array.isArray(response.managers) &&
    response.managers.every(isBackendManager) &&
    typeof response.leagueNames === 'object' &&
    response.leagueNames !== null &&
    typeof response.teamNames === 'object' &&
    response.teamNames !== null &&
    typeof response.totalCount === 'number' &&
    typeof response.hasMore === 'boolean'
  );
}

/**
 * Type guard for BackendErrorResponse
 */
export function isBackendErrorResponse(obj: unknown): obj is BackendErrorResponse {
  if (!obj || typeof obj !== 'object') return false;

  const error = obj as Record<string, unknown>;

  return (
    typeof error.error === 'string' &&
    typeof error.message === 'string' &&
    typeof error.statusCode === 'number'
  );
}

/**
 * Type guard for string record (league names, team names)
 */
export function isStringRecord(obj: unknown): obj is Record<string, string> {
  if (!obj || typeof obj !== 'object') return false;

  return Object.entries(obj).every(
    ([key, value]) => typeof key === 'string' && typeof value === 'string',
  );
}

/**
 * Safe array check with type guard
 */
export function isArrayOf<T>(arr: unknown, typeGuard: (item: unknown) => item is T): arr is T[] {
  return Array.isArray(arr) && arr.every(typeGuard);
}

/**
 * Safe string conversion with validation
 */
export function safeString(value: unknown, defaultValue = ''): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return defaultValue;
  return String(value);
}

/**
 * Safe number conversion with validation
 */
export function safeNumber(value: unknown, defaultValue = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Safe boolean conversion with validation
 */
export function safeBoolean(value: unknown, defaultValue = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return defaultValue;
}
