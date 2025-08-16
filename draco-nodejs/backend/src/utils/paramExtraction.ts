/**
 * Utility functions for extracting and validating route parameters
 * Addresses the duplication of parameter extraction logic across route files
 */

/**
 * Extracts and converts multiple parameters to BigInt with validation
 * @param params - The request params object
 * @param keys - The parameter keys to extract
 * @returns Object with extracted BigInt values
 * @throws Error if any required parameter is missing
 */
export const extractBigIntParams = <T extends string>(
  params: Record<string, string | undefined>,
  ...keys: T[]
): Record<T, bigint> => {
  const result = {} as Record<T, bigint>;

  for (const key of keys) {
    if (!params[key]) {
      throw new Error(`Missing required parameter: ${key}`);
    }

    const value = params[key]!;

    // Check for temporary IDs created by frontend optimistic updates
    if (value.startsWith('temp-')) {
      throw new Error(`Operation in progress for ${key}, please try again in a moment`);
    }

    try {
      result[key] = BigInt(value);
    } catch (_error) {
      throw new Error(`Invalid parameter ${key}: must be a valid number`);
    }
  }

  return result;
};

/**
 * Extracts account ID from request params
 * @param params - The request params object
 * @returns Object with accountId as BigInt
 */
export const extractAccountParams = (params: Record<string, string | undefined>) => {
  return extractBigIntParams(params, 'accountId');
};

/**
 * Extracts account and season IDs from request params
 * @param params - The request params object
 * @returns Object with accountId and seasonId as BigInt
 */
export const extractSeasonParams = (params: Record<string, string | undefined>) => {
  return extractBigIntParams(params, 'accountId', 'seasonId');
};

/**
 * Extracts account, season, and team season IDs from request params
 * @param params - The request params object
 * @returns Object with accountId, seasonId, and teamSeasonId as BigInt
 */
export const extractTeamParams = (params: Record<string, string | undefined>) => {
  return extractBigIntParams(params, 'accountId', 'seasonId', 'teamSeasonId');
};

/**
 * Extracts account, season, and game IDs from request params
 * @param params - The request params object
 * @returns Object with accountId, seasonId, and gameId as BigInt
 */
export const extractGameParams = (params: Record<string, string | undefined>) => {
  return extractBigIntParams(params, 'accountId', 'seasonId', 'gameId');
};

/**
 * Extracts account and game IDs from request params (for routes without season)
 * @param params - The request params object
 * @returns Object with accountId and gameId as BigInt
 */
export const extractGameOnlyParams = (params: Record<string, string | undefined>) => {
  return extractBigIntParams(params, 'accountId', 'gameId');
};

/**
 * Extracts account, season, and league season IDs from request params
 * @param params - The request params object
 * @returns Object with accountId, seasonId, and leagueSeasonId as BigInt
 */
export const extractLeagueSeasonParams = (params: Record<string, string | undefined>) => {
  return extractBigIntParams(params, 'accountId', 'seasonId', 'leagueSeasonId');
};

/**
 * Extracts account, season, and division season IDs from request params
 * @param params - The request params object
 * @returns Object with accountId, seasonId, and divisionSeasonId as BigInt
 */
export const extractDivisionSeasonParams = (params: Record<string, string | undefined>) => {
  return extractBigIntParams(params, 'accountId', 'seasonId', 'divisionSeasonId');
};

/**
 * Extracts account and contact IDs from request params
 * @param params - The request params object
 * @returns Object with accountId and contactId as BigInt
 */
export const extractContactParams = (params: Record<string, string | undefined>) => {
  return extractBigIntParams(params, 'accountId', 'contactId');
};

/**
 * Extracts account, season, game, and team season IDs from request params (for recap routes)
 * @param params - The request params object
 * @returns Object with accountId, seasonId, gameId, and teamSeasonId as BigInt
 */
export const extractRecapParams = (params: Record<string, string | undefined>) => {
  return extractBigIntParams(params, 'accountId', 'seasonId', 'gameId', 'teamSeasonId');
};
