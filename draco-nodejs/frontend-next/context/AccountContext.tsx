'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useSyncExternalStore,
  ReactNode,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';
import { useRole } from './RoleContext';
import { DEFAULT_TIMEZONE } from '../utils/timezones';
import { useApiClient } from '../hooks/useApiClient';
import { getAccountById } from '@draco/shared-api-client';
import { unwrapApiResult } from '../utils/apiResult';
import { ACCOUNT_STORAGE_KEY } from '../constants/storageKeys';
import { isGolfIndividualAccountType } from '../utils/accountTypeUtils';

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

const createAccountStorageStore = () => {
  let cachedAccount: Account | null = null;
  let cachedRaw: string | null = null;

  const getSnapshot = (): Account | null => {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedAccount = readPersistedAccount();
    }
    return cachedAccount;
  };

  const subscribe = (callback: () => void) => {
    if (typeof window === 'undefined') return () => {};
    const handler = (event: StorageEvent) => {
      if (event.key === ACCOUNT_STORAGE_KEY) {
        cachedRaw = event.newValue;
        cachedAccount = readPersistedAccount();
        callback();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  };

  const invalidate = () => {
    cachedRaw = null;
    cachedAccount = null;
  };

  return { getSnapshot, subscribe, invalidate };
};

const accountStorageStore = createAccountStorageStore();

const getAccountServerSnapshot = (): Account | null => null;

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const { token, loading: authLoading } = useAuth();
  const { userRoles, loading: roleLoading } = useRole();
  const apiClient = useApiClient();
  const [fetchedAccount, setFetchedAccount] = useState<Account | null>(null);
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const requestedAccountIdRef = useRef<string | null>(null);

  const persistedAccount = useSyncExternalStore(
    accountStorageStore.subscribe,
    accountStorageStore.getSnapshot,
    getAccountServerSnapshot,
  );

  const currentAccount = fetchedAccount ?? persistedAccount;

  const normalizeAccount = (account: Account): Account => normalizeAccountShape(account);

  const persistAccount = (account: Account | null) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (account) {
        window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account));
      } else {
        window.localStorage.removeItem(ACCOUNT_STORAGE_KEY);
      }
      accountStorageStore.invalidate();
    } catch {}
  };

  const handleSetCurrentAccount = (account: Account) => {
    const normalized = normalizeAccount(account);
    setFetchedAccount(normalized);
    persistAccount(normalized);
  };

  const resolveAccountDetails = async (accountId: string, signal?: AbortSignal) => {
    const result = await getAccountById({
      client: apiClient,
      path: { accountId },
      signal,
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
  };

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
    const controller = new AbortController();

    resolveAccountDetails(accountId, controller.signal)
      .then((account) => {
        if (controller.signal.aborted) return;
        handleSetCurrentAccount(account);
        setError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch account');
      });

    return () => {
      controller.abort();
    };
  }, [accountId, authLoading, hasRoles, roleLoading, token, apiClient]);

  const clearAccounts = () => {
    setFetchedAccount(null);
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
  return isGolfIndividualAccountType(currentAccount?.accountType);
};
