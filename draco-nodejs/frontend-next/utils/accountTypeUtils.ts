/**
 * Utility functions for checking account types.
 * Centralizes account type string comparisons to avoid hardcoded strings throughout the codebase.
 */

/**
 * Checks if the given account type string represents a Golf Individual account.
 */
export const isGolfIndividualAccountType = (accountType: string | undefined | null): boolean => {
  const normalized = accountType?.trim().toLowerCase() ?? '';
  return normalized === 'golf individual';
};

/**
 * Checks if the given account type string represents a Golf League account.
 * Note: This returns true for "golf" but false for "golf individual".
 */
export const isGolfLeagueAccountType = (accountType: string | undefined | null): boolean => {
  const normalized = accountType?.trim().toLowerCase() ?? '';
  return normalized === 'golf';
};

/**
 * Checks if the given account type string represents any Golf account (individual or league).
 */
export const isAnyGolfAccountType = (accountType: string | undefined | null): boolean => {
  return isGolfIndividualAccountType(accountType) || isGolfLeagueAccountType(accountType);
};
