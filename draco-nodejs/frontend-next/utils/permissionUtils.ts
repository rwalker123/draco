/**
 * Utility functions for common permission checking patterns
 */

/**
 * Checks if user has administrative permissions for an account (Administrator or AccountAdmin)
 * @param hasRole - The hasRole function from useRole hook
 * @param accountId - Account ID for AccountAdmin scope check (required for AccountAdmin)
 * @returns true if user has admin permissions for the account
 */
export const isAccountAdministrator = (
  hasRole: (role: string, context?: { accountId: string }) => boolean,
  accountId?: string,
): boolean => {
  if (hasRole('Administrator')) {
    return true;
  }

  if (accountId && hasRole('AccountAdmin', { accountId })) {
    return true;
  }

  return false;
};
