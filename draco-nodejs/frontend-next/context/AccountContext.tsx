"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useRole } from './RoleContext';

interface Account {
  id: string;
  name: string;
  accountType?: string;
}

interface AccountContextType {
  currentAccount: Account | null;
  userAccounts: Account[];
  loading: boolean;
  error: string | null;
  setCurrentAccount: (account: Account) => void;
  fetchUserAccounts: () => Promise<void>;
  hasAccessToAccount: (accountId: string) => boolean;
  clearAccounts: () => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

// Type guard for AxiosError
export function isAxiosError(error: unknown): error is { response: { data: { message: string } } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
  );
}

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const { userRoles } = useRole();
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with a default account if user has roles
  useEffect(() => {
    if (userRoles && userRoles.contactRoles.length > 0) {
      // Get the first account the user has access to
      const firstAccount = userRoles.contactRoles[0];
      setCurrentAccount({
        id: firstAccount.accountId,
        name: `Account ${firstAccount.accountId}` // You might want to fetch the actual account name
      });
    }
  }, [userRoles]);

  const fetchUserAccounts = async () => {
    if (!token || !userRoles) return;

    setLoading(true);
    setError(null);
    try {
      // This would be an API call to get accounts the user has access to
      // For now, we'll use the accounts from userRoles
      const accounts: Account[] = userRoles.contactRoles.map(role => ({
        id: role.accountId,
        name: `Account ${role.accountId}` // In a real app, you'd fetch the actual account names
      }));

      setUserAccounts(accounts);
      
      // Set current account if none is set
      if (!currentAccount && accounts.length > 0) {
        setCurrentAccount(accounts[0]);
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response.data.message);
      } else {
        setError('Failed to fetch user accounts');
      }
    } finally {
      setLoading(false);
    }
  };

  const hasAccessToAccount = (accountId: string): boolean => {
    if (!userRoles) return false;

    // Check global roles first - Administrator has access to all accounts
    for (const globalRole of userRoles.globalRoles) {
      if (globalRole === 'Administrator' || globalRole === '93DAC465-4C64-4422-B444-3CE79C549329') {
        return true; // Administrator has access to all accounts
      }
    }

    // Check contact roles
    return userRoles.contactRoles.some(role => role.accountId === accountId);
  };

  const clearAccounts = () => {
    setCurrentAccount(null);
    setUserAccounts([]);
    setError(null);
  };

  return (
    <AccountContext.Provider value={{
      currentAccount,
      userAccounts,
      loading,
      error,
      setCurrentAccount,
      fetchUserAccounts,
      hasAccessToAccount,
      clearAccounts
    }}>
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