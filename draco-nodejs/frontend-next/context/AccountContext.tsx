'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useAuth } from './AuthContext';
import { useRole } from './RoleContext';
import { DEFAULT_TIMEZONE } from '../utils/timezones';
import { useApiClient } from '../hooks/useApiClient';
import { getAccountById } from '@draco/shared-api-client';
import { unwrapApiResult } from '../utils/apiResult';

interface Account {
  id: string;
  name: string;
  accountType?: string;
  timeZone?: string;
  timeZoneSource?: 'account' | 'fallback';
}

export interface AccountContextType {
  currentAccount: Account | null;
  userAccounts: Account[];
  loading: boolean;
  initialized: boolean;
  error: string | null;
  setCurrentAccount: (account: Account) => void;
  clearAccounts: () => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const { token, loading: authLoading } = useAuth();
  const { userRoles, loading: roleLoading } = useRole();
  const apiClient = useApiClient();
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeAccount = useCallback(
    (account: Account): Account => ({
      ...account,
      timeZone:
        account.timeZone && account.timeZone.trim().length > 0
          ? account.timeZone
          : DEFAULT_TIMEZONE,
      timeZoneSource:
        account.timeZoneSource ??
        (account.timeZone && account.timeZone.trim().length > 0
          ? 'account'
          : 'fallback'),
    }),
    [],
  );

  const fetchAccountDetails = useCallback(
    async (accountId: string) => {
      try {
        setLoading(true);
        setError(null);

        const result = await getAccountById({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });

        const data = unwrapApiResult(result, 'Failed to fetch account');
        const account = data.account;

        setCurrentAccount({
          id: account.id,
          name: account.name,
          accountType: account.configuration?.accountType?.name ?? undefined,
          timeZone: account.configuration?.timeZone ?? DEFAULT_TIMEZONE,
          timeZoneSource: 'account',
        });

        setLoading(false);
        setInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch account');
        setLoading(false);
        setInitialized(true);
      }
    },
    [apiClient],
  );

  const handleSetCurrentAccount = useCallback(
    (account: Account) => {
      setCurrentAccount(normalizeAccount(account));
    },
    [normalizeAccount],
  );

  // Manage loading state based on dependencies
  useEffect(() => {
    if (authLoading || roleLoading) {
      setLoading(true);
      setInitialized(false);
    } else if (token && userRoles && (userRoles.contactRoles?.length ?? 0) > 0) {
      const primaryAccountId = userRoles.accountId;
      if (
        !currentAccount ||
        currentAccount.id !== primaryAccountId ||
        currentAccount.timeZoneSource !== 'account'
      ) {
        if (primaryAccountId) {
          fetchAccountDetails(primaryAccountId).catch(() => {
            // Error state handled in fetchAccountDetails
          });
        }
      } else {
        setLoading(false);
        setInitialized(true);
      }
    } else if (!token || !userRoles) {
      setLoading(false);
      setCurrentAccount(null);
      setInitialized(true);
    } else {
      setLoading(false);
      setInitialized(true);
    }
  }, [authLoading, roleLoading, token, userRoles, currentAccount, fetchAccountDetails]);

  const clearAccounts = () => {
    setCurrentAccount(null);
    setUserAccounts([]);
    setError(null);
    setInitialized(true);
  };

  return (
    <AccountContext.Provider
      value={{
        currentAccount,
        userAccounts,
        loading,
        initialized,
        error,
        setCurrentAccount: handleSetCurrentAccount,
        clearAccounts,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};

export const useAccountTimezone = (): string => {
  const { currentAccount } = useAccount();
  return currentAccount?.timeZone ?? DEFAULT_TIMEZONE;
};
