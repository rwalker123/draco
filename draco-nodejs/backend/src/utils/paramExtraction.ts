/**
 * Utility functions for extracting and validating route parameters
 * Addresses the duplication of parameter extraction logic across route files
 */

export type ParamValue = string | string[] | undefined;
export type ParamsObject = Record<string, ParamValue>;

/**
 * Extracts a single string value from a param that may be string, string[], or query string type
 */
export const getStringParam = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }
  return undefined;
};

/**
 * Parse query parameters for pagination and filtering
 * @param query - The request query object
 * @returns Object with page, limit, firstName, and lastName
 */
export const parseSearchQueryParams = (query: ParamsObject) => {
  return {
    page: Math.max(1, parseInt(String(getStringParam(query.page) || ''), 10) || 1),
    limit: Math.min(
      100,
      Math.max(1, parseInt(String(getStringParam(query.limit) || ''), 10) || 50),
    ),
    firstName: getStringParam(query.firstName)?.trim() || undefined,
    lastName: getStringParam(query.lastName)?.trim() || undefined,
  };
};

/**
 * Extracts and converts multiple parameters to BigInt with validation
 * @param params - The request params object
 * @param keys - The parameter keys to extract
 * @returns Object with extracted BigInt values
 * @throws Error if any required parameter is missing
 */
export const extractBigIntParams = <T extends string>(
  params: ParamsObject,
  ...keys: T[]
): Record<T, bigint> => {
  const result = {} as Record<T, bigint>;

  for (const key of keys) {
    const value = getStringParam(params[key]);
    if (!value) {
      throw new Error(`Missing required parameter: ${key}`);
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
export const extractAccountParams = (params: ParamsObject) => {
  return extractBigIntParams(params, 'accountId');
};

/**
 * Extracts account and season IDs from request params
 * @param params - The request params object
 * @returns Object with accountId and seasonId as BigInt
 */
export const extractSeasonParams = (params: ParamsObject) => {
  return extractBigIntParams(params, 'accountId', 'seasonId');
};

/**
 * Extracts account, season, and team season IDs from request params
 * @param params - The request params object
 * @returns Object with accountId, seasonId, and teamSeasonId as BigInt
 */
export const extractTeamParams = (params: ParamsObject) => {
  return extractBigIntParams(params, 'accountId', 'seasonId', 'teamSeasonId');
};

/**
 * Extracts account, season, and game IDs from request params
 * @param params - The request params object
 * @returns Object with accountId, seasonId, and gameId as BigInt
 */
export const extractGameParams = (params: ParamsObject) => {
  return extractBigIntParams(params, 'accountId', 'seasonId', 'gameId');
};

/**
 * Extracts account and game IDs from request params (for routes without season)
 * @param params - The request params object
 * @returns Object with accountId and gameId as BigInt
 */
export const extractGameOnlyParams = (params: ParamsObject) => {
  return extractBigIntParams(params, 'accountId', 'gameId');
};

/**
 * Extracts account, season, and league season IDs from request params
 * @param params - The request params object
 * @returns Object with accountId, seasonId, and leagueSeasonId as BigInt
 */
export const extractLeagueSeasonParams = (params: ParamsObject) => {
  return extractBigIntParams(params, 'accountId', 'seasonId', 'leagueSeasonId');
};

/**
 * Extracts account, season, and division season IDs from request params
 * @param params - The request params object
 * @returns Object with accountId, seasonId, and divisionSeasonId as BigInt
 */
export const extractDivisionSeasonParams = (params: ParamsObject) => {
  return extractBigIntParams(params, 'accountId', 'seasonId', 'divisionSeasonId');
};

/**
 * Extracts account and contact IDs from request params
 * @param params - The request params object
 * @returns Object with accountId and contactId as BigInt
 */
export const extractContactParams = (params: ParamsObject) => {
  return extractBigIntParams(params, 'accountId', 'contactId');
};

/**
 * Extracts account, season, game, and team season IDs from request params (for recap routes)
 * @param params - The request params object
 * @returns Object with accountId, seasonId, gameId, and teamSeasonId as BigInt
 */
export const extractRecapParams = (params: ParamsObject) => {
  return extractBigIntParams(params, 'accountId', 'seasonId', 'gameId', 'teamSeasonId');
};
