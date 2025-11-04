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

export const ACCOUNT_STORAGE_KEY = 'draco:selected-account';

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
        (account.timeZone && account.timeZone.trim().length > 0 ? 'account' : 'fallback'),
    }),
    [],
  );

  const persistAccount = useCallback((account: Account | null) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (account) {
        window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account));
      } else {
        window.localStorage.removeItem(ACCOUNT_STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures
    }
  }, []);

  const handleSetCurrentAccount = useCallback(
    (account: Account) => {
      const normalized = normalizeAccount(account);
      setCurrentAccount(normalized);
      persistAccount(normalized);
    },
    [normalizeAccount, persistAccount],
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

        handleSetCurrentAccount({
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
    [apiClient, handleSetCurrentAccount],
  );

  // Manage loading state based on dependencies
  useEffect(() => {
    if (authLoading || roleLoading) {
      setLoading(true);
      setInitialized(false);
      return;
    }

    if (!token) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    if (!userRoles) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    const hasRoles = (userRoles.contactRoles?.length ?? 0) > 0;
    if (!hasRoles) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    if (!currentAccount && userRoles.accountId) {
      fetchAccountDetails(userRoles.accountId).catch(() => {
        // Error state handled within fetchAccountDetails
      });
      return;
    }

    setLoading(false);
    setInitialized(true);
  }, [
    authLoading,
    roleLoading,
    token,
    userRoles,
    currentAccount,
    fetchAccountDetails,
    persistAccount,
  ]);

  // Hydrate from localStorage on mount/refresh
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored) as Account;
      if (parsed?.id) {
        handleSetCurrentAccount(parsed);
        if (token) {
          fetchAccountDetails(parsed.id).catch(() => {
            // Ignore, already have persisted data
          });
        }
      }
    } catch {
      // Ignore malformed storage
    }
  }, [fetchAccountDetails, handleSetCurrentAccount, token]);

  // Sync across tabs
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ACCOUNT_STORAGE_KEY) {
        return;
      }
      if (!event.newValue) {
        setCurrentAccount(null);
        return;
      }
      try {
        const parsed = JSON.parse(event.newValue) as Account;
        if (parsed?.id) {
          setCurrentAccount(normalizeAccount(parsed));
        }
      } catch {
        // Ignore
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [normalizeAccount]);

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
