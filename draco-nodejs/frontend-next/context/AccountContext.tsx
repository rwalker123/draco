'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';
import { useRole } from './RoleContext';
import { DEFAULT_TIMEZONE } from '../utils/timezones';
import { useApiClient } from '../hooks/useApiClient';
import { getAccountById } from '@draco/shared-api-client';
import { unwrapApiResult } from '../utils/apiResult';
import { ACCOUNT_STORAGE_KEY } from '../constants/storageKeys';

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

const normalizeAccountShape = (account: Account): Account => ({
  ...account,
  timeZone:
    account.timeZone && account.timeZone.trim().length > 0 ? account.timeZone : DEFAULT_TIMEZONE,
  timeZoneSource:
    account.timeZoneSource ??
    (account.timeZone && account.timeZone.trim().length > 0 ? 'account' : 'fallback'),
});

const readPersistedAccount = (): Account | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored) as Account;
    if (!parsed?.id) {
      return null;
    }
    return normalizeAccountShape(parsed);
  } catch {
    return null;
  }
};

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const { token, loading: authLoading } = useAuth();
  const { userRoles, loading: roleLoading } = useRole();
  const apiClient = useApiClient();
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const requestedAccountIdRef = useRef<string | null>(null);
  const hasRestoredFromStorageRef = useRef(false);

  // Restore persisted account from localStorage after hydration.
  // This must run once on mount to sync with browser storage.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- legitimate one-time hydration sync */
    if (hasRestoredFromStorageRef.current) {
      return;
    }
    hasRestoredFromStorageRef.current = true;
    const persisted = readPersistedAccount();
    if (persisted) {
      setCurrentAccount(persisted);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const normalizeAccount = useCallback(
    (account: Account): Account => normalizeAccountShape(account),
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

  const resolveAccountDetails = useCallback(
    async (accountId: string) => {
      const result = await getAccountById({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to fetch account');
      const account = data.account;

      return {
        id: account.id,
        name: account.name,
        accountType: account.configuration?.accountType?.name ?? undefined,
        timeZone: account.configuration?.timeZone ?? DEFAULT_TIMEZONE,
        timeZoneSource: 'account' as const,
      };
    },
    [apiClient],
  );

  const hasRoles = (userRoles?.contactRoles?.length ?? 0) > 0;
  const accountId = userRoles?.accountId ?? null;

  useEffect(() => {
    if (authLoading || roleLoading) {
      return;
    }

    if (!token || !accountId || !hasRoles) {
      requestedAccountIdRef.current = null;
      return;
    }

    if (requestedAccountIdRef.current === accountId) {
      return;
    }

    requestedAccountIdRef.current = accountId;
    let cancelled = false;

    resolveAccountDetails(accountId)
      .then((account) => {
        if (cancelled) {
          return;
        }
        handleSetCurrentAccount(account);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to fetch account');
      });

    return () => {
      cancelled = true;
    };
  }, [
    accountId,
    authLoading,
    handleSetCurrentAccount,
    hasRoles,
    resolveAccountDetails,
    roleLoading,
    token,
  ]);

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
        requestedAccountIdRef.current = null;
        return;
      }
      try {
        const parsed = JSON.parse(event.newValue) as Account;
        if (parsed?.id) {
          setCurrentAccount(normalizeAccount(parsed));
          requestedAccountIdRef.current = null;
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
    requestedAccountIdRef.current = null;
    persistAccount(null);
  };

  const requiresAccountSelection = Boolean(token && accountId && hasRoles);
  const awaitingAuthOrRole = authLoading || roleLoading;
  const awaitingAccountData = requiresAccountSelection && !currentAccount && error === null;
  const loading = awaitingAuthOrRole || awaitingAccountData;
  const initialized =
    !awaitingAuthOrRole && (!requiresAccountSelection || currentAccount !== null || error !== null);

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

export const useIsIndividualGolfAccount = (): boolean => {
  const { currentAccount } = useAccount();
  const accountType = currentAccount?.accountType?.toLowerCase() ?? '';
  return accountType.includes('golf individual');
};
