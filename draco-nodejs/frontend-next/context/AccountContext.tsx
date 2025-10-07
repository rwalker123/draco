'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useRole } from './RoleContext';
import { DEFAULT_TIMEZONE } from '../utils/timezones';

interface Account {
  id: string;
  name: string;
  accountType?: string;
  timeZone?: string;
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
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manage loading state based on dependencies
  useEffect(() => {
    if (authLoading || roleLoading) {
      setLoading(true);
      setInitialized(false);
    } else if (token && userRoles && !currentAccount && userRoles.contactRoles.length > 0) {
      setLoading(true);
      setCurrentAccount({
        id: userRoles.accountId,
        name: `Account ${userRoles.accountId}`, // You might want to fetch the actual account name
        timeZone: DEFAULT_TIMEZONE,
      });
      setLoading(false);
      setInitialized(true);
    } else if (!token || !userRoles) {
      setLoading(false);
      setCurrentAccount(null);
      setInitialized(true);
    } else {
      setLoading(false);
      setInitialized(true);
    }
  }, [authLoading, roleLoading, token, userRoles, currentAccount]);

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
        setCurrentAccount,
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
